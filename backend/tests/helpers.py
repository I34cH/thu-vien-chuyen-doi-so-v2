"""Hàm hỗ trợ dùng chung cho các test API."""
import io

from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db.session import SessionLocal
from app.main import app

PDF_NHO = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n"


def sql(cau_lenh: str, **tham_so):
    """Chạy một câu SQL có tham số, commit; trả về các dòng (nếu có)."""
    with SessionLocal() as db:
        kq = db.execute(text(cau_lenh), tham_so)
        dong = kq.all() if kq.returns_rows else None
        db.commit()
        return dong


def dang_nhap(ten: str, mat_khau: str) -> TestClient:
    c = TestClient(app)
    res = c.post("/api/auth/dang-nhap", json={"ten_dang_nhap": ten, "mat_khau": mat_khau})
    assert res.status_code == 200, res.text
    return c


def tao_tai_lieu(ky_hieu: str, tieu_de: str, so_ban: int, **them) -> int:
    cot = {"loai_hinh": "sach", "tac_gia": "Nhóm Test", "nam": 2026, "khong_co_tl": False, "co_ban_mem": False}
    cot.update(them)
    tl_id = sql(
        """INSERT INTO tai_lieu (ky_hieu, loai_hinh, tieu_de, tac_gia, nam, khong_co_tl, co_ban_mem,
                                 sheet_goc, dong_goc)
           VALUES (:ky_hieu, :loai_hinh, :tieu_de, :tac_gia, :nam, :khong_co_tl, :co_ban_mem, 'TEST', 1)
           RETURNING id""",
        ky_hieu=ky_hieu, tieu_de=tieu_de, **cot,
    )[0][0]
    for k in range(1, so_ban + 1):
        sql("INSERT INTO ban_sao (tai_lieu_id, ma_ban_sao, du_lieu_mau) VALUES (:t, :m, false)",
            t=tl_id, m=f"{ky_hieu}-{k}")
    return tl_id


def tep_pdf(noi_dung: bytes = PDF_NHO, ten: str = "ban_mem.pdf", loai: str = "application/pdf"):
    return {"file": (ten, io.BytesIO(noi_dung), loai)}
