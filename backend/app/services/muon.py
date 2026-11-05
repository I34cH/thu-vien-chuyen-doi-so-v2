"""Truy vấn và định dạng lượt mượn."""
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.services.tai_lieu import iso

# Câu SELECT chung cho LuotMuon (alias m, t, u, b)
SELECT_LUOT_MUON = """
SELECT m.id, m.trang_thai, m.ngay_dang_ky, m.ngay_muon, m.han_tra, m.ngay_tra,
       t.id AS tl_id, t.ky_hieu, t.tieu_de, t.loai_hinh,
       b.ma_ban_sao,
       u.id AS nd_id, u.ho_ten, u.ten_dang_nhap, u.vai_tro,
       (m.trang_thai = 'dang_muon' AND m.han_tra < CURRENT_DATE) AS qua_han
FROM luot_muon m
JOIN tai_lieu t ON t.id = m.tai_lieu_id
JOIN nguoi_dung u ON u.id = m.nguoi_dung_id
LEFT JOIN ban_sao b ON b.id = m.ban_sao_id
"""


def luot_muon_json(dong, kem_nguoi_dung: bool = False) -> dict:
    m = dong._mapping
    ket_qua = {
        "id": m["id"],
        "tai_lieu": {"id": m["tl_id"], "ky_hieu": m["ky_hieu"], "tieu_de": m["tieu_de"], "loai_hinh": m["loai_hinh"]},
        "ma_ban_sao": m["ma_ban_sao"],
        "trang_thai": m["trang_thai"],
        "ngay_dang_ky": iso(m["ngay_dang_ky"]),
        "ngay_muon": iso(m["ngay_muon"]),
        "han_tra": iso(m["han_tra"]),
        "ngay_tra": iso(m["ngay_tra"]),
        "qua_han": bool(m["qua_han"]),
    }
    if kem_nguoi_dung:
        ket_qua["nguoi_dung"] = {
            "id": m["nd_id"], "ho_ten": m["ho_ten"], "ten_dang_nhap": m["ten_dang_nhap"], "vai_tro": m["vai_tro"],
        }
    return ket_qua


def lay_luot_muon(db: Session, luot_muon_id: int, kem_nguoi_dung: bool = False) -> dict | None:
    dong = db.execute(text(SELECT_LUOT_MUON + " WHERE m.id = :id"), {"id": luot_muon_id}).first()
    return luot_muon_json(dong, kem_nguoi_dung) if dong else None


def lay_luot_muon_mo(db: Session, nguoi_dung_id: int, tai_lieu_id: int) -> dict | None:
    """Lượt đang mở (chờ duyệt hoặc đang mượn) của người dùng với một tư liệu."""
    dong = db.execute(
        text(
            SELECT_LUOT_MUON
            + """ WHERE m.nguoi_dung_id = :nd AND m.tai_lieu_id = :tl AND m.trang_thai IN ('cho_duyet', 'dang_muon')
                  ORDER BY m.id DESC LIMIT 1"""
        ),
        {"nd": nguoi_dung_id, "tl": tai_lieu_id},
    ).first()
    return luot_muon_json(dong) if dong else None
