"""Tra cứu (mọi người): giới thiệu, gợi ý, tìm kiếm, chọn kết quả, chi tiết, tương tự, đọc bản mềm."""
import math
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import ma_phien_khach, yeu_cau_vai_tro
from app.db.session import get_db
from app.models import NguoiDung
from app.schemas.yeu_cau import ChonTaiLieuVao
from app.services import ban_mem as dv_ban_mem
from app.services.tai_lieu import COT_TOM_TAT, JOIN_TINH_TRANG, chi_tiet, tom_tat

router = APIRouter()


def lam_sach_q(q: str | None) -> str:
    """Bỏ ký tự NUL, cắt khoảng trắng, giới hạn 200 ký tự."""
    return (q or "").replace("\0", "").strip()[:200]


@router.get("/gioi-thieu")
def gioi_thieu(db: Session = Depends(get_db), _=Depends(yeu_cau_vai_tro("*"))):
    tong = db.execute(
        text("SELECT count(*)::int AS tong, count(*) FILTER (WHERE co_ban_mem)::int AS da_so_hoa FROM tai_lieu")
    ).one()
    theo_loai = [
        {"loai_hinh": r.loai_hinh, "so_luong": r.so_luong}
        for r in db.execute(
            text("SELECT loai_hinh, count(*)::int AS so_luong FROM tai_lieu GROUP BY loai_hinh "
                 "ORDER BY so_luong DESC, loai_hinh")
        )
    ]
    # Từ khóa nổi bật: tìm nhiều trong 30 ngày gần nhất và luôn có kết quả (hiển thị trên trang chủ)
    tu_khoa = [
        r.hien_thi
        for r in db.execute(
            text(
                r"""SELECT mode() WITHIN GROUP (ORDER BY lower(regexp_replace(btrim(tu_khoa), '\s+', ' ', 'g'))) AS hien_thi,
                           count(*) AS so_lan
                    FROM log_tim_kiem
                    WHERE thoi_diem >= now() - interval '30 days'
                    GROUP BY tu_khoa_chuan
                    HAVING count(*) FILTER (WHERE so_ket_qua = 0) = 0 AND count(*) >= 2
                    ORDER BY so_lan DESC, tu_khoa_chuan LIMIT 8"""
            )
        )
    ]
    return {
        "tong_tai_lieu": tong.tong,
        "da_so_hoa": tong.da_so_hoa,
        "so_loai_hinh": len(theo_loai),
        "theo_loai_hinh": theo_loai,
        "tu_khoa_noi_bat": tu_khoa,
    }


@router.get("/goi-y")
def goi_y(q: str = "", db: Session = Depends(get_db), _=Depends(yeu_cau_vai_tro("*"))):
    q = lam_sach_q(q)
    if len(q) < 2:
        return {"tai_lieu": [], "tu_khoa": []}
    tai_lieu = [
        {"id": r.id, "tieu_de": r.tieu_de, "loai_hinh": r.loai_hinh, "nam": r.nam}
        for r in db.execute(
            text(
                """SELECT t.id, t.tieu_de, t.loai_hinh, t.nam
                   FROM tim_tai_lieu(:q) s JOIN tai_lieu t ON t.id = s.tai_lieu_id
                   ORDER BY s.diem DESC, t.id LIMIT 6"""
            ),
            {"q": q},
        )
    ]
    # Gợi ý từ khóa từ log: gộp biến thể (không dấu, lỗi gõ) về dạng chuẩn tu_khoa_quy_ve (trigger điền bằng
    # quy_ve_cum), khớp tiền tố (hoặc đầu một từ) trên dạng chuẩn; chỉ lấy cụm đã có kết quả và được tìm từ 2 lần
    # trở lên (không lộ một lượt tìm riêng lẻ). Hiển thị: dạng có dấu phổ biến trong tiêu đề (cum_tu), nếu không có
    # thì dạng người dùng gõ phổ biến nhất trong các lượt gõ đúng dạng chuẩn -> không hiện biến thể lỗi gõ.
    tu_khoa = [
        {"tu_khoa": r.hien_thi, "so_lan": r.so_lan}
        for r in db.execute(
            text(
                r"""WITH k AS (SELECT f_chuan_hoa(:q) AS qn),
                    nhom AS (
                      SELECT coalesce(l.tu_khoa_quy_ve, l.tu_khoa_chuan) AS chuan,
                             count(*)::int AS so_lan,
                             mode() WITHIN GROUP (ORDER BY lower(regexp_replace(btrim(l.tu_khoa), '\s+', ' ', 'g')))
                               FILTER (WHERE l.tu_khoa_chuan = coalesce(l.tu_khoa_quy_ve, l.tu_khoa_chuan)) AS go_dung
                      FROM log_tim_kiem l
                      WHERE l.so_ket_qua > 0
                      GROUP BY 1
                    )
                    SELECT coalesce(c.hien_thi, n.go_dung, n.chuan) AS hien_thi, n.so_lan
                    FROM nhom n CROSS JOIN k
                    LEFT JOIN cum_tu c ON c.cum = n.chuan
                    WHERE n.so_lan >= 2
                      AND (starts_with(n.chuan, k.qn) OR strpos(n.chuan, ' ' || k.qn) > 0)
                    ORDER BY n.so_lan DESC, n.chuan
                    LIMIT 5"""
            ),
            {"q": q},
        )
    ]
    return {"tai_lieu": tai_lieu, "tu_khoa": tu_khoa}


