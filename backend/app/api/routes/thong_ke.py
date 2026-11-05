"""Thống kê cho dashboard thủ thư: chỉ số tổng hợp, không lộ ai tìm gì (chặng 5: ThemeRiver, mượn cùng nhau, lan tỏa).

Bộ lọc chung (mọi API): tu_ngay, den_ngay (mặc định 90 ngày gần nhất), loai, tu_khoa.
 - Log tìm kiếm: lọc theo ngày; `loai` giữ các lượt tìm mà tư liệu được chọn thuộc loại đó;
   `tu_khoa` giữ các lượt tìm có cụm đã chuẩn hóa trùng.
 - Lượt mượn, lượt đọc: lọc theo ngày và loại của tư liệu; `tu_khoa` giữ các tư liệu từng được chọn
   từ kết quả của từ khóa đó (trong cùng khoảng ngày).
"""
from dataclasses import dataclass
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import yeu_cau_vai_tro
from app.db.session import get_db
from app.services.tai_lieu import COT_TOM_TAT, JOIN_TINH_TRANG, iso, tom_tat

router = APIRouter(prefix="/thong-ke", dependencies=[Depends(yeu_cau_vai_tro("thu_thu"))])

NGAY_MAC_DINH = 90
NGAY_TOI_DA = 366

TIEN_TO_TU_KHOA = "(CAST(:tu_khoa AS text) IS NULL OR {cot} = f_chuan_hoa(:tu_khoa))"
LOC_LOG = (
    "l.thoi_diem::date BETWEEN :tu_ngay AND :den_ngay "
    "AND " + TIEN_TO_TU_KHOA.format(cot="l.tu_khoa_chuan") + " "
    "AND (CAST(:loai AS text) IS NULL OR EXISTS "
    "(SELECT 1 FROM tai_lieu c WHERE c.id = l.tai_lieu_chon_id AND c.loai_hinh = :loai))"
)
_TU_KHOA_CHON = (
    "(CAST(:tu_khoa AS text) IS NULL OR EXISTS (SELECT 1 FROM log_tim_kiem k "
    "WHERE k.tai_lieu_chon_id = {tl} AND k.tu_khoa_chuan = f_chuan_hoa(:tu_khoa) "
    "AND k.thoi_diem::date BETWEEN :tu_ngay AND :den_ngay))"
)
LOC_MUON = (
    "m.ngay_dang_ky::date BETWEEN :tu_ngay AND :den_ngay "
    "AND (CAST(:loai AS text) IS NULL OR t.loai_hinh = :loai) AND " + _TU_KHOA_CHON.format(tl="m.tai_lieu_id")
)
LOC_DOC = (
    "d.thoi_diem::date BETWEEN :tu_ngay AND :den_ngay "
    "AND (CAST(:loai AS text) IS NULL OR t.loai_hinh = :loai) AND " + _TU_KHOA_CHON.format(tl="d.tai_lieu_id")
)
HIEN_THI = r"mode() WITHIN GROUP (ORDER BY lower(regexp_replace(btrim(l.tu_khoa), '\s+', ' ', 'g')))"
CHUOI_NGAY = "generate_series(CAST(:tu_ngay AS date), CAST(:den_ngay AS date), interval '1 day')"


@dataclass
class BoLoc:
    tu_ngay: date
    den_ngay: date
    loai: str | None
    tu_khoa: str | None

    def tham_so(self, **them) -> dict:
        return {"tu_ngay": self.tu_ngay, "den_ngay": self.den_ngay, "loai": self.loai, "tu_khoa": self.tu_khoa, **them}


def bo_loc_chung(
    tu_ngay: date | None = None,
    den_ngay: date | None = None,
    loai: str | None = None,
    tu_khoa: str | None = None,
) -> BoLoc:
    den = den_ngay or date.today()
    tu = tu_ngay or (den - timedelta(days=NGAY_MAC_DINH - 1))
    if tu > den:
        raise HTTPException(status_code=400, detail="tu_ngay phải không sau den_ngay.")
    if (den - tu).days >= NGAY_TOI_DA:
        raise HTTPException(status_code=400, detail=f"Khoảng ngày tối đa {NGAY_TOI_DA} ngày.")
    return BoLoc(tu, den, (loai or "").strip() or None, (tu_khoa or "").replace("\0", "").strip()[:200] or None)


