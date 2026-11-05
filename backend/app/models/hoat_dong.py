"""Model lượt mượn, log tìm kiếm và lượt đọc bản mềm."""
from datetime import date, datetime

from sqlalchemy import (
    BigInteger, Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class LuotMuon(Base):
    __tablename__ = "luot_muon"
    __table_args__ = (
        CheckConstraint(
            "trang_thai IN ('cho_duyet', 'dang_muon', 'da_tra', 'tu_choi')", name="luot_muon_trang_thai_check"
        ),
        Index("idx_luot_muon_tl", "tai_lieu_id"),
        Index("idx_luot_muon_tt", "trang_thai"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    nguoi_dung_id: Mapped[int] = mapped_column(ForeignKey("nguoi_dung.id"))
    tai_lieu_id: Mapped[int] = mapped_column(ForeignKey("tai_lieu.id"))
    ban_sao_id: Mapped[int | None] = mapped_column(ForeignKey("ban_sao.id"))  # NULL khi chờ duyệt
    trang_thai: Mapped[str] = mapped_column(String(20), default="cho_duyet", server_default="cho_duyet")
    ngay_dang_ky: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ngay_muon: Mapped[date | None] = mapped_column(Date)
    han_tra: Mapped[date | None] = mapped_column(Date)
    ngay_tra: Mapped[date | None] = mapped_column(Date)
    du_lieu_mau: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")


class LogTimKiem(Base):
    __tablename__ = "log_tim_kiem"
    __table_args__ = (
        Index("idx_log_tu_khoa_chuan", "tu_khoa_chuan"),
        Index("idx_log_thoi_diem", "thoi_diem"),
        Index("idx_log_chon", "tai_lieu_chon_id"),
        Index("idx_log_quy_ve", "tu_khoa_quy_ve"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tu_khoa: Mapped[str] = mapped_column(Text)
    tu_khoa_chuan: Mapped[str] = mapped_column(Text)  # f_chuan_hoa(tu_khoa)
    # Dạng chuẩn sau khi gộp biến thể lỗi gõ (trigger log_quy_ve tự điền bằng quy_ve_cum), chặng 4
    tu_khoa_quy_ve: Mapped[str | None] = mapped_column(Text)
    so_ket_qua: Mapped[int] = mapped_column(Integer)
    tai_lieu_chon_id: Mapped[int | None] = mapped_column(ForeignKey("tai_lieu.id"))
    thoi_diem: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    nguoi_dung_id: Mapped[int | None] = mapped_column(ForeignKey("nguoi_dung.id"))  # NULL nếu khách
    ma_phien: Mapped[str | None] = mapped_column(String(64))
    du_lieu_mau: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")


class LuotDoc(Base):
    """Mỗi lần đọc bản mềm; nguoi_dung_id NULL nếu là khách."""

    __tablename__ = "luot_doc"
    __table_args__ = (
        Index("idx_luot_doc_tl", "tai_lieu_id"),
        Index("idx_luot_doc_thoi_diem", "thoi_diem"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tai_lieu_id: Mapped[int] = mapped_column(ForeignKey("tai_lieu.id", ondelete="CASCADE"))
    nguoi_dung_id: Mapped[int | None] = mapped_column(ForeignKey("nguoi_dung.id"))
    ma_phien: Mapped[str | None] = mapped_column(String(64))
    thoi_diem: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    du_lieu_mau: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
