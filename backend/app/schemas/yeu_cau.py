"""Mô hình dữ liệu vào (request body)."""
from pydantic import BaseModel, Field


class DangNhapVao(BaseModel):
    ten_dang_nhap: str = Field(min_length=1, max_length=60)
    mat_khau: str = Field(min_length=1, max_length=200)


class ChonTaiLieuVao(BaseModel):
    tai_lieu_id: int = Field(gt=0)


class DangKyMuonVao(BaseModel):
    tai_lieu_id: int = Field(gt=0)


class MaVanDeVao(BaseModel):
    ma: str = Field(min_length=1, max_length=20)
    ten: str | None = Field(default=None, max_length=200)


class ChuDeVao(BaseModel):
    nhan: str = Field(min_length=1, max_length=200)