# ---------------------------------------------------------------------------
# Tìm kiếm. Các đoạn SQL dưới đây là hằng số; giá trị người dùng luôn đi qua tham số.
# ---------------------------------------------------------------------------
NGUON_CO_TU_KHOA = "FROM tim_tai_lieu(:q) s JOIN tai_lieu t ON t.id = s.tai_lieu_id " + JOIN_TINH_TRANG
# chinh_xac=1: chỉ khớp cụm liền nguyên văn, không sửa lỗi gõ (lối "Tìm chính xác …", migration 0004)
NGUON_CHINH_XAC = "FROM tim_tai_lieu_chinh_xac(:q) s JOIN tai_lieu t ON t.id = s.tai_lieu_id " + JOIN_TINH_TRANG
NGUON_DUYET = "FROM tai_lieu t " + JOIN_TINH_TRANG + " CROSS JOIN (SELECT 0::real AS diem) s"
LOC_CHUNG = (
    "(CAST(:co_ban_mem AS boolean) IS NULL OR t.co_ban_mem = :co_ban_mem) "
    "AND (CAST(:con_ban AS boolean) IS NULL OR NOT :con_ban OR coalesce(v.so_ban_con, 0) > 0)"
)
LOC_LOAI = "(CAST(:loai AS varchar) IS NULL OR t.loai_hinh = :loai)"
LOC_NAM = (
    "(CAST(:tu_nam AS int) IS NULL OR t.nam >= :tu_nam) "
    "AND (CAST(:den_nam AS int) IS NULL OR t.nam <= :den_nam)"
)
SAP_XEP = {
    "lien_quan": "s.diem DESC, t.id",
    "moi_nhat": "t.nam DESC NULLS LAST, s.diem DESC, t.id",
    "cu_nhat": "t.nam ASC NULLS LAST, s.diem DESC, t.id",
}