def _so_lieu_ky(db: Session, tham_so: dict) -> dict:
    log = db.execute(
        text(
            f"""SELECT count(*)::int AS tong_luot_tim,
                       coalesce(round(100.0 * count(*) FILTER (WHERE l.so_ket_qua = 0) / NULLIF(count(*), 0), 1), 0)::float
                         AS ti_le_khong_ket_qua
                FROM log_tim_kiem l WHERE {LOC_LOG}"""
        ),
        tham_so,
    ).one()
    luot_doc = db.execute(
        text(f"SELECT count(*)::int FROM luot_doc d JOIN tai_lieu t ON t.id = d.tai_lieu_id WHERE {LOC_DOC}"),
        tham_so,
    ).scalar_one()
    return {
        "tong_luot_tim": log.tong_luot_tim,
        "ti_le_khong_ket_qua": log.ti_le_khong_ket_qua,
        "luot_doc": luot_doc,
    }


@router.get("/tong-quan")
def tong_quan(db: Session = Depends(get_db), bl: BoLoc = Depends(bo_loc_chung)):
    ky_nay = _so_lieu_ky(db, bl.tham_so())
    do_dai = (bl.den_ngay - bl.tu_ngay).days
    den_truoc = bl.tu_ngay - timedelta(days=1)
    ky_truoc = _so_lieu_ky(db, bl.tham_so(tu_ngay=den_truoc - timedelta(days=do_dai), den_ngay=den_truoc))
    # Trạng thái hiện tại (không phụ thuộc khoảng ngày), lọc theo loại hình nếu có
    hien_tai = db.execute(
        text(
            """SELECT
                 (SELECT count(*)::int FROM luot_muon m JOIN tai_lieu t ON t.id = m.tai_lieu_id
                   WHERE m.trang_thai IN ('cho_duyet', 'dang_muon')
                     AND (CAST(:loai AS text) IS NULL OR t.loai_hinh = :loai)) AS luot_muon_mo,
                 (SELECT count(*)::int FROM luot_muon m JOIN tai_lieu t ON t.id = m.tai_lieu_id
                   WHERE m.trang_thai = 'dang_muon' AND m.han_tra < CURRENT_DATE
                     AND (CAST(:loai AS text) IS NULL OR t.loai_hinh = :loai)) AS qua_han,
                 (SELECT count(*)::int FROM tai_lieu t
                   WHERE t.co_ban_mem AND (CAST(:loai AS text) IS NULL OR t.loai_hinh = :loai)) AS da_so_hoa,
                 (SELECT count(*)::int FROM tai_lieu t
                   WHERE CAST(:loai AS text) IS NULL OR t.loai_hinh = :loai) AS tong_tai_lieu"""
        ),
        {"loai": bl.loai},
    ).one()
    return {
        "tong_luot_tim": ky_nay["tong_luot_tim"],
        "ti_le_khong_ket_qua": ky_nay["ti_le_khong_ket_qua"],
        "luot_muon_mo": hien_tai.luot_muon_mo,
        "qua_han": hien_tai.qua_han,
        "da_so_hoa": hien_tai.da_so_hoa,
        "tong_tai_lieu": hien_tai.tong_tai_lieu,
        "luot_doc": ky_nay["luot_doc"],
        "so_sanh_ky_truoc": ky_truoc,
    }


