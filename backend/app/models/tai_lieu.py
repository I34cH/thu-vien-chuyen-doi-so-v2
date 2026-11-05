"""Model tư liệu, mã vấn đề, bản sao và bảng tư liệu tương tự."""
from sqlalchemy import (
    Boolean, CheckConstraint, Computed, Float, ForeignKey, Index, Integer, SmallInteger, String, Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MaVanDe(Base):
    __tablename__ = "ma_van_de"

    ma: Mapped[str] = mapped_column(String(20), primary_key=True)
    # Chưa có giải nghĩa thì để NULL
    ten: Mapped[str | None] = mapped_column(String(200))


class TaiLieu(Base):
    __tablename__ = "tai_lieu"
    __table_args__ = (
        CheckConstraint("muc_truy_cap IN ('cong_khai', 'noi_bo')", name="tai_lieu_muc_truy_cap_check"),
        Index("idx_tai_lieu_tsv", "tsv", postgresql_using="gin"),
        Index("idx_tai_lieu_loai", "loai_hinh"),
        Index("idx_tai_lieu_chu_de", "chu_de_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    ky_hieu: Mapped[str] = mapped_column(String(40), unique=True)
    loai_hinh: Mapped[str] = mapped_column(String(30))
    tieu_de: Mapped[str] = mapped_column(Text)
    tac_gia: Mapped[str | None] = mapped_column(String(500))
    gvhd: Mapped[str | None] = mapped_column(String(500))
    co_quan: Mapped[str | None] = mapped_column(String(500))
    nxb: Mapped[str | None] = mapped_column(String(500))
    nam: Mapped[int | None] = mapped_column(Integer)
    nam_goc: Mapped[str | None] = mapped_column(String(60))
    ma_van_de: Mapped[str | None] = mapped_column(ForeignKey("ma_van_de.ma"))
    khoa_hoc: Mapped[str | None] = mapped_column(String(40))
    he: Mapped[str | None] = mapped_column(String(40))
    ghi_chu: Mapped[str | None] = mapped_column(Text)
    khong_co_tl: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    co_ban_mem: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    muc_truy_cap: Mapped[str | None] = mapped_column(String(20))
    duong_dan_ban_mem: Mapped[str | None] = mapped_column(String(300))
    # Cột sinh sẵn (STORED): tiêu đề + tác giả đã bỏ dấu, phục vụ full-text
    tsv = mapped_column(
        TSVECTOR,
        Computed(
            "to_tsvector('simple', f_chuan_hoa(coalesce(tieu_de, '') || ' ' || coalesce(tac_gia, '')))",
            persisted=True,
        ),
    )
    sheet_goc: Mapped[str] = mapped_column(String(60))
    dong_goc: Mapped[int] = mapped_column(Integer)
    # Chủ đề do pipeline.tuong_tu gom cụm (KMeans trên TF-IDF), chặng 4
    chu_de_id: Mapped[int | None] = mapped_column(ForeignKey("chu_de.id", ondelete="SET NULL"))

    ban_sao: Mapped[list["BanSao"]] = relationship(back_populates="tai_lieu", cascade="all, delete-orphan")


class BanSao(Base):
    __tablename__ = "ban_sao"
    __table_args__ = (
        CheckConstraint("trang_thai IN ('con', 'dang_muon', 'mat')", name="ban_sao_trang_thai_check"),
        Index("idx_ban_sao_tl", "tai_lieu_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    tai_lieu_id: Mapped[int] = mapped_column(ForeignKey("tai_lieu.id", ondelete="CASCADE"))
    ma_ban_sao: Mapped[str] = mapped_column(String(60), unique=True)
    trang_thai: Mapped[str] = mapped_column(String(20), default="con", server_default="con")
    du_lieu_mau: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    tai_lieu: Mapped[TaiLieu] = relationship(back_populates="ban_sao")


class TaiLieuTuongTu(Base):
    """Cặp tư liệu giống nhau và điểm TF-IDF (do pipeline tính ở chặng 4)."""

    __tablename__ = "tai_lieu_tuong_tu"

    tai_lieu_id: Mapped[int] = mapped_column(ForeignKey("tai_lieu.id", ondelete="CASCADE"), primary_key=True)
    tai_lieu_lien_quan_id: Mapped[int] = mapped_column(
        ForeignKey("tai_lieu.id", ondelete="CASCADE"), primary_key=True
    )
    diem: Mapped[float] = mapped_column(Float)


class ChuDe(Base):
    """Chủ đề tư liệu (gom cụm TF-IDF), nhãn là 2–3 từ nổi bật; dùng cho ThemeRiver chặng 5."""

    __tablename__ = "chu_de"

    id: Mapped[int] = mapped_column(primary_key=True)
    nhan: Mapped[str] = mapped_column(String(200))
    tu_khoa_noi_bat: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default="{}")
    # Migration 0004: nhãn pipeline sinh, chữ ký ổn định của cụm, cờ thủ thư đã sửa tay
    nhan_tu_dong: Mapped[str | None] = mapped_column(String(200))
    khoa: Mapped[str | None] = mapped_column(Text)
    da_sua_tay: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")


class ChuDeNhanTay(Base):
    """Nhãn chủ đề thủ thư sửa tay, giữ qua các lần gom cụm lại (khóa = chữ ký cụm, xem pipeline.tuong_tu)."""

    __tablename__ = "chu_de_nhan_tay"

    khoa: Mapped[str] = mapped_column(Text, primary_key=True)
    tu_khoa: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default="{}")
    nhan: Mapped[str] = mapped_column(String(200))


class CumTu(Base):
    """Từ vựng tiêu đề: cụm 1–4 âm tiết đã bỏ dấu (pipeline.tach_tu điền), dùng để sửa lỗi gõ và tách từ ghép."""

    __tablename__ = "cum_tu"
    __table_args__ = (Index("idx_cum_tu_do_dai", "so_am_tiet", "do_dai"),)

    cum: Mapped[str] = mapped_column(Text, primary_key=True)
    so_am_tiet: Mapped[int] = mapped_column(SmallInteger)
    do_dai: Mapped[int] = mapped_column(SmallInteger)
    so_tai_lieu: Mapped[int] = mapped_column(Integer)
    hien_thi: Mapped[str] = mapped_column(Text)
    la_tu_ghep: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