@router.get("/tim-kiem")
def tim_kiem(
    response: Response,
    q: str = "",
    loai: str | None = None,
    tu_nam: int | None = None,
    den_nam: int | None = None,
    co_ban_mem: bool | None = None,
    con_ban: bool | None = None,
    chinh_xac: bool = False,
    sap_xep: Literal["lien_quan", "moi_nhat", "cu_nhat"] = "lien_quan",
    trang: int = Query(1, ge=1),
    kich_thuoc: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    nd: NguoiDung | None = Depends(yeu_cau_vai_tro("*")),
    ma_phien: str = Depends(ma_phien_khach),
):
    q = lam_sach_q(q)
    nguon = (NGUON_CHINH_XAC if chinh_xac else NGUON_CO_TU_KHOA) if q else NGUON_DUYET
    tham_so = {
        "q": q, "loai": loai or None, "tu_nam": tu_nam, "den_nam": den_nam,
        "co_ban_mem": co_ban_mem, "con_ban": con_ban,
    }
    day_du = f"{LOC_CHUNG} AND {LOC_LOAI} AND {LOC_NAM}"

    tong_so = db.execute(text(f"SELECT count(*)::int {nguon} WHERE {day_du}"), tham_so).scalar_one()
    dong = db.execute(
        text(
            f"""SELECT {COT_TOM_TAT} {nguon} WHERE {day_du}
                ORDER BY {SAP_XEP[sap_xep]} OFFSET :bo_qua LIMIT :gioi_han"""
        ),
        {**tham_so, "bo_qua": (trang - 1) * kich_thuoc, "gioi_han": kich_thuoc},
    ).all()

    # Facet: mỗi nhóm bỏ chính bộ lọc của nó để người dùng thấy các lựa chọn khác
    facet_loai = [
        {"gia_tri": r.gia_tri, "so_luong": r.so_luong}
        for r in db.execute(
            text(
                f"""SELECT t.loai_hinh AS gia_tri, count(*)::int AS so_luong {nguon}
                    WHERE {LOC_CHUNG} AND {LOC_NAM} GROUP BY 1 ORDER BY 2 DESC, 1"""
            ),
            tham_so,
        )
    ]
    facet_thap_nien = [
        {"gia_tri": r.gia_tri, "so_luong": r.so_luong}
        for r in db.execute(
            text(
                f"""SELECT ((t.nam / 10) * 10)::text AS gia_tri, count(*)::int AS so_luong {nguon}
                    WHERE {LOC_CHUNG} AND {LOC_LOAI} AND t.nam IS NOT NULL GROUP BY 1 ORDER BY 1"""
            ),
            tham_so,
        )
    ]

    # Ghi log khi có từ khóa và đang ở trang 1
    log_id = None
    if q and trang == 1:
        log_id = db.execute(
            text(
                """INSERT INTO log_tim_kiem (tu_khoa, tu_khoa_chuan, so_ket_qua, nguoi_dung_id, ma_phien, du_lieu_mau)
                   VALUES (:q, f_chuan_hoa(:q), :so_kq, :nd, :ma_phien, false) RETURNING id"""
            ),
            {"q": q, "so_kq": tong_so, "nd": nd.id if nd else None, "ma_phien": ma_phien},
        ).scalar_one()
        db.commit()

    # Sửa lỗi gõ (theo cách các công cụ tìm kiếm phổ biến): khi truy vấn (chưa lọc) có <= 3 kết quả nguyên văn và
    # tồn tại cụm rất giống, phổ biến hơn hẳn trong tiêu đề (goi_y_sua_cum), tim_tai_lieu đã dùng luôn cụm sửa
    # -> da_sua = cụm đó ("Đang hiện kết quả cho …"). chinh_xac=1: không sửa, da_sua = null, goi_y_sua vẫn trả để
    # giao diện hỏi "Có phải bạn muốn tìm …?". Từ đúng nhưng không có trong kho -> cả hai null.
    goi_y_sua = db.execute(text("SELECT goi_y_sua_cum(:q)"), {"q": q}).scalar_one() if q else None
    da_sua = None if chinh_xac else goi_y_sua

    return {
        "du_lieu": [tom_tat(r) for r in dong],
        "tong_so": tong_so,
        "trang": trang,
        "kich_thuoc": kich_thuoc,
        "tong_trang": max(1, math.ceil(tong_so / kich_thuoc)),
        "log_id": log_id,
        "facet": {"loai_hinh": facet_loai, "thap_nien": facet_thap_nien},
        "goi_y_sua": goi_y_sua,
        "da_sua": da_sua,
    }


@router.post("/tim-kiem/{log_id}/chon")
def chon_ket_qua(
    log_id: int,
    vao: ChonTaiLieuVao,
    db: Session = Depends(get_db),
    nd: NguoiDung | None = Depends(yeu_cau_vai_tro("*")),
    ma_phien: str = Depends(ma_phien_khach),
):
    log = db.execute(
        text("SELECT id, ma_phien, nguoi_dung_id FROM log_tim_kiem WHERE id = :id"), {"id": log_id}
    ).first()
    if log is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy log tìm kiếm tương ứng.")
    cung_phien = log.ma_phien is not None and log.ma_phien == ma_phien
    cung_nguoi = nd is not None and log.nguoi_dung_id == nd.id
    if not (cung_phien or cung_nguoi):
        raise HTTPException(status_code=403, detail="Không thể cập nhật log của phiên làm việc khác.")
    if db.execute(text("SELECT 1 FROM tai_lieu WHERE id = :id"), {"id": vao.tai_lieu_id}).first() is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy tư liệu được chọn.")
    db.execute(
        text("UPDATE log_tim_kiem SET tai_lieu_chon_id = :tl WHERE id = :id"),
        {"tl": vao.tai_lieu_id, "id": log_id},
    )
    db.commit()
    return {"ok": True}


