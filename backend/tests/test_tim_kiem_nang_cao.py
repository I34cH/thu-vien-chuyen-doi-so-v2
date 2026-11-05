"""Kiểm thử chặng 4: giảm khớp nhầm, chịu lỗi gõ, gợi ý sửa, gợi ý từ khóa sạch, tư liệu tương tự, chủ đề.
Chạy trên CSDL đã reset (python -m pipeline.reset: có cum_tu, tai_lieu_tuong_tu, chu_de)."""
import re
import unicodedata

from helpers import sql


def bo_dau(s: str) -> str:
    s = s.replace("đ", "d").replace("Đ", "D")
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


def chua_cum(tieu_de: str, cum: str) -> bool:
    tu = re.findall(r"[a-z0-9]+", bo_dau(tieu_de))
    c = cum.split()
    return any(tu[i:i + len(c)] == c for i in range(len(tu) - len(c) + 1))


def tim(client, q, du_lieu_test, **them):
    d = client.get("/api/tim-kiem", params={"q": q, **them}).json()
    if d.get("log_id"):
        du_lieu_test["log_ids"].append(d["log_id"])
    return d


def test_hoc_may_khong_con_khop_nham(khach, du_lieu_test):
    """Kho không có tư liệu nào về học máy: v1 ra 11 kết quả (khớp 'học' và 'máy' ở hai chỗ khác nhau)."""
    for q in ("học máy", "hoc may", "trí tuệ nhân tạo", "machine learning"):
        d = tim(khach, q, du_lieu_test)
        assert d["tong_so"] == 0 and d["du_lieu"] == [], q
        assert d["goi_y_sua"] is None, q
    # log vẫn ghi 0 kết quả (để thủ thư thấy nhu cầu chưa đáp ứng)
    assert sql("SELECT so_ket_qua FROM log_tim_kiem WHERE id = :i", i=du_lieu_test["log_ids"][-1])[0][0] == 0


def test_tu_dung_khong_co_trong_kho_khong_goi_y_sua(khach, du_lieu_test):
    assert tim(khach, "python", du_lieu_test)["goi_y_sua"] is None
    assert tim(khach, "blockchain", du_lieu_test)["goi_y_sua"] is None


def test_lu_tru_van_ra_ket_qua_lien_quan(khach, du_lieu_test):
    d = tim(khach, "lu tru", du_lieu_test, kich_thuoc=20)
    chuan = tim(khach, "lưu trữ", du_lieu_test)
    assert d["tong_so"] >= chuan["tong_so"] > 0
    # 20 kết quả đầu đều chứa cụm "lưu trữ" (sau khi bỏ dấu)
    assert all(chua_cum(x["tieu_de"], "luu tru") for x in d["du_lieu"])
    assert d["goi_y_sua"] == "lưu trữ"


def test_goi_y_sua_cho_loi_go(khach, du_lieu_test):
    assert tim(khach, "vn thư", du_lieu_test)["goi_y_sua"] == "văn thư"
    assert tim(khach, "van phogn", du_lieu_test)["goi_y_sua"] == "văn phòng"
    assert tim(khach, "lich us", du_lieu_test)["goi_y_sua"] == "lịch sử"  # đổi chỗ hai ký tự
    # gõ đúng (kể cả không dấu, sai dấu) -> không gợi ý
    for q in ("lưu trữ", "luu tru", "lưu trư", "văn thư"):
        assert tim(khach, q, du_lieu_test)["goi_y_sua"] is None, q


def test_khop_cum_lien_khong_khop_am_tiet_roi(khach, du_lieu_test):
    """'văn thư' chỉ khớp tiêu đề có hai âm tiết liền nhau (v1 khớp cả 'văn bản ... thư viện')."""
    d = tim(khach, "văn thư", du_lieu_test, kich_thuoc=100)
    assert d["tong_so"] > 0 and all(chua_cum(x["tieu_de"] + " " + (x["tac_gia"] or ""), "van thu")
                               for x in d["du_lieu"])
    # Migration 0004 bỏ tầng "khớp đủ các từ ghép" (quyết định của người dùng): chỉ khớp cụm liền, nên đảo thứ tự
    # hai từ ghép KHÔNG còn khớp. "hồ sơ lưu trữ" chỉ ra tư liệu chứa liền "hồ sơ lưu trữ" (không có "lưu trữ hồ sơ").
    for q, cum, dao in (("hồ sơ lưu trữ", "ho so luu tru", "luu tru ho so"),
                        ("lưu trữ hồ sơ", "luu tru ho so", "ho so luu tru")):
        a = tim(khach, q, du_lieu_test, kich_thuoc=100)
        assert a["tong_so"] > 0 and a["da_sua"] is None, q
        assert all(chua_cum(x["tieu_de"] + " " + (x["tac_gia"] or ""), cum) for x in a["du_lieu"]), q
        assert not any(chua_cum(x["tieu_de"], dao) and not chua_cum(x["tieu_de"], cum) for x in a["du_lieu"]), q
    # "bộ máy hành chính": không còn tư liệu chứa "bộ máy" và "hành chính" rời nhau
    bm = tim(khach, "bộ máy hành chính", du_lieu_test, kich_thuoc=100)
    assert bm["tong_so"] > 0 and all(chua_cum(x["tieu_de"] + " " + (x["tac_gia"] or ""), "bo may hanh chinh")
                                     for x in bm["du_lieu"])


