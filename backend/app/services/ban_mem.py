"""Lưu trữ và đọc bản mềm PDF, chống path traversal."""
from pathlib import Path

from app.core.config import settings


def giai_duong_dan(duong_dan_tuong_doi: str) -> Path | None:
    """Đổi đường dẫn lưu trong CSDL thành đường dẫn tuyệt đối; None nếu thoát ra ngoài thư mục bản mềm."""
    goc = settings.thu_muc_ban_mem
    chuan = duong_dan_tuong_doi.replace("\\", "/")
    try:
        day_du = (goc / chuan).resolve()
        day_du.relative_to(goc)
    except (ValueError, OSError):
        return None
    if day_du == goc:
        return None
    return day_du


def xoa_tep_tu_tai_len(duong_dan_tuong_doi: str | None) -> None:
    """Xóa tệp bản mềm cũ do thủ thư tải lên (không đụng thư mục mau/)."""
    if not duong_dan_tuong_doi:
        return
    chuan = duong_dan_tuong_doi.replace("\\", "/")
    if chuan.startswith("mau/"):
        return
    day_du = giai_duong_dan(chuan)
    if day_du is not None and day_du.is_file():
        try:
            day_du.unlink()
        except OSError:
            pass
