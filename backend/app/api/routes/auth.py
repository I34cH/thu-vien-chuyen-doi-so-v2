"""Đăng nhập, đăng xuất, thông tin tài khoản (JWT trong cookie httpOnly, SameSite=Lax)."""
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import yeu_cau_vai_tro
from app.core.config import settings
from app.core.security import TEN_COOKIE_TOKEN, kiem_tra_mat_khau, tao_token
from app.db.session import get_db
from app.models import NguoiDung
from app.schemas.yeu_cau import DangNhapVao

router = APIRouter(prefix="/auth")


def nguoi_dung_json(nd: NguoiDung) -> dict:
    return {
        "id": nd.id, "ten_dang_nhap": nd.ten_dang_nhap, "ho_ten": nd.ho_ten, "vai_tro": nd.vai_tro, "nhom": nd.nhom,
    }


@router.post("/dang-nhap")
def dang_nhap(
    vao: DangNhapVao,
    response: Response,
    db: Session = Depends(get_db),
    _=Depends(yeu_cau_vai_tro("*")),
):
    nd = db.scalar(select(NguoiDung).where(NguoiDung.ten_dang_nhap == vao.ten_dang_nhap.strip()))
    if nd is None or not kiem_tra_mat_khau(vao.mat_khau, nd.mat_khau_hash):
        raise HTTPException(status_code=401, detail="Tên đăng nhập hoặc mật khẩu không chính xác.")
    response.set_cookie(
        TEN_COOKIE_TOKEN, tao_token(nd.id, nd.vai_tro), max_age=settings.JWT_HET_HAN_GIO * 3600,
        httponly=True, samesite="lax", secure=settings.COOKIE_SECURE, path="/",
    )
    return {"nguoi_dung": nguoi_dung_json(nd)}


@router.post("/dang-xuat")
def dang_xuat(response: Response, _=Depends(yeu_cau_vai_tro("*"))):
    response.delete_cookie(TEN_COOKIE_TOKEN, path="/", httponly=True, samesite="lax")
    return {"ok": True}


@router.get("/toi")
def toi(nd: NguoiDung | None = Depends(yeu_cau_vai_tro("*"))):
    return {"nguoi_dung": nguoi_dung_json(nd) if nd else None}
