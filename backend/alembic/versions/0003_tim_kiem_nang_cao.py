"""tìm kiếm nâng cao: khớp cụm liền, sửa lỗi gõ theo từ vựng tiêu đề, từ ghép; bảng cum_tu, chu_de

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-06

Thiết kế (chi tiết ở outputs/reports/chang4_tom_tat.md):
- tim_tai_lieu cũ khớp mọi tiêu đề chứa đủ các âm tiết ở bất kỳ đâu (plainto_tsquery cấu hình 'simple')
  hoặc giống trigram >= 0,6 (`<%`, quét tuần tự) -> "học máy" khớp "bộ máy ... học", "dệt may".
- tim_tai_lieu mới, theo tầng:
  1. Cụm liền: phraseto_tsquery (dùng chỉ mục GIN idx_tai_lieu_tsv).
  2. Nếu tầng 1 có < 10 kết quả và truy vấn tách được thành >= 2 từ ghép (từ điển từ ghép do pyvi tách từ
     tiêu đề, bảng cum_tu.la_tu_ghep): thêm tư liệu chứa đủ các từ ghép, mỗi từ ghép liền
     ("lưu trữ hồ sơ" khớp "hồ sơ ... lưu trữ").
  3. Nếu tầng 1+2 có <= 3 kết quả: sửa lỗi gõ (sua_cum) bằng khoảng cách Levenshtein (chèn/xóa 1, thay 2)
     tới các cụm có thật trong tiêu đề (cum_tu, >= 3 tư liệu); chỉ nhận khi cụm sửa phổ biến hơn hẳn.
     Không dùng trigram trên toàn tiêu đề nữa.
- goi_y_sua_cum(q): dạng có dấu của cụm sửa (API /tim-kiem trả ở goi_y_sua).
- quy_ve_cum(q): dạng chuẩn để gộp biến thể trong log (cột log_tim_kiem.tu_khoa_quy_ve, trigger tự điền).
"""
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