@router.get("/tai-lieu/{tai_lieu_id}")
def chi_tiet_tai_lieu(
    tai_lieu_id: int, db: Session = Depends(get_db), nd: NguoiDung | None = Depends(yeu_cau_vai_tro("*"))
):
    ket_qua = chi_tiet(db, tai_lieu_id, nd.id if nd else None)
    if ket_qua is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy tư liệu yêu cầu.")
    return ket_qua


@router.get("/tai-lieu/{tai_lieu_id}/tuong-tu")
def tuong_tu(
    tai_lieu_id: int,
    gioi_han: int = Query(6, ge=1, le=50),
    db: Session = Depends(get_db),
    _=Depends(yeu_cau_vai_tro("*")),
):
    """Tư liệu tương tự: pipeline.tuong_tu tính sẵn top 10 (TF-IDF + cosine, điểm >= 0,2). Không có thì trả []."""
    return [
        {"tai_lieu": tom_tat(r), "diem": r.diem_tuong_tu}
        for r in db.execute(
            text(
                f"""SELECT {COT_TOM_TAT}, x.diem AS diem_tuong_tu
                    FROM tai_lieu_tuong_tu x
                    JOIN tai_lieu t ON t.id = x.tai_lieu_lien_quan_id
                    {JOIN_TINH_TRANG}
                    WHERE x.tai_lieu_id = :id
                    ORDER BY x.diem DESC, t.id LIMIT :gh"""
            ),
            {"id": tai_lieu_id, "gh": gioi_han},
        )
    ]


@router.get("/tai-lieu/{tai_lieu_id}/ban-mem")
def doc_ban_mem(
    tai_lieu_id: int,
    db: Session = Depends(get_db),
    nd: NguoiDung | None = Depends(yeu_cau_vai_tro("*")),
    ma_phien: str = Depends(ma_phien_khach),
):
    """Trả file PDF; tư liệu nội bộ cần đăng nhập. Mỗi lần đọc ghi 1 dòng luot_doc."""
    tl = db.execute(
        text("SELECT id, co_ban_mem, muc_truy_cap, duong_dan_ban_mem FROM tai_lieu WHERE id = :id"),
        {"id": tai_lieu_id},
    ).first()
    if tl is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy tư liệu.")
    if not tl.co_ban_mem or not tl.duong_dan_ban_mem:
        raise HTTPException(status_code=404, detail="Tư liệu này hiện chưa có bản mềm số hóa.")
    if tl.muc_truy_cap == "noi_bo" and nd is None:
        raise HTTPException(
            status_code=401, detail="Tư liệu lưu hành nội bộ. Vui lòng đăng nhập để đọc tài liệu này."
        )
    duong_dan = dv_ban_mem.giai_duong_dan(tl.duong_dan_ban_mem)
    if duong_dan is None:
        raise HTTPException(status_code=403, detail="Đường dẫn tệp không hợp lệ.")
    if not duong_dan.is_file():
        raise HTTPException(status_code=404, detail="Không tìm thấy tệp bản mềm trên hệ thống lưu trữ.")
    db.execute(
        text("INSERT INTO luot_doc (tai_lieu_id, nguoi_dung_id, ma_phien, du_lieu_mau) VALUES (:tl, :nd, :mp, false)"),
        {"tl": tai_lieu_id, "nd": nd.id if nd else None, "mp": ma_phien},
    )
    db.commit()
    return FileResponse(
        duong_dan, media_type="application/pdf", filename=f"tai_lieu_{tai_lieu_id}.pdf",
        content_disposition_type="inline",
    )