@router.get("/tu-khoa")
def tu_khoa(
    gioi_han: int = Query(60, ge=1, le=500), db: Session = Depends(get_db), bl: BoLoc = Depends(bo_loc_chung)
):
    return [
        {"tu_khoa": r.tu_khoa, "hien_thi": r.hien_thi, "so_lan": r.so_lan, "so_lan_khong_kq": r.so_lan_khong_kq}
        for r in db.execute(
            text(
                f"""SELECT l.tu_khoa_chuan AS tu_khoa, {HIEN_THI} AS hien_thi, count(*)::int AS so_lan,
                           count(*) FILTER (WHERE l.so_ket_qua = 0)::int AS so_lan_khong_kq
                    FROM log_tim_kiem l WHERE {LOC_LOG}
                    GROUP BY l.tu_khoa_chuan ORDER BY so_lan DESC, l.tu_khoa_chuan LIMIT :gh"""
            ),
            bl.tham_so(gh=gioi_han),
        )
    ]


@router.get("/theo-ngay")
def theo_ngay(db: Session = Depends(get_db), bl: BoLoc = Depends(bo_loc_chung)):
    """Đủ mọi ngày trong khoảng (ngày thiếu = 0); ngày hôm nay đánh dấu dang_cap_nhat."""
    return [
        {
            "ngay": iso(r.ngay), "so_luot": r.so_luot, "so_luot_khong_kq": r.so_luot_khong_kq,
            "dang_cap_nhat": r.dang_cap_nhat,
        }
        for r in db.execute(
            text(
                f"""SELECT g.ngay::date AS ngay, coalesce(a.so_luot, 0) AS so_luot,
                           coalesce(a.so_luot_khong_kq, 0) AS so_luot_khong_kq,
                           (g.ngay::date = CURRENT_DATE) AS dang_cap_nhat
                    FROM {CHUOI_NGAY} AS g(ngay)
                    LEFT JOIN (
                      SELECT l.thoi_diem::date AS ngay, count(*)::int AS so_luot,
                             count(*) FILTER (WHERE l.so_ket_qua = 0)::int AS so_luot_khong_kq
                      FROM log_tim_kiem l WHERE {LOC_LOG} GROUP BY 1
                    ) a ON a.ngay = g.ngay::date
                    ORDER BY g.ngay"""
            ),
            bl.tham_so(),
        )
    ]


@router.get("/khong-ket-qua")
def khong_ket_qua(
    gioi_han: int = Query(20, ge=1, le=200), db: Session = Depends(get_db), bl: BoLoc = Depends(bo_loc_chung)
):
    return [
        {"tu_khoa": r.tu_khoa, "hien_thi": r.hien_thi, "so_lan": r.so_lan, "lan_cuoi": iso(r.lan_cuoi)}
        for r in db.execute(
            text(
                f"""SELECT l.tu_khoa_chuan AS tu_khoa, {HIEN_THI} AS hien_thi, count(*)::int AS so_lan,
                           max(l.thoi_diem) AS lan_cuoi
                    FROM log_tim_kiem l WHERE l.so_ket_qua = 0 AND {LOC_LOG}
                    GROUP BY l.tu_khoa_chuan ORDER BY so_lan DESC, l.tu_khoa_chuan LIMIT :gh"""
            ),
            bl.tham_so(gh=gioi_han),
        )
    ]


# Lượt đọc bản mềm trong khoảng ngày, và đóng góp lan tỏa: tư liệu đã số hóa s được đọc n lần thì mỗi tư liệu t
# nằm trong danh sách "tương tự" của s (tai_lieu_tuong_tu: s -> t, top 10 của s) nhận diem(s, t) × ln(1 + n).
# ln(1 + n) (quyết định của người dùng): lượt đọc tăng thì đóng góp tăng chậm dần, để lan tỏa chỉ là thành phần phụ,
# lượt chọn và lượt mượn (nhu cầu trực tiếp với chính tư liệu) vẫn là thành phần chính của điểm.
CTE_LAN_TOA = """doc AS (
      SELECT d.tai_lieu_id AS tl, count(*)::int AS n
      FROM luot_doc d WHERE d.thoi_diem::date BETWEEN :tu_ngay AND :den_ngay GROUP BY 1
    ), nguon_lan_toa AS (
      SELECT tt.tai_lieu_lien_quan_id AS tl, s.id AS nguon_id, s.tieu_de, dc.n AS so_luot_doc,
             tt.diem AS diem_tuong_tu, tt.diem * ln(1 + dc.n) AS dong_gop
      FROM tai_lieu_tuong_tu tt
      JOIN tai_lieu s ON s.id = tt.tai_lieu_id AND s.co_ban_mem
      JOIN tai_lieu u ON u.id = tt.tai_lieu_lien_quan_id
      JOIN doc dc ON dc.tl = s.id
      -- bỏ cặp trùng tiêu đề (cùng một tác phẩm nhập ở hai sheet): bản kia đã có bản mềm, không phải "lan tỏa"
      WHERE f_chuan_hoa(s.tieu_de) <> f_chuan_hoa(u.tieu_de)
    )"""


