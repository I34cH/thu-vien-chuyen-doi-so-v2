"""Dependency dùng chung: người dùng hiện tại, kiểm tra vai trò, mã phiên khách."""
import secrets

from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import TEN_COOKIE_PHIEN, TEN_COOKIE_TOKEN, doc_token
from app.db.session import get_db
from app.models import NguoiDung
from app.models.nguoi_dung import VAI_TRO_NGUOI_DUNG, VAI_TRO_THU_THU

NHOM_HOP_LE = {"*", "khach", "nguoi_dung", "thu_thu"}


def nguoi_dung_hien_tai(request: Request, db: Session = Depends(get_db)) -> NguoiDung | None:
    """Đọc cookie access_token, trả về người dùng hoặc None (khách)."""
    token = request.cookies.get(TEN_COOKIE_TOKEN)
    if not token:
        return None
    nguoi_dung_id = doc_token(token)
    if nguoi_dung_id is None:
        return None
    return db.get(NguoiDung, nguoi_dung_id)


def yeu_cau_vai_tro(*nhom: str):
    """Tạo dependency kiểm tra nhóm vai trò.

    nhom: '*' (ai cũng được, trả None nếu là khách), 'khach', 'nguoi_dung' (sinh_vien, giang_vien),
    'thu_thu' (thu_thu, admin). Chưa đăng nhập mà không được phép khách -> 401; sai vai trò -> 403.
    """
    assert nhom and set(nhom) <= NHOM_HOP_LE, f"nhóm vai trò không hợp lệ: {nhom}"

    def kiem_tra(nd: NguoiDung | None = Depends(nguoi_dung_hien_tai)) -> NguoiDung | None:
        if "*" in nhom:
            return nd
        if nd is None:
            if "khach" in nhom:
                return None
            raise HTTPException(status_code=401, detail="Bạn cần đăng nhập để thực hiện thao tác này.")
        duoc_phep = (
            ("nguoi_dung" in nhom and nd.vai_tro in VAI_TRO_NGUOI_DUNG)
            or ("thu_thu" in nhom and nd.vai_tro in VAI_TRO_THU_THU)
        )
        if not duoc_phep:
            raise HTTPException(status_code=403, detail="Tài khoản của bạn không có quyền thực hiện thao tác này.")
        return nd

    return kiem_tra


def ma_phien_khach(request: Request, response: Response) -> str:
    """Mã phiên ẩn danh (cookie httpOnly) dùng gắn log tìm kiếm và lượt đọc; tạo mới nếu chưa có."""
    ma = request.cookies.get(TEN_COOKIE_PHIEN)
    if not ma or len(ma) > 64:
        ma = secrets.token_hex(8)
        response.set_cookie(
            TEN_COOKIE_PHIEN, ma, max_age=30 * 24 * 3600, httponly=True, samesite="lax",
            secure=settings.COOKIE_SECURE, path="/",
        )
    return ma