def test_go_sai_hien_ket_qua_cum_da_sua_va_tim_chinh_xac(khach, du_lieu_test):
    """Như các công cụ tìm kiếm phổ biến: mặc định hiện kết quả của cụm đã sửa (da_sua), kèm lối tìm chính xác
    (chinh_xac=1: bỏ qua sửa lỗi, chỉ khớp nguyên văn)."""
    d = tim(khach, "lu tru", du_lieu_test)
    assert d["da_sua"] == "lưu trữ" and d["goi_y_sua"] == "lưu trữ"
    cx = tim(khach, "lu tru", du_lieu_test, chinh_xac=1, kich_thuoc=100)
    assert cx["da_sua"] is None and cx["goi_y_sua"] == "lưu trữ"  # vẫn trả để hỏi "Có phải bạn muốn tìm …?"
    assert 0 < cx["tong_so"] < d["tong_so"]
    assert all(chua_cum(x["tieu_de"] + " " + (x["tac_gia"] or ""), "lu tru") for x in cx["du_lieu"])
    # log ghi số kết quả của đúng chế độ đã tìm
    assert sql("SELECT so_ket_qua FROM log_tim_kiem WHERE id = :i", i=cx["log_id"])[0][0] == cx["tong_so"]
    # "vn thư": nguyên văn không có tư liệu nào -> chính xác ra 0, mặc định ra kết quả của "văn thư"
    assert tim(khach, "vn thư", du_lieu_test)["da_sua"] == "văn thư"
    vn = tim(khach, "vn thư", du_lieu_test, chinh_xac=1)
    assert vn["tong_so"] == 0 and vn["da_sua"] is None
    # gõ đúng: không sửa, chinh_xac không đổi kết quả
    a = tim(khach, "văn thư", du_lieu_test)
    b = tim(khach, "văn thư", du_lieu_test, chinh_xac=1)
    assert a["da_sua"] is None and b["da_sua"] is None and a["tong_so"] == b["tong_so"] > 0
    # không có từ khóa: da_sua = null
    assert khach.get("/api/tim-kiem").json()["da_sua"] is None


def test_goi_y_tu_khoa_khong_hien_bien_the_loi_go(khach, du_lieu_test):
    truoc = {x["tu_khoa"]: x["so_lan"] for x in khach.get("/api/goi-y", params={"q": "luu"}).json()["tu_khoa"]}
    # 3 lượt gõ sai "luuu tru" (trigger gộp về "luu tru") và 2 lượt "luu tru" không dấu
    for tk in ["luuu tru"] * 3 + ["luu tru"] * 2:
        du_lieu_test["log_ids"].append(
            sql("INSERT INTO log_tim_kiem (tu_khoa, tu_khoa_chuan, so_ket_qua, du_lieu_mau) "
                "VALUES (:t, f_chuan_hoa(:t), 900, false) RETURNING id", t=tk)[0][0])
    assert sql("SELECT tu_khoa_quy_ve FROM log_tim_kiem WHERE id = :i", i=du_lieu_test["log_ids"][-3])[0][0] == "luu tru"
    sau = khach.get("/api/goi-y", params={"q": "luu"}).json()["tu_khoa"]
    ten = {x["tu_khoa"]: x["so_lan"] for x in sau}
    assert "luuu tru" not in ten and "luu tru" not in ten
    assert ten["lưu trữ"] == truoc["lưu trữ"] + 5
    # Mọi gợi ý (với nhiều tiền tố) đều là dạng chuẩn: quy_ve_cum(gợi ý) = f_chuan_hoa(gợi ý)
    for tien_to in ("lu", "va", "ho", "quan", "cong", "tai"):
        for x in khach.get("/api/goi-y", params={"q": tien_to}).json()["tu_khoa"]:
            dong = sql("SELECT quy_ve_cum(:t) = f_chuan_hoa(:t)", t=x["tu_khoa"])[0][0]
            assert dong, (tien_to, x)


def test_tuong_tu_diem_giam_dan(khach):
    tl_id = sql("SELECT tai_lieu_id FROM tai_lieu_tuong_tu GROUP BY 1 HAVING count(*) >= 8 ORDER BY 1 LIMIT 1")[0][0]
    d = khach.get(f"/api/tai-lieu/{tl_id}/tuong-tu").json()
    assert 1 <= len(d) <= 6  # gioi_han mặc định 6
    diem = [x["diem"] for x in d]
    assert diem == sorted(diem, reverse=True) and all(0.2 <= x <= 1.0001 for x in diem)
    assert all(x["tai_lieu"]["id"] != tl_id for x in d)
    assert set(d[0]) == {"tai_lieu", "diem"} and "tieu_de" in d[0]["tai_lieu"]
    d10 = khach.get(f"/api/tai-lieu/{tl_id}/tuong-tu", params={"gioi_han": 10}).json()
    assert len(d10) >= len(d) and [x["diem"] for x in d10][:len(d)] == diem
    # tối đa 10 tư liệu tương tự mỗi tư liệu
    assert sql("SELECT max(c) FROM (SELECT count(*) c FROM tai_lieu_tuong_tu GROUP BY tai_lieu_id) x")[0][0] <= 10


def test_chu_de_cho_themeriver():
    so_cd, khong_nhan = sql("SELECT count(*), count(*) FILTER (WHERE nhan = '' OR cardinality(tu_khoa_noi_bat) = 0) "
                            "FROM chu_de")[0]
    assert 8 <= so_cd <= 12 and khong_nhan == 0
    assert sql("SELECT count(*) FROM tai_lieu WHERE chu_de_id IS NULL AND sheet_goc <> 'TEST'")[0][0] == 0