@router.get("/nen-so-hoa")
def nen_so_hoa(
    gioi_han: int = Query(20, ge=1, le=200), db: Session = Depends(get_db), bl: BoLoc = Depends(bo_loc_chung)
):
    """diem = so_lan_chon + 2 × so_luot_muon + diem_lan_toa (làm tròn 1 chữ số thập phân).

    diem_lan_toa = Σ diem_tuong_tu(s, t) × ln(1 + số lượt đọc của s trong khoảng ngày), với s đã có bản mềm và t nằm trong
    danh sách tương tự của s. Bộ lọc `loai` áp lên tư liệu ứng viên t; khi có `tu_khoa`, chỉ giữ ứng viên có lượt
    chọn hoặc lượt mượn gắn với từ khóa đó (lượt đọc của s chỉ lọc theo ngày).
    """
    dong = db.execute(
        text(
            f"""WITH chon AS (
                  SELECT l.tai_lieu_chon_id AS tl, count(*)::int AS so_lan_chon
                  FROM log_tim_kiem l WHERE l.tai_lieu_chon_id IS NOT NULL AND {LOC_LOG} GROUP BY 1
                ), muon AS (
                  SELECT m.tai_lieu_id AS tl, count(*)::int AS so_luot_muon
                  FROM luot_muon m JOIN tai_lieu t ON t.id = m.tai_lieu_id
                  WHERE m.trang_thai <> 'tu_choi' AND {LOC_MUON} GROUP BY 1
                ), {CTE_LAN_TOA}, lan_toa AS (
                  SELECT tl, sum(dong_gop) AS diem_lan_toa FROM nguon_lan_toa GROUP BY 1
                ), diem AS (
                  SELECT t.id AS tl, coalesce(c.so_lan_chon, 0) AS so_lan_chon,
                         coalesce(mu.so_luot_muon, 0) AS so_luot_muon,
                         round(coalesce(lt.diem_lan_toa, 0)::numeric, 1)::float AS diem_lan_toa,
                         round((coalesce(c.so_lan_chon, 0) + 2 * coalesce(mu.so_luot_muon, 0)
                                + coalesce(lt.diem_lan_toa, 0))::numeric, 1)::float AS diem
                  FROM tai_lieu t
                  LEFT JOIN chon c ON c.tl = t.id
                  LEFT JOIN muon mu ON mu.tl = t.id
                  LEFT JOIN lan_toa lt ON lt.tl = t.id
                  WHERE NOT t.co_ban_mem AND NOT t.khong_co_tl
                    AND (CAST(:loai AS text) IS NULL OR t.loai_hinh = :loai)
                    AND (coalesce(c.so_lan_chon, 0) + coalesce(mu.so_luot_muon, 0) > 0
                         OR (CAST(:tu_khoa AS text) IS NULL AND coalesce(lt.diem_lan_toa, 0) > 0))
                )
                SELECT {COT_TOM_TAT}, d.so_lan_chon, d.so_luot_muon, d.diem_lan_toa, d.diem
                FROM diem d JOIN tai_lieu t ON t.id = d.tl {JOIN_TINH_TRANG}
                ORDER BY d.diem DESC, t.id LIMIT :gh"""
        ),
        bl.tham_so(gh=gioi_han),
    ).all()
    ids = [r.id for r in dong if r.diem_lan_toa > 0]
    lan_toa_tu: dict[int, list] = {}
    if ids:
        for r in db.execute(
            text(
                f"""WITH {CTE_LAN_TOA}
                    SELECT tl, nguon_id, tieu_de, so_luot_doc, diem_tuong_tu, dong_gop FROM (
                      SELECT n.*, row_number() OVER (PARTITION BY tl ORDER BY dong_gop DESC, nguon_id) AS hang
                      FROM nguon_lan_toa n WHERE tl = ANY(:ids)
                    ) x WHERE hang <= 3 ORDER BY tl, hang"""
            ),
            bl.tham_so(ids=ids),
        ):
            lan_toa_tu.setdefault(r.tl, []).append(
                {"id": r.nguon_id, "tieu_de": r.tieu_de, "so_luot_doc": r.so_luot_doc,
                 "diem_tuong_tu": round(float(r.diem_tuong_tu), 3), "dong_gop": round(float(r.dong_gop), 1)}
            )
    return [
        {
            "tai_lieu": tom_tat(r), "so_lan_chon": r.so_lan_chon, "so_luot_muon": r.so_luot_muon,
            "diem_lan_toa": r.diem_lan_toa, "diem": r.diem, "lan_toa_tu": lan_toa_tu.get(r.id, []),
        }
        for r in dong
    ]


