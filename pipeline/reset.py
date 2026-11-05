"""
Đặt lại toàn bộ dữ liệu: alembic downgrade base -> upgrade head -> ETL -> tách từ (cum_tu)
-> TF-IDF (tư liệu tương tự, chủ đề) -> seed, rồi in tóm tắt và thời gian từng bước.
Nhãn chủ đề thủ thư sửa tay (bảng chu_de_nhan_tay) được sao lưu trước downgrade và nạp lại sau upgrade, để
pipeline.tuong_tu áp lại cho cụm khớp (quyết định của người dùng: nhãn sửa tay không bị ghi đè khi reset).
Tách từ phải chạy trước seed vì hàm tìm kiếm (seed dùng) cần bảng cum_tu để sửa lỗi gõ.
TF-IDF chạy trước seed (chặng 5) vì seed gán sở thích người mượn theo tai_lieu.chu_de_id.
Chạy: backend/.venv/Scripts/python -m pipeline.reset
"""
import json
import time

from alembic import command
from alembic.config import Config

from sqlalchemy import text

from pipeline import etl, seed, tach_tu, tuong_tu
from pipeline.chung import THU_MUC_BAO_CAO, THU_MUC_BACKEND, engine, settings


def sao_luu_nhan_tay() -> list[tuple]:
    """Đọc chu_de_nhan_tay nếu bảng đã có (CSDL ở revision >= 0004); không có thì trả []."""
    with engine.connect() as kn:
        if kn.execute(text("SELECT to_regclass('chu_de_nhan_tay') IS NOT NULL")).scalar_one():
            return [tuple(r) for r in kn.execute(text("SELECT khoa, tu_khoa, nhan, cap_nhat FROM chu_de_nhan_tay"))]
    return []


def nap_lai_nhan_tay(dong: list[tuple]) -> None:
    with engine.begin() as kn:
        for khoa, tu_khoa, nhan, cap_nhat in dong:
            kn.execute(text("INSERT INTO chu_de_nhan_tay (khoa, tu_khoa, nhan, cap_nhat) VALUES (:k, :t, :n, :c)"),
                       {"k": khoa, "t": list(tu_khoa or []), "n": nhan, "c": cap_nhat})


def don_tep_tai_len() -> int:
    """Xóa các bản mềm do thủ thư tải lên (giữ thư mục mau/)."""
    thu_muc = settings.thu_muc_ban_mem
    if not thu_muc.is_dir():
        return 0
    so = 0
    for tep in thu_muc.glob("*.pdf"):
        tep.unlink()
        so += 1
    return so


def chay() -> dict:
    cau_hinh = Config(str(THU_MUC_BACKEND / "alembic.ini"))
    thoi_gian = {}
    t = time.perf_counter()

    def bam_gio(buoc):
        nonlocal t
        thoi_gian[buoc] = round(time.perf_counter() - t, 1)
        t = time.perf_counter()

    nhan_tay = sao_luu_nhan_tay()
    # Bản sao lưu ra tệp phòng khi reset hỏng giữa chừng (sau downgrade, trước khi nạp lại)
    THU_MUC_BAO_CAO.mkdir(parents=True, exist_ok=True)
    (THU_MUC_BAO_CAO / "chu_de_nhan_tay_sao_luu.json").write_text(json.dumps(
        [{"khoa": k, "tu_khoa": list(tk or []), "nhan": n, "cap_nhat": c.isoformat()} for k, tk, n, c in nhan_tay],
        ensure_ascii=False, indent=1), encoding="utf-8")
    print("== Alembic: downgrade base -> upgrade head")
    command.downgrade(cau_hinh, "base")
    command.upgrade(cau_hinh, "head")
    nap_lai_nhan_tay(nhan_tay)
    print(f"== Giữ {len(nhan_tay)} nhãn chủ đề sửa tay")
    print(f"== Dọn {don_tep_tai_len()} tệp bản mềm tải lên")
    bam_gio("migrate")
    print("== ETL")
    ket_qua_etl = etl.chay()
    bam_gio("etl")
    print("== Tách từ (pyvi) + từ vựng cum_tu")
    ket_qua_tach = tach_tu.chay()
    bam_gio("tach_tu")
    # Chặng 5: TF-IDF chạy trước seed vì seed dùng chu_de_id để gán sở thích người mượn
    print("== TF-IDF: tư liệu tương tự + chủ đề")
    ket_qua_tt = tuong_tu.chay(ket_qua_tach["tieu_de_tach"])
    bam_gio("tuong_tu")
    print("== Seed")
    ket_qua_seed = seed.chay()
    bam_gio("seed")
    print("== TÓM TẮT RESET")
    for khoa, gia_tri in ket_qua_seed.items():
        print(f"{khoa:<18}{gia_tri:>7}")
    for khoa in ("so_cum", "so_tu_ghep"):
        print(f"{khoa:<18}{ket_qua_tach[khoa]:>7}")
    for khoa in ("so_cap_tuong_tu", "so_chu_de"):
        print(f"{khoa:<18}{ket_qua_tt[khoa]:>7}")
    print("Thời gian (giây): " + ", ".join(f"{k} {v}" for k, v in thoi_gian.items())
          + f" | tổng {round(sum(thoi_gian.values()), 1)}")
    return {"etl": ket_qua_etl, "seed": ket_qua_seed, "tuong_tu": ket_qua_tt, "thoi_gian": thoi_gian}


if __name__ == "__main__":
    chay()
