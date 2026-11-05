"""Phần dùng chung: đường dẫn, cấu hình và engine lấy từ backend."""
import sys
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
THU_MUC_BACKEND = GOC / "backend"
# Dùng chung cấu hình và engine với backend
if str(THU_MUC_BACKEND) not in sys.path:
    sys.path.insert(0, str(THU_MUC_BACKEND))

from app.core.config import settings  # noqa: E402
from app.db.session import engine  # noqa: E402

FILE_EXCEL = GOC / "data" / "[Bản chuẩn] DANH MỤC TƯ LIỆU KHOA.xlsx"
THU_MUC_BAO_CAO = GOC / "outputs" / "reports"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

__all__ = ["GOC", "FILE_EXCEL", "THU_MUC_BAO_CAO", "settings", "engine"]
