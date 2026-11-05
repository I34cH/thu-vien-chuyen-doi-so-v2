"""
Tách từ tiếng Việt cho tiêu đề tư liệu và dựng bảng từ vựng cum_tu (phục vụ tìm kiếm).

- Tách từ bằng pyvi (ViTokenizer, mô hình CRF): "Công tác lưu trữ" -> ["công_tác", "lưu_trữ"].
- cum_tu: mọi cụm 1–4 âm tiết liền nhau trong tiêu đề (không vượt dấu câu), khóa là dạng đã bỏ dấu, chữ thường
  (khớp f_chuan_hoa của CSDL), kèm số tư liệu chứa cụm và dạng có dấu phổ biến nhất (để hiển thị gợi ý sửa).
  Cụm 2–4 âm tiết mà pyvi ghép thành một từ trong >= 2 tiêu đề được đánh dấu la_tu_ghep (từng dùng cho tầng
  "khớp đủ các từ ghép" của tim_tai_lieu; migration 0004 đã bỏ tầng này, cột vẫn giữ để thống kê từ ghép).

Chạy độc lập (sau ETL): backend/.venv/Scripts/python -m pipeline.tach_tu
"""
import re
import time
import unicodedata
from collections import Counter, defaultdict

from pipeline.chung import engine

SO_AM_TIET_TOI_DA = 4
NGUONG_TU_GHEP = 2  # số tiêu đề tối thiểu pyvi ghép cụm thành một từ

# Từ chung chung trong tiêu đề khóa luận/luận văn: bỏ khi tính TF-IDF (không bỏ khỏi chỉ mục tìm kiếm)
TU_DUNG_TFIDF = set("""
và của các những cho với tại trong về một số là ở từ đến theo đối nhằm qua trên việc này đó khi được có bị do để nên
thì mà như sau trước giữa hiện nay năm đã sẽ đang cũng vẫn ra vào lại hay hoặc rất nhiều ít mới cách ta nước
tìm_hiểu bước_đầu góp_phần vấn_đề thực_trạng giải_pháp nâng_cao hoàn_thiện nghiên_cứu khảo_sát một_số hiện_nay
đề_xuất kiến_nghị thực_tiễn lý_luận cơ_sở đặc_điểm ứng_dụng phương_hướng đánh_giá định_hướng biện_pháp
nội_dung ý_nghĩa vai_trò tác_động ảnh_hưởng mối quan_hệ giai_đoạn thời_kỳ trường_hợp qua_trình quá_trình
tình_hình kết_quả hiệu_quả trên_địa_bàn địa_bàn
""".split())


def bo_dau(s: str) -> str:
    s = s.replace("đ", "d").replace("Đ", "D")
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def am_tiet(s: str) -> list[str]:
    return re.findall(r"[^\W_]+", s)


def doan(s: str) -> list[str]:
    """Cắt theo dấu câu: cụm không vượt qua dấu câu."""
    return [d for d in re.split(r"[^\w\s]", s) if d.strip()]


def tach_tieu_de(tieu_de: list[str]) -> list[list[str]]:
    """Tách từ bằng pyvi; trả về danh sách từ (chữ thường, có dấu, từ ghép nối bằng '_'), bỏ dấu câu."""
    from pyvi import ViTokenizer

    ket_qua = []
    for td in tieu_de:
        tu = ViTokenizer.tokenize(unicodedata.normalize("NFC", td)).split()
        ket_qua.append([t.lower() for t in tu if re.search(r"[^\W_\d]", t)])
    # Lượt 2: pyvi đôi khi tách không nhất quán ("hồ_chí minh" bên cạnh "hồ_chí_minh"); ghép hai từ liền nhau
    # nếu dạng ghép đã xuất hiện như một từ ở tiêu đề khác.
    da_biet = {t for tu in ket_qua for t in tu if "_" in t}
    for k, tu in enumerate(ket_qua):
        moi, i = [], 0
        while i < len(tu):
            if i + 1 < len(tu) and f"{tu[i]}_{tu[i + 1]}" in da_biet:
                moi.append(f"{tu[i]}_{tu[i + 1]}")
                i += 2
            else:
                moi.append(tu[i])
                i += 1
        ket_qua[k] = moi
    return ket_qua


def dung_cum_tu(cur) -> dict:
    """Tính và ghi bảng cum_tu; trả về {'so_cum', 'so_tu_ghep', 'tieu_de_tach': {id: [từ]}}."""
    cur.execute("SELECT id, tieu_de, lower(tieu_de) FROM tai_lieu ORDER BY id")
    dong = cur.fetchall()

    so_tl = Counter()                      # khóa cụm -> số tư liệu chứa
    dang_co_dau = defaultdict(Counter)     # khóa cụm -> Counter(dạng có dấu)
    for _, _, thuong in dong:
        thuong = unicodedata.normalize("NFC", thuong)
        da_thay = set()
        for d in doan(thuong):
            tu = am_tiet(d)
            khoa_tu = [bo_dau(t).lower() for t in tu]
            for n in range(1, SO_AM_TIET_TOI_DA + 1):
                for i in range(len(tu) - n + 1):
                    k = " ".join(khoa_tu[i:i + n])
                    dang_co_dau[k][" ".join(tu[i:i + n])] += 1
                    da_thay.add(k)
        so_tl.update(da_thay)

    # Từ ghép theo pyvi
    tach = tach_tieu_de([r[1] for r in dong])
    dem_ghep = Counter()
    for tu_list in tach:
        dem_ghep.update({bo_dau(t.replace("_", " ")).lower() for t in tu_list if "_" in t})
    tu_ghep = {k for k, v in dem_ghep.items()
               if v >= NGUONG_TU_GHEP and 2 <= len(k.split()) <= SO_AM_TIET_TOI_DA and k in so_tl}

    cur.execute("TRUNCATE cum_tu")
    cur.executemany(
        "INSERT INTO cum_tu (cum, so_am_tiet, do_dai, so_tai_lieu, hien_thi, la_tu_ghep) "
        "VALUES (%s, %s, %s, %s, %s, %s)",
        [(k, len(k.split()), len(k), v, dang_co_dau[k].most_common(1)[0][0], k in tu_ghep)
         for k, v in so_tl.items() if len(k) <= 200],
    )
    return {
        "so_cum": len(so_tl),
        "so_tu_ghep": len(tu_ghep),
        "tieu_de_tach": {r[0]: t for r, t in zip(dong, tach)},
    }


def chay() -> dict:
    t0 = time.perf_counter()
    kn = engine.raw_connection()
    try:
        cur = kn.cursor()
        kq = dung_cum_tu(cur)
        kn.commit()
    finally:
        kn.close()
    print(f"cum_tu: {kq['so_cum']} cụm, {kq['so_tu_ghep']} từ ghép (pyvi) — {time.perf_counter() - t0:.1f} giây")
    return kq


if __name__ == "__main__":
    chay()
