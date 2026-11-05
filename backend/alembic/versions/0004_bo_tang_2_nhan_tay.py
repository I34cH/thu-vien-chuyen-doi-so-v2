"""bỏ tầng 2 của tìm kiếm (khớp đủ các từ ghép); tìm chính xác; nhãn chủ đề tự động/sửa tay

Revision ID: 0004
Revises: 0003
Create Date: 2026-11-06

Quyết định của người dùng (06/11/2026):
- tim_tai_lieu chỉ còn hai tầng: (1) khớp cụm liền (phraseto_tsquery), (3) sửa lỗi gõ khi tầng 1 có <= 3 kết quả.
  Tầng 2 cũ ("lưu trữ hồ sơ" khớp "hồ sơ ... lưu trữ") bị bỏ: đảo thứ tự từ ghép không còn khớp, đổi lại
  không còn kết quả chứa hai từ ghép rời nhau (ví dụ "bộ máy hành chính").
- dem_khop chỉ đếm tầng 1 (goi_y_sua_cum, quy_ve_cum, sua_cum dùng hàm này nên cũng đổi theo).
- tim_tai_lieu_chinh_xac(q): chỉ khớp cụm liền nguyên văn, không sửa lỗi (API /tim-kiem?chinh_xac=1,
  lối "Tìm chính xác …" khi kết quả đang hiện theo cụm đã sửa).
- Chủ đề: chu_de.nhan_tu_dong (nhãn do pipeline sinh), chu_de.khoa (chữ ký ổn định của cụm = 5 từ nổi bật đầu,
  đã sắp xếp, nối '|'), chu_de.da_sua_tay; bảng chu_de_nhan_tay(khoa, tu_khoa, nhan) lưu nhãn thủ thư sửa tay để
  pipeline.tuong_tu áp lại sau khi gom cụm lại (pipeline.reset sao lưu bảng này qua downgrade/upgrade).
Downgrade khôi phục đúng các hàm của 0003 (có tầng 2) và xóa cột/bảng mới.
"""
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None

# Không dùng ký tự ':' theo sau là chữ (text() sẽ hiểu là tham số); ':=' và '::' thì an toàn.
DEM_KHOP_MOI = """
CREATE OR REPLACE FUNCTION dem_khop(p_qn text) RETURNS int
LANGUAGE plpgsql STABLE AS
$$
DECLARE
  v_tq tsquery := phraseto_tsquery('simple', p_qn);
  v_n int := 0;
BEGIN
  IF numnode(v_tq) = 0 THEN
    RETURN 0;
  END IF;
  SELECT count(*) INTO v_n FROM tai_lieu t WHERE t.tsv @@ v_tq;
  RETURN v_n;
END
$$
"""

# Điểm: 3 = khớp cụm (hoặc cụm đã sửa khi có sửa); 2 = khớp cụm gõ nguyên văn khi đã có sửa; cộng ts_rank.
TIM_TAI_LIEU_MOI = """
CREATE OR REPLACE FUNCTION tim_tai_lieu(p_q text)
RETURNS TABLE (tai_lieu_id int, diem real)
LANGUAGE plpgsql STABLE AS
$$
DECLARE
  v_qn text := f_chuan_hoa(p_q);
  v_tq tsquery;
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
  IF v_n <= 3 THEN
    SELECT s.cum INTO v_sua FROM sua_cum(v_qn, v_n) s;
    IF v_sua IS NOT NULL THEN
      v_tqs := phraseto_tsquery('simple', v_sua);
    END IF;
  END IF;
  RETURN QUERY
    SELECT t.id,
           (CASE WHEN v_tqs IS NOT NULL AND t.tsv @@ v_tqs THEN 3 + ts_rank(t.tsv, v_tqs)
                 ELSE (CASE WHEN v_tqs IS NULL THEN 3 ELSE 2 END) + ts_rank(t.tsv, v_tq) END)::real
    FROM tai_lieu t
    WHERE t.tsv @@ v_tq
       OR (v_tqs IS NOT NULL AND t.tsv @@ v_tqs);
END
$$
"""

# Tìm chính xác: chỉ khớp cụm liền nguyên văn (sau chuẩn hóa), không sửa lỗi gõ.
TIM_CHINH_XAC = """
CREATE OR REPLACE FUNCTION tim_tai_lieu_chinh_xac(p_q text)
RETURNS TABLE (tai_lieu_id int, diem real)
LANGUAGE plpgsql STABLE AS
$$
DECLARE
  v_qn text := f_chuan_hoa(p_q);
  v_tq tsquery;
BEGIN
  IF v_qn IS NULL OR length(v_qn) < 2 THEN
    RETURN;
  END IF;
  v_tq := phraseto_tsquery('simple', v_qn);
  IF numnode(v_tq) = 0 THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT t.id, (3 + ts_rank(t.tsv, v_tq))::real FROM tai_lieu t WHERE t.tsv @@ v_tq;
END
$$
"""

CAU_LENH_UPGRADE = [
    DEM_KHOP_MOI,
    TIM_TAI_LIEU_MOI,
    TIM_CHINH_XAC,
    "DROP FUNCTION IF EXISTS tsquery_tu_ghep(text)",
    # --- Nhãn chủ đề tự động / sửa tay ---
    "ALTER TABLE chu_de ADD COLUMN nhan_tu_dong varchar(200)",
    "ALTER TABLE chu_de ADD COLUMN khoa text",
    "ALTER TABLE chu_de ADD COLUMN da_sua_tay boolean NOT NULL DEFAULT false",
    "UPDATE chu_de SET nhan_tu_dong = nhan WHERE nhan_tu_dong IS NULL",
    """
    CREATE TABLE chu_de_nhan_tay (
      khoa      text PRIMARY KEY,                -- chữ ký cụm: 5 từ nổi bật đầu, sắp xếp, nối '|'
      tu_khoa   text[] NOT NULL DEFAULT '{}',    -- từ nổi bật của cụm lúc sửa (để khớp gần đúng khi cụm đổi nhẹ)
      nhan      varchar(200) NOT NULL,
      cap_nhat  timestamptz NOT NULL DEFAULT now()
    )
    """,
]

# ---------------------------------------------------------------- Hàm của 0003 (khôi phục khi downgrade)
TSQUERY_TU_GHEP_0003 = """
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
"""

DEM_KHOP_0003 = """
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
"""

TIM_TAI_LIEU_0003 = """
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
"""


def upgrade() -> None:
    for cau_lenh in CAU_LENH_UPGRADE:
        op.execute(cau_lenh)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS chu_de_nhan_tay")
    for cot in ("da_sua_tay", "khoa", "nhan_tu_dong"):
        op.execute(f"ALTER TABLE chu_de DROP COLUMN IF EXISTS {cot}")
    op.execute("DROP FUNCTION IF EXISTS tim_tai_lieu_chinh_xac(text)")
    op.execute(TSQUERY_TU_GHEP_0003)
    op.execute(DEM_KHOP_0003)
    op.execute(TIM_TAI_LIEU_0003)
