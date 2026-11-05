"""Fixture chung cho kiểm thử API. Chạy trên CSDL thu_vien_v2 đã có dữ liệu (python -m pipeline.reset).

Mọi dữ liệu do test tạo (tư liệu TEST_*, bản sao, lượt mượn, log, lượt đọc, tệp PDF) đều được dọn khi kết thúc.
"""
import pytest
from fastapi.testclient import TestClient
from app.core.config import settings
from app.main import app

from helpers import dang_nhap, sql, tao_tai_lieu


@pytest.fixture(scope="session")
def khach() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="session")
def khach_khac() -> TestClient:
    """Một khách thứ hai (phiên khác) để thử quyền cập nhật log."""
    return TestClient(app)


@pytest.fixture(scope="session")
def sv() -> TestClient:
    return dang_nhap("sv01", "sv123")


@pytest.fixture(scope="session")
def gv() -> TestClient:
    return dang_nhap("gv01", "gv123")


@pytest.fixture(scope="session")
def thuthu() -> TestClient:
    return dang_nhap("thuthu", "thuthu123")


@pytest.fixture(scope="session", autouse=True)
def du_lieu_test():
    """Tạo tư liệu thử và dọn sạch dữ liệu liên quan khi kết thúc phiên test."""
    # Mốc id để dọn mọi log/lượt đọc thật do test sinh ra (kể cả khi không theo dõi từng id)
    moc_log = sql("SELECT coalesce(max(id), 0) FROM log_tim_kiem")[0][0]
    moc_doc = sql("SELECT coalesce(max(id), 0) FROM luot_doc")[0][0]
    ids = {
        "het_ban": tao_tai_lieu("TEST_HET_BAN", "Tư liệu kiểm thử không có bản sao", 0),
        "vong_doi": tao_tai_lieu("TEST_VONG_DOI", "Tư liệu kiểm thử vòng đời mượn trả", 1),
        "tu_choi": tao_tai_lieu("TEST_TU_CHOI", "Tư liệu kiểm thử từ chối mượn", 2),
        "ban_mem": tao_tai_lieu("TEST_BAN_MEM", "Tư liệu kiểm thử bản mềm", 1),
        "tuong_tu": tao_tai_lieu("TEST_TUONG_TU", "Tư liệu kiểm thử tương tự", 1),
        "khong_co_tl": tao_tai_lieu("TEST_KHONG_TL", "Tư liệu kiểm thử không có tài liệu", 0, khong_co_tl=True),
    }
    log_ids: list[int] = []
    yield {"id": ids, "log_ids": log_ids}

    # --- Dọn dữ liệu ---
    danh_sach = list(ids.values())
    sql("DELETE FROM luot_doc WHERE tai_lieu_id = ANY(:ids) OR (id > :moc AND NOT du_lieu_mau)",
        ids=danh_sach, moc=moc_doc)
    sql("""DELETE FROM log_tim_kiem WHERE id = ANY(:lg) OR tai_lieu_chon_id = ANY(:ids)
           OR tu_khoa LIKE 'zzkiemthu%' OR (id > :moc AND NOT du_lieu_mau)""",
        lg=log_ids, ids=danh_sach, moc=moc_log)
    sql("DELETE FROM luot_muon WHERE tai_lieu_id = ANY(:ids)", ids=danh_sach)
    sql("DELETE FROM tai_lieu_tuong_tu WHERE tai_lieu_id = ANY(:ids) OR tai_lieu_lien_quan_id = ANY(:ids)",
        ids=danh_sach)
    sql("DELETE FROM ban_sao WHERE tai_lieu_id = ANY(:ids)", ids=danh_sach)
    sql("DELETE FROM tai_lieu WHERE id = ANY(:ids)", ids=danh_sach)
    # Xóa mọi tệp PDF do test tải lên (tên tl_<id tư liệu>_<mốc thời gian>.pdf)
    for tl_id in danh_sach:
        for tep in settings.thu_muc_ban_mem.glob(f"tl_{tl_id}_*.pdf"):
            tep.unlink()