@router.get("/theo-loai-hinh")
def theo_loai_hinh(db: Session = Depends(get_db), bl: BoLoc = Depends(bo_loc_chung)):
    """Biểu đồ chọn loại để lọc chéo nên API này bỏ qua tham số `loai` (vẫn lọc theo ngày và từ khóa)."""
    tham_so = bl.tham_so(loai=None)
    return [
        {
            "loai_hinh": r.loai_hinh, "so_tai_lieu": r.so_tai_lieu, "so_luot_chon": r.so_luot_chon,
            "so_luot_muon": r.so_luot_muon, "da_so_hoa": r.da_so_hoa,
        }
        for r in db.execute(
            text(
                f"""WITH chon AS (
                      SELECT c.loai_hinh, count(*)::int AS n
                      FROM log_tim_kiem l JOIN tai_lieu c ON c.id = l.tai_lieu_chon_id
                      WHERE {LOC_LOG} GROUP BY 1
                    ), muon AS (
                      SELECT t.loai_hinh, count(*)::int AS n
                      FROM luot_muon m JOIN tai_lieu t ON t.id = m.tai_lieu_id
                      WHERE m.trang_thai <> 'tu_choi' AND {LOC_MUON} GROUP BY 1
                    ), kho AS (
                      SELECT loai_hinh, count(*)::int AS so_tai_lieu,
                             count(*) FILTER (WHERE co_ban_mem)::int AS da_so_hoa
                      FROM tai_lieu GROUP BY 1
                    )
                    SELECT k.loai_hinh, k.so_tai_lieu, coalesce(c.n, 0) AS so_luot_chon,
                           coalesce(mu.n, 0) AS so_luot_muon, k.da_so_hoa
                    FROM kho k LEFT JOIN chon c ON c.loai_hinh = k.loai_hinh
                    LEFT JOIN muon mu ON mu.loai_hinh = k.loai_hinh
                    ORDER BY k.so_tai_lieu DESC, k.loai_hinh"""
            ),
            tham_so,
        )
    ]


