"""Truy vấn và định dạng tư liệu dùng chung cho các route."""
from datetime import date, datetime

from sqlalchemy import text
from sqlalchemy.orm import Session

# Cột của TaiLieuTomTat (cần JOIN v_tinh_trang_tai_lieu v)
COT_TOM_TAT = """t.id, t.ky_hieu, t.tieu_de, t.tac_gia, t.loai_hinh, t.nam,
       coalesce(v.so_ban, 0) AS so_ban, coalesce(v.so_ban_con, 0) AS so_ban_con,
       t.co_ban_mem, t.muc_truy_cap, t.khong_co_tl"""
JOIN_TINH_TRANG = "LEFT JOIN v_tinh_trang_tai_lieu v ON v.tai_lieu_id = t.id"

KHOA_TOM_TAT = (
    "id", "ky_hieu", "tieu_de", "tac_gia", "loai_hinh", "nam", "so_ban", "so_ban_con",
    "co_ban_mem", "muc_truy_cap", "khong_co_tl",
)


def iso(gia_tri: date | datetime | None) -> str | None:
    return gia_tri.isoformat() if gia_tri is not None else None


def tom_tat(dong) -> dict:
    """Lấy các khóa của TaiLieuTomTat từ một dòng kết quả."""
    m = dong._mapping
    return {k: m[k] for k in KHOA_TOM_TAT}


def chi_tiet(db: Session, tai_lieu_id: int, nguoi_dung_id: int | None) -> dict | None:
    """TaiLieuChiTiet; None nếu không có tư liệu."""
    from app.services.muon import lay_luot_muon_mo  # tránh import vòng

    dong = db.execute(
        text(
            f"""SELECT {COT_TOM_TAT}, t.gvhd, t.co_quan, t.nxb, t.nam_goc, t.he, t.khoa_hoc, t.ghi_chu,
                       t.ma_van_de AS ma, mvd.ten AS ten_ma_van_de
                FROM tai_lieu t {JOIN_TINH_TRANG}
                LEFT JOIN ma_van_de mvd ON mvd.ma = t.ma_van_de
                WHERE t.id = :id"""
        ),
        {"id": tai_lieu_id},
    ).first()
    if dong is None:
        return None
    m = dong._mapping
    ket_qua = tom_tat(dong)
    for khoa in ("gvhd", "co_quan", "nxb", "nam_goc", "he", "khoa_hoc", "ghi_chu"):
        ket_qua[khoa] = m[khoa]
    ket_qua["ma_van_de"] = {"ma": m["ma"], "ten": m["ten_ma_van_de"]} if m["ma"] else None
    ket_qua["ban_sao"] = [
        {"id": b.id, "ma_ban_sao": b.ma_ban_sao, "trang_thai": b.trang_thai}
        for b in db.execute(
            text("SELECT id, ma_ban_sao, trang_thai FROM ban_sao WHERE tai_lieu_id = :id ORDER BY id"),
            {"id": tai_lieu_id},
        )
    ]
    ket_qua["luot_muon_cua_toi"] = (
        lay_luot_muon_mo(db, nguoi_dung_id, tai_lieu_id) if nguoi_dung_id is not None else None
    )
    return ket_qua
