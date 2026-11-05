"""Nạp mọi model để Alembic và SQLAlchemy thấy metadata."""
from app.models.hoat_dong import LogTimKiem, LuotDoc, LuotMuon
from app.models.nguoi_dung import NguoiDung
from app.models.tai_lieu import BanSao, ChuDe, ChuDeNhanTay, CumTu, MaVanDe, TaiLieu, TaiLieuTuongTu

__all__ = [
    "BanSao", "ChuDe", "ChuDeNhanTay", "CumTu", "LogTimKiem", "LuotDoc", "LuotMuon", "MaVanDe", "NguoiDung", "TaiLieu", "TaiLieuTuongTu",
]