@router.get("/luot-doc")
def luot_doc(
    gioi_han: int = Query(20, ge=1, le=200), db: Session = Depends(get_db), bl: BoLoc = Depends(bo_loc_chung)
):
    """Trả `{top: {tai_lieu, so_luot_doc}[], theo_ngay: {ngay, so_luot}[]}`."""
    top = [
        {"tai_lieu": tom_tat(r), "so_luot_doc": r.so_luot_doc}
        for r in db.execute(
            text(
                f"""SELECT {COT_TOM_TAT}, x.so_luot_doc
                    FROM (SELECT d.tai_lieu_id, count(*)::int AS so_luot_doc
                          FROM luot_doc d JOIN tai_lieu t ON t.id = d.tai_lieu_id
                          WHERE {LOC_DOC} GROUP BY 1) x
                    JOIN tai_lieu t ON t.id = x.tai_lieu_id {JOIN_TINH_TRANG}
                    ORDER BY x.so_luot_doc DESC, t.id LIMIT :gh"""
            ),
            bl.tham_so(gh=gioi_han),
        )
    ]
    theo_ngay = [
        {"ngay": iso(r.ngay), "so_luot": r.so_luot}
        for r in db.execute(
            text(
                f"""SELECT g.ngay::date AS ngay, coalesce(a.so_luot, 0) AS so_luot
                    FROM {CHUOI_NGAY} AS g(ngay)
                    LEFT JOIN (
                      SELECT d.thoi_diem::date AS ngay, count(*)::int AS so_luot
                      FROM luot_doc d JOIN tai_lieu t ON t.id = d.tai_lieu_id
                      WHERE {LOC_DOC} GROUP BY 1
                    ) a ON a.ngay = g.ngay::date
                    ORDER BY g.ngay"""
            ),
            bl.tham_so(),
        )
    ]
    return {"top": top, "theo_ngay": theo_ngay}


NGAY_GOP_TUAN = 45  # khoảng ngày dài hơn mức này thì ThemeRiver gộp theo tuần


@router.get("/chu-de-theo-thoi-gian")
def chu_de_theo_thoi_gian(db: Session = Depends(get_db), bl: BoLoc = Depends(bo_loc_chung)):
    """Lượt quan tâm theo chủ đề theo thời gian (ThemeRiver).

    Một lượt tìm thuộc chủ đề của tư liệu được chọn (tai_lieu_chon_id); lượt không chọn không tính.
    Khoảng ngày > 45 ngày thì gộp theo tuần: `ngay` là thứ Hai của tuần (tuần đầu cắt tại tu_ngay nên có thể
    thiếu ngày). Trả đủ lưới kỳ × chủ đề (ô thiếu = 0) vì themeRiver cần mọi chuỗi có cùng các mốc.
    `chu_de` chỉ gồm chủ đề có ít nhất 1 lượt, sắp giảm dần theo tổng lượt.
    """
    tuan = (bl.den_ngay - bl.tu_ngay).days + 1 > NGAY_GOP_TUAN
    ky = "greatest(date_trunc('week', {x})::date, CAST(:tu_ngay AS date))" if tuan else "{x}"
    dong = db.execute(
        text(
            f"""WITH dem AS (
                  SELECT {ky.format(x="l.thoi_diem::date")} AS ky, c.chu_de_id, count(*)::int AS n
                  FROM log_tim_kiem l JOIN tai_lieu c ON c.id = l.tai_lieu_chon_id
                  WHERE c.chu_de_id IS NOT NULL AND {LOC_LOG}
                  GROUP BY 1, 2
                ), cd AS (
                  SELECT d.chu_de_id, cd.nhan, sum(d.n)::int AS tong
                  FROM dem d JOIN chu_de cd ON cd.id = d.chu_de_id GROUP BY 1, 2
                ), cac_ky AS (
                  SELECT DISTINCT {ky.format(x="g.ngay::date")} AS ky FROM {CHUOI_NGAY} AS g(ngay)
                )
                SELECT k.ky, cd.chu_de_id, cd.nhan, cd.tong, coalesce(d.n, 0) AS so_luot
                FROM cd CROSS JOIN cac_ky k
                LEFT JOIN dem d ON d.chu_de_id = cd.chu_de_id AND d.ky = k.ky
                ORDER BY cd.tong DESC, cd.chu_de_id, k.ky"""
        ),
        bl.tham_so(),
    ).all()
    chu_de, da_co = [], set()
    for r in dong:
        if r.chu_de_id not in da_co:
            da_co.add(r.chu_de_id)
            chu_de.append({"id": r.chu_de_id, "nhan": r.nhan, "so_luot": r.tong})
    return {
        "chu_de": chu_de,
        "don_vi": "tuan" if tuan else "ngay",
        "du_lieu": [[iso(r.ky), r.so_luot, r.nhan] for r in dong],
    }


TOI_DA_KY_TU_TEN = 48


