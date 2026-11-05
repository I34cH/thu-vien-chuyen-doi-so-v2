"""Cấu hình ứng dụng, đọc từ biến môi trường và file .env ở gốc dự án."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Gốc dự án: backend/app/core/config.py -> lên 3 cấp là backend/, lên 4 cấp là gốc
GOC_DU_AN = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=GOC_DU_AN / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str
    JWT_SECRET: str = "doi-khoa-bi-mat-nay"
    CORS_ORIGINS: str = "http://localhost:5173"
    # Thư mục gốc lưu tệp (bản mềm nằm ở <STORAGE_DIR>/ban_mem); mặc định backend/storage
    STORAGE_DIR: str = str(GOC_DU_AN / "backend" / "storage")
    JWT_HET_HAN_GIO: int = 12
    COOKIE_SECURE: bool = False

    @property
    def thu_muc_ban_mem(self) -> Path:
        return Path(self.STORAGE_DIR).resolve() / "ban_mem"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
