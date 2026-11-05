"""tạo 8 bảng, hàm SQL tìm kiếm, chỉ mục và view thống kê

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-05

Bảng, hàm và view giữ đúng như v1 (db/schema.sql, db/views.sql), thêm luot_doc và tai_lieu_tuong_tu.
"""
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

# Mỗi phần tử là một câu lệnh SQL (không dùng ký tự ':' ngoài '::' để text() không hiểu nhầm là tham số)
CAU_LENH_UPGRADE = [
    # --- Hàm bỏ dấu / chuẩn hóa (IMMUTABLE để dùng trong index và cột sinh) ---
    """
    CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
    $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$
    """,
    r"""
    CREATE OR REPLACE FUNCTION f_chuan_hoa(text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
    $$ SELECT lower(f_unaccent(regexp_replace(btrim($1), '\s+', ' ', 'g'))) $$
    """,
    # --- Bảng ---
    """
    CREATE TABLE ma_van_de (
      ma  varchar(20) PRIMARY KEY,
      ten varchar(200)
    )
    """,
    """
    CREATE TABLE tai_lieu (
      id                serial PRIMARY KEY,
      ky_hieu           varchar(40) NOT NULL UNIQUE,
      loai_hinh         varchar(30) NOT NULL,
      tieu_de           text NOT NULL,
      tac_gia           varchar(500),
      gvhd              varchar(500),
      co_quan           varchar(500),
      nxb               varchar(500),
      nam               int,
      nam_goc           varchar(60),
      ma_van_de         varchar(20) REFERENCES ma_van_de(ma),
      khoa_hoc          varchar(40),
      he                varchar(40),
      ghi_chu           text,
      khong_co_tl       boolean NOT NULL DEFAULT false,
      co_ban_mem        boolean NOT NULL DEFAULT false,
      muc_truy_cap      varchar(20) CONSTRAINT tai_lieu_muc_truy_cap_check CHECK (muc_truy_cap IN ('cong_khai', 'noi_bo')),
      duong_dan_ban_mem varchar(300),
      tsv               tsvector GENERATED ALWAYS AS (
                          to_tsvector('simple', f_chuan_hoa(coalesce(tieu_de, '') || ' ' || coalesce(tac_gia, '')))
                        ) STORED,
      sheet_goc         varchar(60) NOT NULL,
      dong_goc          int NOT NULL
    )
    """,
    "CREATE INDEX idx_tai_lieu_tsv ON tai_lieu USING gin (tsv)",
    "CREATE INDEX idx_tai_lieu_trgm ON tai_lieu USING gin (f_unaccent(lower(tieu_de)) gin_trgm_ops)",
    "CREATE INDEX idx_tai_lieu_loai ON tai_lieu (loai_hinh)",
    """
    CREATE TABLE ban_sao (
      id          serial PRIMARY KEY,
      tai_lieu_id int NOT NULL REFERENCES tai_lieu(id) ON DELETE CASCADE,
      ma_ban_sao  varchar(60) NOT NULL UNIQUE,
      trang_thai  varchar(20) NOT NULL DEFAULT 'con'
                  CONSTRAINT ban_sao_trang_thai_check CHECK (trang_thai IN ('con', 'dang_muon', 'mat')),
      du_lieu_mau boolean NOT NULL DEFAULT false
    )
    """,
    "CREATE INDEX idx_ban_sao_tl ON ban_sao (tai_lieu_id)",
    """
    CREATE TABLE nguoi_dung (
      id            serial PRIMARY KEY,
      ten_dang_nhap varchar(60) NOT NULL UNIQUE,
      mat_khau_hash varchar(100) NOT NULL,
      ho_ten        varchar(200) NOT NULL,
      vai_tro       varchar(20) NOT NULL
                    CONSTRAINT nguoi_dung_vai_tro_check CHECK (vai_tro IN ('sinh_vien', 'giang_vien', 'thu_thu', 'admin')),
      du_lieu_mau   boolean NOT NULL DEFAULT false
    )
    """,
    """
    CREATE TABLE luot_muon (
      id            serial PRIMARY KEY,
      nguoi_dung_id int NOT NULL REFERENCES nguoi_dung(id),
      tai_lieu_id   int NOT NULL REFERENCES tai_lieu(id),
      ban_sao_id    int REFERENCES ban_sao(id),
      trang_thai    varchar(20) NOT NULL DEFAULT 'cho_duyet'
                    CONSTRAINT luot_muon_trang_thai_check
                    CHECK (trang_thai IN ('cho_duyet', 'dang_muon', 'da_tra', 'tu_choi')),
      ngay_dang_ky  timestamptz NOT NULL DEFAULT now(),
      ngay_muon     date,
      han_tra       date,
      ngay_tra      date,
      du_lieu_mau   boolean NOT NULL DEFAULT false
    )
    """,
    "CREATE INDEX idx_luot_muon_tl ON luot_muon (tai_lieu_id)",
    "CREATE INDEX idx_luot_muon_tt ON luot_muon (trang_thai)",
    """
    CREATE TABLE log_tim_kiem (
      id               bigserial PRIMARY KEY,
      tu_khoa          text NOT NULL,
      tu_khoa_chuan    text NOT NULL,
      so_ket_qua       int NOT NULL,
      tai_lieu_chon_id int REFERENCES tai_lieu(id),
      thoi_diem        timestamptz NOT NULL DEFAULT now(),
      nguoi_dung_id    int REFERENCES nguoi_dung(id),
      ma_phien         varchar(64),
      du_lieu_mau      boolean NOT NULL DEFAULT false
    )
    """,
    "CREATE INDEX idx_log_tu_khoa_chuan ON log_tim_kiem (tu_khoa_chuan)",
    "CREATE INDEX idx_log_tu_khoa_tien_to ON log_tim_kiem (tu_khoa_chuan text_pattern_ops)",
    "CREATE INDEX idx_log_thoi_diem ON log_tim_kiem (thoi_diem)",
    "CREATE INDEX idx_log_chon ON log_tim_kiem (tai_lieu_chon_id)",
    """
    CREATE TABLE luot_doc (
      id            bigserial PRIMARY KEY,
      tai_lieu_id   int NOT NULL REFERENCES tai_lieu(id) ON DELETE CASCADE,
      nguoi_dung_id int REFERENCES nguoi_dung(id),
      ma_phien      varchar(64),
      thoi_diem     timestamptz NOT NULL DEFAULT now(),
      du_lieu_mau   boolean NOT NULL DEFAULT false
    )
    """,
    "CREATE INDEX idx_luot_doc_tl ON luot_doc (tai_lieu_id)",
    "CREATE INDEX idx_luot_doc_thoi_diem ON luot_doc (thoi_diem)",
    """
    CREATE TABLE tai_lieu_tuong_tu (
      tai_lieu_id           int NOT NULL REFERENCES tai_lieu(id) ON DELETE CASCADE,
      tai_lieu_lien_quan_id int NOT NULL REFERENCES tai_lieu(id) ON DELETE CASCADE,
      diem                  double precision NOT NULL,
      PRIMARY KEY (tai_lieu_id, tai_lieu_lien_quan_id)
    )
    """,
    # --- Hàm tìm kiếm dùng chung cho API và pipeline (y như v1) ---
    """
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
    """,
    # --- View thống kê ---
    """
    CREATE OR REPLACE VIEW v_tinh_trang_tai_lieu AS
    SELECT t.id AS tai_lieu_id,
           count(b.id) FILTER (WHERE b.trang_thai <> 'mat')::int AS so_ban,
           count(b.id) FILTER (WHERE b.trang_thai = 'con')::int  AS so_ban_con
    FROM tai_lieu t
    LEFT JOIN ban_sao b ON b.tai_lieu_id = t.id
    GROUP BY t.id
    """,
    r"""
    CREATE OR REPLACE VIEW v_tu_khoa_top AS
    SELECT tu_khoa_chuan,
           mode() WITHIN GROUP (ORDER BY lower(regexp_replace(btrim(tu_khoa), '\s+', ' ', 'g'))) AS hien_thi,
           count(*)::int AS so_lan,
           count(*) FILTER (WHERE so_ket_qua = 0)::int AS so_lan_0_kq
    FROM log_tim_kiem
    GROUP BY tu_khoa_chuan
    ORDER BY so_lan DESC
    """,
    """
    CREATE OR REPLACE VIEW v_tim_theo_ngay AS
    SELECT thoi_diem::date AS ngay,
           count(*)::int AS so_luot,
           count(*) FILTER (WHERE so_ket_qua = 0)::int AS so_luot_0_kq
    FROM log_tim_kiem
    GROUP BY 1
    ORDER BY 1
    """,
    r"""
    CREATE OR REPLACE VIEW v_khong_ket_qua AS
    SELECT tu_khoa_chuan,
           mode() WITHIN GROUP (ORDER BY lower(regexp_replace(btrim(tu_khoa), '\s+', ' ', 'g'))) AS hien_thi,
           count(*)::int AS so_lan,
           max(thoi_diem) AS lan_cuoi
    FROM log_tim_kiem
    WHERE so_ket_qua = 0
    GROUP BY tu_khoa_chuan
    ORDER BY so_lan DESC
    """,
    """
    CREATE OR REPLACE VIEW v_nen_so_hoa AS
    WITH chon AS (
      SELECT tai_lieu_chon_id AS tai_lieu_id, count(*)::int AS so_lan_chon
      FROM log_tim_kiem WHERE tai_lieu_chon_id IS NOT NULL GROUP BY 1
    ), muon AS (
      SELECT tai_lieu_id, count(*)::int AS so_luot_muon
      FROM luot_muon WHERE trang_thai <> 'tu_choi' GROUP BY 1
    )
    SELECT t.id AS tai_lieu_id, t.ky_hieu, t.tieu_de, t.tac_gia, t.loai_hinh, t.nam,
           coalesce(c.so_lan_chon, 0) AS so_lan_chon,
           coalesce(m.so_luot_muon, 0) AS so_luot_muon,
           coalesce(c.so_lan_chon, 0) + 2 * coalesce(m.so_luot_muon, 0) AS diem
    FROM tai_lieu t
    LEFT JOIN chon c ON c.tai_lieu_id = t.id
    LEFT JOIN muon m ON m.tai_lieu_id = t.id
    WHERE t.co_ban_mem = false
      AND t.khong_co_tl = false
      AND coalesce(c.so_lan_chon, 0) + coalesce(m.so_luot_muon, 0) > 0
    ORDER BY diem DESC, t.id
    """,
    """
    CREATE OR REPLACE VIEW v_luot_doc_theo_ngay AS
    SELECT thoi_diem::date AS ngay, count(*)::int AS so_luot
    FROM luot_doc
    GROUP BY 1
    ORDER BY 1
    """,
]


def upgrade() -> None:
    for cau_lenh in CAU_LENH_UPGRADE:
        op.execute(cau_lenh)


def downgrade() -> None:
    for view in ("v_luot_doc_theo_ngay", "v_nen_so_hoa", "v_khong_ket_qua", "v_tim_theo_ngay",
                 "v_tu_khoa_top", "v_tinh_trang_tai_lieu"):
        op.execute(f"DROP VIEW IF EXISTS {view}")
    op.execute("DROP FUNCTION IF EXISTS tim_tai_lieu(text)")
    for bang in ("tai_lieu_tuong_tu", "luot_doc", "log_tim_kiem", "luot_muon", "nguoi_dung", "ban_sao",
                 "tai_lieu", "ma_van_de"):
        op.execute(f"DROP TABLE IF EXISTS {bang} CASCADE")
    op.execute("DROP FUNCTION IF EXISTS f_chuan_hoa(text)")
    op.execute("DROP FUNCTION IF EXISTS f_unaccent(text)")