def _rut_gon(s: str, toi_da: int = TOI_DA_KY_TU_TEN) -> str:
    s = " ".join((s or "").split())
    return s if len(s) <= toi_da else s[: toi_da - 1].rstrip(" ,.;:-") + "…"


@router.get("/muon-cung-nhau")
def muon_cung_nhau(
    nguong: int = Query(2, ge=2, le=50),  # tối thiểu 2 bạn đọc chung (quyết định của người dùng)
    gioi_han_nut: int = Query(60, ge=5, le=150),
    db: Session = Depends(get_db),
    bl: BoLoc = Depends(bo_loc_chung),
):
    """Đồ thị tư liệu được mượn cùng nhau.

    Hai tư liệu nối nhau nếu cùng một bạn đọc có lượt mượn (không bị từ chối) cả hai trong khoảng ngày; trọng số =
    số bạn đọc khác nhau mượn chung. Giữ cạnh có trọng số ≥ nguong; nếu quá gioi_han_nut nút thì giữ các nút có
    tổng trọng số cạnh lớn nhất và các cạnh giữa chúng. Không trả danh tính bạn đọc.
    Thêm: `trong_so_lon_nhat` (trên mọi cạnh, trước ngưỡng — cho thanh trượt), `tong_so_nut` (trước giới hạn nút).
    """
    canh_tat_ca = db.execute(
        text(
            f"""WITH m AS (
                  SELECT DISTINCT m.nguoi_dung_id AS nd, m.tai_lieu_id AS tl
                  FROM luot_muon m JOIN tai_lieu t ON t.id = m.tai_lieu_id
                  WHERE m.trang_thai <> 'tu_choi' AND {LOC_MUON}
                )
                SELECT a.tl AS nguon, b.tl AS dich, count(*)::int AS trong_so
                FROM m a JOIN m b ON a.nd = b.nd AND a.tl < b.tl
                GROUP BY 1, 2"""
        ),
        bl.tham_so(),
    ).all()
    trong_so_lon_nhat = max((c.trong_so for c in canh_tat_ca), default=0)
    canh = [c for c in canh_tat_ca if c.trong_so >= nguong]
    suc_nut: dict[int, int] = {}
    for c in canh:
        suc_nut[c.nguon] = suc_nut.get(c.nguon, 0) + c.trong_so
        suc_nut[c.dich] = suc_nut.get(c.dich, 0) + c.trong_so
    tong_so_nut = len(suc_nut)
    giu = set(sorted(suc_nut, key=lambda i: (-suc_nut[i], i))[:gioi_han_nut])
    canh = sorted(
        (c for c in canh if c.nguon in giu and c.dich in giu), key=lambda c: (-c.trong_so, c.nguon, c.dich)
    )
    nut = []
    if giu:
        nut = [
            {
                "id": r.id, "ten": _rut_gon(r.tieu_de), "tieu_de": r.tieu_de, "ky_hieu": r.ky_hieu,
                "loai_hinh": r.loai_hinh,
                "chu_de": {"id": r.chu_de_id, "nhan": r.nhan} if r.chu_de_id is not None else None,
                "so_luot_muon": r.so_luot_muon,
            }
            for r in db.execute(
                text(
                    f"""SELECT t.id, t.tieu_de, t.ky_hieu, t.loai_hinh, t.chu_de_id, cd.nhan,
                               (SELECT count(*)::int FROM luot_muon m WHERE m.tai_lieu_id = t.id
                                  AND m.trang_thai <> 'tu_choi' AND {LOC_MUON}) AS so_luot_muon
                        FROM tai_lieu t LEFT JOIN chu_de cd ON cd.id = t.chu_de_id
                        WHERE t.id = ANY(:ids)
                        ORDER BY so_luot_muon DESC, t.id"""
                ),
                bl.tham_so(ids=list(giu)),
            )
        ]
    return {
        "nut": nut,
        "canh": [{"nguon": c.nguon, "dich": c.dich, "trong_so": c.trong_so} for c in canh],
        "nguong": nguong,
        "trong_so_lon_nhat": trong_so_lon_nhat,
        "tong_so_nut": tong_so_nut,
    }
