"""Model người dùng."""
from sqlalchemy import Boolean, CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

# Nhóm vai trò khi kiểm tra quyền
VAI_TRO_NGUOI_DUNG = ("sinh_vien", "giang_vien")
VAI_TRO_THU_THU = ("thu_thu", "admin")


class NguoiDung(Base):
    __tablename__ = "nguoi_dung"
    __table_args__ = (
        CheckConstraint(
            "vai_tro IN ('sinh_vien', 'giang_vien', 'thu_thu', 'admin')", name="nguoi_dung_vai_tro_check"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    ten_dang_nhap: Mapped[str] = mapped_column(String(60), unique=True)
    mat_khau_hash: Mapped[str] = mapped_column(String(100))
    ho_ten: Mapped[str] = mapped_column(String(200))
    vai_tro: Mapped[str] = mapped_column(String(20))
    du_lieu_mau: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    @property
    def nhom(self) -> str:
        return "thu_thu" if self.vai_tro in VAI_TRO_THU_THU else "nguoi_dung"