# Không dùng ký tự ':' theo sau là chữ (text() sẽ hiểu là tham số); ':=' và '::' thì an toàn.
CAU_LENH_UPGRADE = [
    "CREATE EXTENSION IF NOT EXISTS fuzzystrmatch",
    # --- Từ vựng tiêu đề (do pipeline.tach_tu điền) ---
    """
    CREATE TABLE cum_tu (
      cum         text PRIMARY KEY,          -- cụm 1–4 âm tiết đã bỏ dấu, chữ thường
      so_am_tiet  smallint NOT NULL,
      do_dai      smallint NOT NULL,
      so_tai_lieu int NOT NULL,              -- số tư liệu có cụm trong tiêu đề
      hien_thi    text NOT NULL,             -- dạng có dấu phổ biến nhất
      la_tu_ghep  boolean NOT NULL DEFAULT false
    )
    """,
    "CREATE INDEX idx_cum_tu_do_dai ON cum_tu (so_am_tiet, do_dai)",
    # --- Chủ đề (pipeline.tuong_tu điền; dùng cho ThemeRiver chặng 5) ---
    """
    CREATE TABLE chu_de (
      id              serial PRIMARY KEY,
      nhan            varchar(200) NOT NULL,
      tu_khoa_noi_bat text[] NOT NULL DEFAULT '{}'
    )
    """,
    "ALTER TABLE tai_lieu ADD COLUMN chu_de_id int REFERENCES chu_de(id) ON DELETE SET NULL",
    "CREATE INDEX idx_tai_lieu_chu_de ON tai_lieu (chu_de_id)",
    # --- Dạng chuẩn của từ khóa trong log (gộp không dấu / lỗi gõ) ---
    "ALTER TABLE log_tim_kiem ADD COLUMN tu_khoa_quy_ve text",
    "CREATE INDEX idx_log_quy_ve ON log_tim_kiem (tu_khoa_quy_ve)",
    # --- Hàm phụ ---
    r"""
    CREATE OR REPLACE FUNCTION tach_am_tiet(text) RETURNS text[]
    LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
    $$ SELECT array_remove(regexp_split_to_array(btrim(regexp_replace($1, '[^a-z0-9]+', ' ', 'g')), ' '), '') $$
    """,
    # Tầng 2: tách truy vấn (đã chuẩn hóa) thành các từ ghép theo cum_tu.la_tu_ghep, ghép tham lam dài trước.
    # Trả NULL nếu còn âm tiết lẻ hoặc chỉ được 1 từ ghép (khi đó tầng 1 đã đủ).
    """
    CREATE OR REPLACE FUNCTION tsquery_tu_ghep(p_qn text) RETURNS tsquery
    LANGUAGE plpgsql STABLE AS
    $$
    DECLARE
      v_tu text[] := tach_am_tiet(p_qn);
      v_k int := coalesce(cardinality(tach_am_tiet(p_qn)), 0);
      i int := 1;
      n int;
      v_cum text;
      v_tq tsquery;
      v_so int := 0;
      v_thay boolean;
    BEGIN
      IF v_k < 4 THEN
        RETURN NULL;
      END IF;
      WHILE i <= v_k LOOP
        v_thay := false;
        FOR n IN REVERSE least(4, v_k - i + 1)..2 LOOP
          v_cum := array_to_string(v_tu[i:i + n - 1], ' ');
          IF EXISTS (SELECT 1 FROM cum_tu c WHERE c.cum = v_cum AND c.la_tu_ghep) THEN
            v_tq := CASE WHEN v_tq IS NULL THEN phraseto_tsquery('simple', v_cum)
                         ELSE v_tq && phraseto_tsquery('simple', v_cum) END;
            v_so := v_so + 1;
            i := i + n;
            v_thay := true;
            EXIT;
          END IF;
        END LOOP;
        IF NOT v_thay THEN
          RETURN NULL;
        END IF;
      END LOOP;
      IF v_so < 2 THEN
        RETURN NULL;
      END IF;
      RETURN v_tq;
    END
    $$
    """,
    # Số tư liệu khớp tầng 1 + tầng 2 (không sửa lỗi)
    """
    CREATE OR REPLACE FUNCTION dem_khop(p_qn text) RETURNS int
    LANGUAGE plpgsql STABLE AS
    $$
    DECLARE
      v_tq tsquery := phraseto_tsquery('simple', p_qn);
      v_tq2 tsquery;
      v_n int := 0;
    BEGIN
      IF numnode(v_tq) = 0 THEN
        RETURN 0;
      END IF;
      SELECT count(*) INTO v_n FROM tai_lieu t WHERE t.tsv @@ v_tq;
      IF v_n < 10 THEN
        v_tq2 := tsquery_tu_ghep(p_qn);
        IF v_tq2 IS NOT NULL THEN
          SELECT count(*) INTO v_n FROM tai_lieu t WHERE t.tsv @@ v_tq OR t.tsv @@ v_tq2;
        END IF;
      END IF;
      RETURN v_n;
    END
    $$
    """,
    # Tầng 3: sửa lỗi gõ (một bước). p_so_kq = số kết quả khi chưa sửa. "Cụm phổ biến" = có trong >= 4
    # tiêu đề (tức là bản thân nó không phải truy vấn "ít kết quả", tránh sửa về một lỗi gõ có sẵn trong tiêu đề).
    #  a) Cụm <= 4 âm tiết: ứng viên là cụm phổ biến cùng số âm tiết có Levenshtein (chèn 1, xóa 1, thay 2)
    #     <= 1 nếu truy vấn ngắn hơn 8 ký tự, <= 2 nếu dài hơn; hoặc cụm phổ biến bằng truy vấn đổi chỗ hai ký tự
    #     liền nhau (tính chi phí 1, kể cả đổi chỗ với dấu cách: "con gty" -> "cong ty"). Chọn gần nhất rồi phổ
    #     biến nhất. Nhận khi truy vấn 0 kết quả, hoặc <= 3 kết quả và cụm sửa có >= 10 lần số đó.
    #     Thay ký tự tính 2 nên "hoc may" không bị sửa thành "hoc mai"/"hoc may" khác nghĩa.
    #  b) Nếu vẫn 0 kết quả: sửa từng âm tiết lạ (không có trong từ vựng, dài >= 3) về âm tiết phổ biến gần
    #     nhất (khoảng cách 1); chỉ nhận khi cụm sửa có kết quả.
    """
    CREATE OR REPLACE FUNCTION sua_cum_mot_buoc(p_qn text, p_so_kq int)
    RETURNS TABLE (cum text, hien_thi text)
    LANGUAGE plpgsql STABLE AS
    $$
    DECLARE
      v_tu text[];
      v_q text;
      v_k int;
      v_max int;
      v_cum text;
      v_ht text;
      v_df int;
      v_t text;
      v_thay text;
      v_moi text[] := '{}';
      v_hien text[] := '{}';
      v_doi boolean := false;
    BEGIN
      IF p_qn IS NULL OR length(p_qn) > 80 THEN
        RETURN;
      END IF;
      v_tu := tach_am_tiet(p_qn);
      v_k := coalesce(cardinality(v_tu), 0);
      IF v_k = 0 THEN
        RETURN;
      END IF;
      v_q := array_to_string(v_tu, ' ');
      v_max := CASE WHEN length(v_q) >= 8 THEN 2 ELSE 1 END;
      IF v_k <= 4 THEN
        SELECT u.cum, u.hien_thi, u.so_tai_lieu INTO v_cum, v_ht, v_df
        FROM (
          SELECT c.cum, c.hien_thi, c.so_tai_lieu, levenshtein(v_q, c.cum, 1, 1, 2) AS chi_phi
          FROM cum_tu c
          WHERE c.so_am_tiet = v_k
            AND c.do_dai BETWEEN length(v_q) - v_max AND length(v_q) + v_max
            AND c.so_tai_lieu >= 4
            AND c.cum <> v_q
            AND levenshtein_less_equal(v_q, c.cum, 1, 1, 2, v_max) <= v_max
          UNION ALL
          SELECT c.cum, c.hien_thi, c.so_tai_lieu, 1
          FROM cum_tu c
          WHERE c.so_tai_lieu >= 4
            AND c.cum <> v_q
            AND c.cum IN (SELECT substr(v_q, 1, i - 1) || substr(v_q, i + 1, 1)
                                 || substr(v_q, i, 1) || substr(v_q, i + 2)
                          FROM generate_series(1, length(v_q) - 1) i)
        ) u
        ORDER BY u.chi_phi, u.so_tai_lieu DESC, u.cum
        LIMIT 1;
        IF v_cum IS NOT NULL AND (p_so_kq = 0 OR (p_so_kq <= 3 AND v_df >= 10 * p_so_kq)) THEN
          RETURN QUERY SELECT v_cum, v_ht;
          RETURN;
        END IF;
      END IF;
      IF p_so_kq > 0 THEN
        RETURN;
      END IF;
      FOREACH v_t IN ARRAY v_tu LOOP
        v_thay := NULL;
        IF length(v_t) >= 3 AND NOT EXISTS (SELECT 1 FROM cum_tu c WHERE c.cum = v_t) THEN
          SELECT c.cum INTO v_thay
          FROM cum_tu c
          WHERE c.so_am_tiet = 1
            AND c.do_dai BETWEEN length(v_t) - 1 AND length(v_t) + 1
            AND c.so_tai_lieu >= 4
            AND levenshtein(v_t, c.cum, 1, 1, 2) <= 1
          ORDER BY c.so_tai_lieu DESC, c.cum
          LIMIT 1;
        END IF;
        IF v_thay IS NOT NULL THEN
          v_doi := true;
          v_moi := v_moi || v_thay;
        ELSE
          v_moi := v_moi || v_t;
        END IF;
        v_hien := v_hien || coalesce((SELECT c.hien_thi FROM cum_tu c WHERE c.cum = coalesce(v_thay, v_t)),
                                     coalesce(v_thay, v_t));
      END LOOP;
      IF v_doi THEN
        v_cum := array_to_string(v_moi, ' ');
        IF EXISTS (SELECT 1 FROM tai_lieu t WHERE t.tsv @@ phraseto_tsquery('simple', v_cum)) THEN
          RETURN QUERY SELECT v_cum,
                              coalesce((SELECT c.hien_thi FROM cum_tu c WHERE c.cum = v_cum),
                                       array_to_string(v_hien, ' '));
        END IF;
      END IF;
    END
    $$
    """,
    # Sửa lỗi gõ có nối bước: nếu cụm sửa vẫn "ít kết quả" (ví dụ "lu utru" -> "lu tru", vốn là lỗi gõ có sẵn
    # trong 2–3 tiêu đề) thì sửa thêm một bước ("lu tru" -> "luu tru").
    """
    CREATE OR REPLACE FUNCTION sua_cum(p_qn text, p_so_kq int)
    RETURNS TABLE (cum text, hien_thi text)
    LANGUAGE plpgsql STABLE AS
    $$
    DECLARE
      v_cum text;
      v_ht text;
      v_cum2 text;
      v_ht2 text;
      v_n2 int;
    BEGIN
      SELECT s.cum, s.hien_thi INTO v_cum, v_ht FROM sua_cum_mot_buoc(p_qn, p_so_kq) s;
      IF v_cum IS NULL THEN
        RETURN;
      END IF;
      v_n2 := dem_khop(v_cum);
      IF v_n2 <= 3 THEN
        SELECT s.cum, s.hien_thi INTO v_cum2, v_ht2 FROM sua_cum_mot_buoc(v_cum, v_n2) s;
        IF v_cum2 IS NOT NULL AND v_cum2 <> p_qn THEN
          v_cum := v_cum2;
          v_ht := v_ht2;
        END IF;
      END IF;
      RETURN QUERY SELECT v_cum, v_ht;
    END
    $$
    """,
    # Gợi ý "Có phải bạn muốn tìm …?" (dạng có dấu) hoặc NULL
    """
    CREATE OR REPLACE FUNCTION goi_y_sua_cum(p_q text) RETURNS text
    LANGUAGE plpgsql STABLE AS
    $$
    DECLARE
      v_qn text := f_chuan_hoa(p_q);
      v_n int;
      v_ht text;
    BEGIN
      IF v_qn IS NULL OR length(v_qn) < 2 THEN
        RETURN NULL;
      END IF;
      v_n := dem_khop(v_qn);
      IF v_n > 3 THEN
        RETURN NULL;
      END IF;
      SELECT s.hien_thi INTO v_ht FROM sua_cum(v_qn, v_n) s;
      RETURN v_ht;
    END
    $$
    """,
    # Dạng chuẩn để gộp biến thể từ khóa: cụm đã sửa nếu có, ngược lại f_chuan_hoa(q)
    """
    CREATE OR REPLACE FUNCTION quy_ve_cum(p_q text) RETURNS text
    LANGUAGE plpgsql STABLE AS
    $$
    DECLARE
      v_qn text := f_chuan_hoa(p_q);
      v_n int;
      v_cum text;
    BEGIN
      IF v_qn IS NULL OR length(v_qn) < 2 THEN
        RETURN v_qn;
      END IF;
      v_n := dem_khop(v_qn);
      IF v_n <= 3 THEN
        SELECT s.cum INTO v_cum FROM sua_cum(v_qn, v_n) s;
      END IF;
      RETURN coalesce(v_cum, v_qn);
    END
    $$
    """,
    """
    CREATE OR REPLACE FUNCTION trg_log_quy_ve() RETURNS trigger
    LANGUAGE plpgsql AS
    $$
    BEGIN
      IF NEW.tu_khoa_quy_ve IS NULL THEN
        NEW.tu_khoa_quy_ve := quy_ve_cum(NEW.tu_khoa);
      END IF;
      RETURN NEW;
    END
    $$
    """,
    "CREATE TRIGGER log_quy_ve BEFORE INSERT ON log_tim_kiem FOR EACH ROW EXECUTE FUNCTION trg_log_quy_ve()",
    # --- Hàm tìm kiếm mới (cùng chữ ký với bản cũ: API, seed, quản lý dùng chung) ---
    # Điểm: 3 = khớp cụm (hoặc cụm đã sửa khi có sửa); 2 = khớp cụm gõ nguyên văn khi đã có sửa;
    #        1 = chỉ khớp đủ các từ ghép; cộng ts_rank để xếp trong cùng tầng.
    """
    CREATE OR REPLACE FUNCTION tim_tai_lieu(p_q text)
    RETURNS TABLE (tai_lieu_id int, diem real)
    LANGUAGE plpgsql STABLE AS
    $$
    DECLARE
      v_qn text := f_chuan_hoa(p_q);
      v_tq tsquery;
      v_tq2 tsquery;
      v_tqs tsquery;
      v_n int := 0;
      v_sua text;
    BEGIN
      IF v_qn IS NULL OR length(v_qn) < 2 THEN
        RETURN;
      END IF;
      v_tq := phraseto_tsquery('simple', v_qn);
      IF numnode(v_tq) = 0 THEN
        RETURN;
      END IF;
      SELECT count(*) INTO v_n FROM tai_lieu t WHERE t.tsv @@ v_tq;
      IF v_n < 10 THEN
        v_tq2 := tsquery_tu_ghep(v_qn);
        IF v_tq2 IS NOT NULL THEN
          SELECT count(*) INTO v_n FROM tai_lieu t WHERE t.tsv @@ v_tq OR t.tsv @@ v_tq2;
        END IF;
      END IF;
      IF v_n <= 3 THEN
        SELECT s.cum INTO v_sua FROM sua_cum(v_qn, v_n) s;
        IF v_sua IS NOT NULL THEN
          v_tqs := phraseto_tsquery('simple', v_sua);
        END IF;
      END IF;
      RETURN QUERY
        SELECT t.id,
               (CASE WHEN v_tqs IS NOT NULL AND t.tsv @@ v_tqs THEN 3 + ts_rank(t.tsv, v_tqs)
                     WHEN t.tsv @@ v_tq THEN (CASE WHEN v_tqs IS NULL THEN 3 ELSE 2 END) + ts_rank(t.tsv, v_tq)
                     ELSE 1 + ts_rank(t.tsv, v_tq2) END)::real
        FROM tai_lieu t
        WHERE t.tsv @@ v_tq
           OR (v_tq2 IS NOT NULL AND t.tsv @@ v_tq2)
           OR (v_tqs IS NOT NULL AND t.tsv @@ v_tqs);
    END
    $$
    """,
]

