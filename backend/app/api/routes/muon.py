"""Người dùng (sinh_vien, giang_vien): đăng ký mượn và xem lượt mượn của mình."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import yeu_cau_vai_tro
from app.db.session import get_db
from app.models import NguoiDung
from app.schemas.yeu_cau import DangKyMuonVao
from app.services.muon import SELECT_LUOT_MUON, lay_luot_muon, lay_luot_muon_mo, luot_muon_json

router = APIRouter(prefix="/muon")


@router.post("", status_code=201)
def dang_ky_muon(
    vao: DangKyMuonVao,
    db: Session = Depends(get_db),
    nd: NguoiDung = Depends(yeu_cau_vai_tro("nguoi_dung")),
):
    """Tạo lượt mượn trạng thái cho_duyet; 409 nếu hết bản sao hoặc đã có lượt đang mở."""
    tl = db.execute(
        text(
            """SELECT t.id, t.khong_co_tl, coalesce(v.so_ban_con, 0) AS so_ban_con
               FROM tai_lieu t LEFT JOIN v_tinh_trang_tai_lieu v ON v.tai_lieu_id = t.id
               WHERE t.id = :id"""
        ),
        {"id": vao.tai_lieu_id},
    ).first()
    if tl is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy tư liệu.")
    if lay_luot_muon_mo(db, nd.id, tl.id) is not None:
        raise HTTPException(status_code=409, detail="Bạn đã có lượt mượn đang mở cho tư liệu này.")
    if tl.khong_co_tl or tl.so_ban_con == 0:
        raise HTTPException(status_code=409, detail="Tư liệu hiện không còn bản sao để mượn.")
    luot_id = db.execute(
        text(
            """INSERT INTO luot_muon (nguoi_dung_id, tai_lieu_id, trang_thai, du_lieu_mau)
               VALUES (:nd, :tl, 'cho_duyet', false) RETURNING id"""
        ),
        {"nd": nd.id, "tl": tl.id},
    ).scalar_one()
    db.commit()
    return lay_luot_muon(db, luot_id)


@router.get("/cua-toi")
def muon_cua_toi(db: Session = Depends(get_db), nd: NguoiDung = Depends(yeu_cau_vai_tro("nguoi_dung"))):
    dong = db.execute(
        text(SELECT_LUOT_MUON + " WHERE m.nguoi_dung_id = :nd ORDER BY m.ngay_dang_ky DESC, m.id DESC"),
        {"nd": nd.id},
    )
    return [luot_muon_json(r) for r in dong]
