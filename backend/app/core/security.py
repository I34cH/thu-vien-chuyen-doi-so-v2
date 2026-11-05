"""Băm mật khẩu (bcrypt) và token JWT."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings

THUAT_TOAN = "HS256"
TEN_COOKIE_TOKEN = "access_token"
TEN_COOKIE_PHIEN = "ma_phien"


def bam_mat_khau(mat_khau: str) -> str:
    return bcrypt.hashpw(mat_khau.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")


def kiem_tra_mat_khau(mat_khau: str, ma_bam: str) -> bool:
    try:
        return bcrypt.checkpw(mat_khau.encode("utf-8"), ma_bam.encode("utf-8"))
    except ValueError:
        return False


def tao_token(nguoi_dung_id: int, vai_tro: str) -> str:
    het_han = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_HET_HAN_GIO)
    return jwt.encode(
        {"sub": str(nguoi_dung_id), "vt": vai_tro, "exp": het_han},
        settings.JWT_SECRET,
        algorithm=THUAT_TOAN,
    )


def doc_token(token: str) -> int | None:
    """Trả về id người dùng nếu token hợp lệ và chưa hết hạn, ngược lại None."""
    try:
        du_lieu = jwt.decode(token, settings.JWT_SECRET, algorithms=[THUAT_TOAN])
        return int(du_lieu["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