# Hàm tìm kiếm của 0002 (khôi phục khi downgrade)
TIM_TAI_LIEU_CU = """
CREATE OR REPLACE FUNCTION tim_tai_lieu(p_q text)
RETURNS TABLE (tai_lieu_id int, diem real)
LANGUAGE sql STABLE AS
$$
  WITH q AS (
    SELECT f_chuan_hoa(p_q) AS qn, plainto_tsquery('simple', f_chuan_hoa(p_q)) AS tq
  )
  SELECT t.id,
         (ts_rank(t.tsv, q.tq) * 2 + word_similarity(q.qn, f_unaccent(lower(t.tieu_de))))::real
  FROM tai_lieu t, q
  WHERE length(q.qn) >= 2
    AND (t.tsv @@ q.tq OR q.qn <% f_unaccent(lower(t.tieu_de)))
$$
"""


def upgrade() -> None:
    for cau_lenh in CAU_LENH_UPGRADE:
        op.execute(cau_lenh)


def downgrade() -> None:
    # tim_tai_lieu phải đổi lại (DROP rồi CREATE vì bản cũ là LANGUAGE sql)
    op.execute("DROP FUNCTION IF EXISTS tim_tai_lieu(text)")
    op.execute(TIM_TAI_LIEU_CU)
    op.execute("DROP TRIGGER IF EXISTS log_quy_ve ON log_tim_kiem")
    for ham in ("trg_log_quy_ve()", "quy_ve_cum(text)", "goi_y_sua_cum(text)", "sua_cum(text, int)",
                "sua_cum_mot_buoc(text, int)", "dem_khop(text)", "tsquery_tu_ghep(text)", "tach_am_tiet(text)"):
        op.execute(f"DROP FUNCTION IF EXISTS {ham}")
    op.execute("DROP INDEX IF EXISTS idx_log_quy_ve")
    op.execute("ALTER TABLE log_tim_kiem DROP COLUMN IF EXISTS tu_khoa_quy_ve")
    op.execute("DROP INDEX IF EXISTS idx_tai_lieu_chu_de")
    op.execute("ALTER TABLE tai_lieu DROP COLUMN IF EXISTS chu_de_id")
    op.execute("DROP TABLE IF EXISTS chu_de")
    op.execute("DROP TABLE IF EXISTS cum_tu")
    op.execute("DROP EXTENSION IF EXISTS fuzzystrmatch")
