"""Kiểm thử chặng 5: ThemeRiver chủ đề, đồ thị mượn cùng nhau, điểm lan tỏa, quản lý nhãn chủ đề.

Chạy trên CSDL đã có dữ liệu (`python -m pipeline.reset`). Số liệu được đối chiếu với SQL viết độc lập.
"""
import datetime
import math

import pytest
from helpers import sql

MOI = ["/api/thong-ke/chu-de-theo-thoi-gian", "/api/thong-ke/muon-cung-nhau", "/api/quan-ly/chu-de"]


# ---------------------------------------------------------------- Phân quyền
def test_quyen_api_chang5(khach, sv, gv):
    for duong_dan in MOI:
        assert khach.get(duong_dan).status_code == 401, duong_dan
        assert sv.get(duong_dan).status_code == 403, duong_dan
        assert gv.get(duong_dan).status_code == 403, duong_dan
    assert khach.put("/api/quan-ly/chu-de/1", json={"nhan": "x"}).status_code == 401
    assert sv.put("/api/quan-ly/chu-de/1", json={"nhan": "x"}).status_code == 403
    assert khach.post("/api/quan-ly/chu-de/1/khoi-phuc").status_code == 401
    assert sv.post("/api/quan-ly/chu-de/1/khoi-phuc").status_code == 403


# ---------------------------------------------------------------- ThemeRiver
SQL_DEM_CHU_DE = """SELECT count(*) FROM log_tim_kiem l JOIN tai_lieu t ON t.id = l.tai_lieu_chon_id
                    WHERE t.chu_de_id IS NOT NULL AND l.thoi_diem::date BETWEEN :a AND :b"""


def test_chu_de_theo_thoi_gian_hinh_dang_va_gop_tuan(thuthu):
    d = thuthu.get("/api/thong-ke/chu-de-theo-thoi-gian").json()
    assert set(d) == {"chu_de", "don_vi", "du_lieu"}
    assert d["don_vi"] == "tuan"  # mặc định 90 ngày > 45
    assert d["chu_de"] and set(d["chu_de"][0]) == {"id", "nhan", "so_luot"}
    tong = [c["so_luot"] for c in d["chu_de"]]
    assert tong == sorted(tong, reverse=True) and min(tong) > 0
    nhan = {c["nhan"] for c in d["chu_de"]}
    ky = sorted({r[0] for r in d["du_lieu"]})
    # đủ lưới kỳ × chủ đề, mọi dòng [ngay, so_luot, nhan]
    assert len(d["du_lieu"]) == len(ky) * len(nhan)
    assert all(len(r) == 3 and r[2] in nhan and r[1] >= 0 for r in d["du_lieu"])
    den = datetime.date.today()
    tu = den - datetime.timedelta(days=89)
    # mỗi kỳ là thứ Hai (trừ kỳ đầu bị cắt tại tu_ngay)
    assert ky[0] == tu.isoformat()
    assert all(datetime.date.fromisoformat(k).weekday() == 0 for k in ky[1:])
    assert 13 <= len(ky) <= 15
    # tổng khớp SQL: chỉ log có chọn tư liệu (có chủ đề) trong khoảng ngày
    assert sum(r[1] for r in d["du_lieu"]) == sql(SQL_DEM_CHU_DE, a=tu, b=den)[0][0]
    # tổng theo chủ đề khớp so_luot
    theo_nhan = {}
    for _, n, c in d["du_lieu"]:
        theo_nhan[c] = theo_nhan.get(c, 0) + n
    assert all(theo_nhan[c["nhan"]] == c["so_luot"] for c in d["chu_de"])


def test_chu_de_theo_thoi_gian_theo_ngay_va_bo_loc(thuthu):
    den = datetime.date.today()
    tu = den - datetime.timedelta(days=29)
    loc = {"tu_ngay": tu.isoformat(), "den_ngay": den.isoformat()}
    d = thuthu.get("/api/thong-ke/chu-de-theo-thoi-gian", params=loc).json()
    assert d["don_vi"] == "ngay"
    assert len({r[0] for r in d["du_lieu"]}) == 30
    assert sum(r[1] for r in d["du_lieu"]) == sql(SQL_DEM_CHU_DE, a=tu, b=den)[0][0]
    # lọc loại hình: chỉ đếm log chọn tư liệu thuộc loại đó
    loai = "khoa_luan"
    dl = thuthu.get("/api/thong-ke/chu-de-theo-thoi-gian", params={**loc, "loai": loai}).json()
    sql_loai = sql(SQL_DEM_CHU_DE + " AND t.loai_hinh = :l", a=tu, b=den, l=loai)[0][0]
    assert sum(r[1] for r in dl["du_lieu"]) == sql_loai > 0
    # lọc từ khóa (cụm chuẩn hóa)
    dk = thuthu.get("/api/thong-ke/chu-de-theo-thoi-gian", params={**loc, "tu_khoa": "Lưu trữ"}).json()
    sql_tk = sql(SQL_DEM_CHU_DE + " AND l.tu_khoa_chuan = 'luu tru'", a=tu, b=den)[0][0]
    assert sum(r[1] for r in dk["du_lieu"]) == sql_tk > 0
    # từ khóa không có -> rỗng
    z = thuthu.get("/api/thong-ke/chu-de-theo-thoi-gian", params={"tu_khoa": "khong-ton-tai-xyz"}).json()
    assert z["chu_de"] == [] and z["du_lieu"] == []
    # ngưỡng 45 ngày: 45 ngày vẫn theo ngày, 46 ngày gộp tuần
    for so_ngay, don_vi in ((45, "ngay"), (46, "tuan")):
        p = {"tu_ngay": (den - datetime.timedelta(days=so_ngay - 1)).isoformat(), "den_ngay": den.isoformat()}
        assert thuthu.get("/api/thong-ke/chu-de-theo-thoi-gian", params=p).json()["don_vi"] == don_vi
    assert thuthu.get("/api/thong-ke/chu-de-theo-thoi-gian", params={"tu_ngay": "2020-01-01"}).status_code == 400


# ---------------------------------------------------------------- Mượn cùng nhau
SQL_CANH = """WITH m AS (SELECT DISTINCT nguoi_dung_id AS nd, tai_lieu_id AS tl FROM luot_muon
                         WHERE trang_thai <> 'tu_choi' AND ngay_dang_ky::date >= CURRENT_DATE - 89)
              SELECT a.tl, b.tl, count(*) FROM m a JOIN m b ON a.nd = b.nd AND a.tl < b.tl GROUP BY 1, 2"""


def test_muon_cung_nhau_hinh_dang_va_so_lieu(thuthu):
    res = thuthu.get("/api/thong-ke/muon-cung-nhau")
    assert res.status_code == 200
    assert "nguoi_dung" not in res.text and "ho_ten" not in res.text  # chỉ số tổng hợp
    d = res.json()
    assert set(d) == {"nut", "canh", "nguong", "trong_so_lon_nhat", "tong_so_nut"}
    assert d["nguong"] == 2 and d["nut"] and d["canh"]
    assert set(d["nut"][0]) == {"id", "ten", "tieu_de", "ky_hieu", "loai_hinh", "chu_de", "so_luot_muon"}
    assert set(d["canh"][0]) == {"nguon", "dich", "trong_so"}
    ids = {n["id"] for n in d["nut"]}
    assert all(c["nguon"] in ids and c["dich"] in ids and c["trong_so"] >= 2 for c in d["canh"])
    # mọi nút đều có ít nhất một cạnh; tên rút gọn ≤ 48 ký tự
    dau_mut = {c["nguon"] for c in d["canh"]} | {c["dich"] for c in d["canh"]}
    assert dau_mut == ids and all(len(n["ten"]) <= 48 for n in d["nut"])
    # trọng số khớp SQL viết độc lập
    sql_canh = {(a, b): w for a, b, w in sql(SQL_CANH)}
    assert all(sql_canh[(c["nguon"], c["dich"])] == c["trong_so"] for c in d["canh"])
    assert d["trong_so_lon_nhat"] == max(sql_canh.values())
    assert len(d["canh"]) == sum(1 for w in sql_canh.values() if w >= 2)
    # so_luot_muon khớp SQL
    n0 = d["nut"][0]
    assert n0["so_luot_muon"] == sql(
        "SELECT count(*) FROM luot_muon WHERE tai_lieu_id = :t AND trang_thai <> 'tu_choi' "
        "AND ngay_dang_ky::date >= CURRENT_DATE - 89", t=n0["id"])[0][0]


def test_muon_cung_nhau_nguong_gioi_han_va_bo_loc(thuthu):
    rong = thuthu.get("/api/thong-ke/muon-cung-nhau", params={"nguong": 2, "gioi_han_nut": 5}).json()
    assert len(rong["nut"]) == 5 < rong["tong_so_nut"]
    assert all(c["trong_so"] >= 2 for c in rong["canh"])
    cao = thuthu.get("/api/thong-ke/muon-cung-nhau", params={"nguong": 50}).json()
    assert cao["nut"] == [] and cao["canh"] == [] and cao["trong_so_lon_nhat"] > 0
    # ngưỡng tối thiểu 2 bạn đọc chung (quyết định của người dùng): 0 và 1 -> 400
    for nguong in (0, 1):
        assert thuthu.get("/api/thong-ke/muon-cung-nhau", params={"nguong": nguong}).status_code == 400
    # lọc loại: mọi nút thuộc loại đó (chọn loại có ít nhất một cạnh >= 2 theo SQL độc lập)
    loai = sql("""WITH m AS (SELECT DISTINCT l.nguoi_dung_id AS nd, l.tai_lieu_id AS tl, t.loai_hinh
                             FROM luot_muon l JOIN tai_lieu t ON t.id = l.tai_lieu_id
                             WHERE l.trang_thai <> 'tu_choi' AND l.ngay_dang_ky::date >= CURRENT_DATE - 89)
                  SELECT a.loai_hinh FROM m a JOIN m b ON a.nd = b.nd AND a.tl < b.tl AND a.loai_hinh = b.loai_hinh
                  GROUP BY a.loai_hinh, a.tl, b.tl HAVING count(*) >= 2 ORDER BY count(*) DESC, 1 LIMIT 1""")[0][0]
    dl = thuthu.get("/api/thong-ke/muon-cung-nhau", params={"nguong": 2, "loai": loai}).json()
    assert dl["nut"] and all(n["loai_hinh"] == loai for n in dl["nut"])
    # khoảng ngày không có lượt mượn -> rỗng
    p = {"tu_ngay": "2026-01-01", "den_ngay": "2026-01-31"}
    assert thuthu.get("/api/thong-ke/muon-cung-nhau", params=p).json()["nut"] == []


# ---------------------------------------------------------------- Điểm lan tỏa
SQL_LAN_TOA = """WITH doc AS (SELECT tai_lieu_id AS tl, count(*) AS n FROM luot_doc
                              WHERE thoi_diem::date >= CURRENT_DATE - 89 GROUP BY 1)
                 SELECT coalesce(sum(tt.diem * ln(1 + doc.n)), 0) FROM tai_lieu_tuong_tu tt
                 JOIN tai_lieu s ON s.id = tt.tai_lieu_id AND s.co_ban_mem
                 JOIN tai_lieu u ON u.id = tt.tai_lieu_lien_quan_id
                 JOIN doc ON doc.tl = s.id
                 WHERE tt.tai_lieu_lien_quan_id = :t AND f_chuan_hoa(s.tieu_de) <> f_chuan_hoa(u.tieu_de)"""


def test_nen_so_hoa_diem_lan_toa(thuthu):
    d = thuthu.get("/api/thong-ke/nen-so-hoa", params={"gioi_han": 200}).json()
    co = [x for x in d if x["diem_lan_toa"] > 0]
    assert co, "phải có tư liệu được cộng điểm lan tỏa"
    for x in co[:10]:
        assert x["diem_lan_toa"] == pytest.approx(round(sql(SQL_LAN_TOA, t=x["tai_lieu"]["id"])[0][0], 1))
        assert 1 <= len(x["lan_toa_tu"]) <= 3
        assert set(x["lan_toa_tu"][0]) == {"id", "tieu_de", "so_luot_doc", "diem_tuong_tu", "dong_gop"}
        dong_gop = [n["dong_gop"] for n in x["lan_toa_tu"]]
        assert dong_gop == sorted(dong_gop, reverse=True)
        for n in x["lan_toa_tu"]:
            # công thức mới: đóng góp = độ tương tự × ln(1 + lượt đọc)
            assert n["dong_gop"] == pytest.approx(math.log1p(n["so_luot_doc"]) * n["diem_tuong_tu"], abs=0.051)
        # chỉ có 1 nguồn thì đóng góp bằng đúng điểm lan tỏa
        if len(x["lan_toa_tu"]) == 1:
            assert x["lan_toa_tu"][0]["dong_gop"] == pytest.approx(x["diem_lan_toa"], abs=0.051)
        nguon = [n["id"] for n in x["lan_toa_tu"]]
        assert all(r[0] for r in sql("SELECT co_ban_mem FROM tai_lieu WHERE id = ANY(:i)", i=nguon))
    for x in d:
        if x["diem_lan_toa"] == 0:
            assert x["lan_toa_tu"] == []
    # lượt chọn và lượt mượn là thành phần chính: top 10 không có tư liệu nào chỉ nhờ lan tỏa, và trong top 10
    # phần lan tỏa không vượt quá phần chọn + 2 × mượn
    for x in d[:10]:
        truc_tiep = x["so_lan_chon"] + 2 * x["so_luot_muon"]
        assert truc_tiep > 0 and x["diem_lan_toa"] <= truc_tiep, x
    # khoảng ngày không có lượt đọc -> không có lan tỏa
    p = {"tu_ngay": "2026-01-01", "den_ngay": "2026-01-31"}
    assert all(x["diem_lan_toa"] == 0 for x in thuthu.get("/api/thong-ke/nen-so-hoa", params=p).json())


# ---------------------------------------------------------------- Quản lý chủ đề
def test_quan_ly_chu_de(thuthu):
    ds = thuthu.get("/api/quan-ly/chu-de").json()
    assert len(ds) == sql("SELECT count(*) FROM chu_de")[0][0] > 0
    assert set(ds[0]) == {"id", "nhan", "nhan_tu_dong", "da_sua_tay", "tu_khoa_noi_bat", "so_tai_lieu"}
    assert [x["so_tai_lieu"] for x in ds] == sorted((x["so_tai_lieu"] for x in ds), reverse=True)
    assert sum(x["so_tai_lieu"] for x in ds) == sql("SELECT count(*) FROM tai_lieu WHERE chu_de_id IS NOT NULL")[0][0]
    assert not any(x["da_sua_tay"] for x in ds), "CSDL sạch không có nhãn sửa tay"
    a, b = ds[0], ds[1]
    khoa_a = sql("SELECT khoa FROM chu_de WHERE id = :i", i=a["id"])[0][0]
    assert khoa_a
    try:
        res = thuthu.put(f"/api/quan-ly/chu-de/{a['id']}", json={"nhan": "  Lưu trữ   học  "})
        assert res.status_code == 200
        assert res.json() == {**a, "nhan": "Lưu trữ học", "da_sua_tay": True}
        # nhãn tay được lưu theo chữ ký cụm (để pipeline.reset/tuong_tu áp lại)
        assert sql("SELECT nhan FROM chu_de_nhan_tay WHERE khoa = :k", k=khoa_a) == [("Lưu trữ học",)]
        # ThemeRiver dùng nhãn mới
        tr = thuthu.get("/api/thong-ke/chu-de-theo-thoi-gian").json()
        nhan_moi = {c["id"]: c["nhan"] for c in tr["chu_de"]}
        assert nhan_moi.get(a["id"], "Lưu trữ học") == "Lưu trữ học"
        # trùng nhãn chủ đề khác (không phân biệt hoa thường) -> 409; rỗng -> 400; không có -> 404
        assert thuthu.put(f"/api/quan-ly/chu-de/{b['id']}", json={"nhan": "lưu TRỮ học"}).status_code == 409
        assert thuthu.put(f"/api/quan-ly/chu-de/{a['id']}", json={"nhan": "   "}).status_code == 400
        assert thuthu.put(f"/api/quan-ly/chu-de/{a['id']}", json={"nhan": ""}).status_code == 400
        assert thuthu.put("/api/quan-ly/chu-de/999999", json={"nhan": "x"}).status_code == 404
        assert thuthu.post("/api/quan-ly/chu-de/999999/khoi-phuc").status_code == 404
        # khôi phục nhãn tự động: bỏ cờ, xóa khỏi chu_de_nhan_tay
        kp = thuthu.post(f"/api/quan-ly/chu-de/{a['id']}/khoi-phuc")
        assert kp.status_code == 200 and kp.json() == a
        assert sql("SELECT count(*) FROM chu_de_nhan_tay WHERE khoa = :k", k=khoa_a)[0][0] == 0
        # đặt đúng bằng nhãn tự động cũng coi như không sửa tay
        thuthu.put(f"/api/quan-ly/chu-de/{a['id']}", json={"nhan": "Tạm"})
        assert thuthu.put(f"/api/quan-ly/chu-de/{a['id']}", json={"nhan": a["nhan_tu_dong"]}).json()["da_sua_tay"] is False
    finally:
        sql("UPDATE chu_de SET nhan = :n, da_sua_tay = false WHERE id = :i", n=a["nhan"], i=a["id"])
        sql("DELETE FROM chu_de_nhan_tay WHERE khoa = :k", k=khoa_a)


def test_nhan_tay_ap_lai_khi_gom_cum_lai():
    """pipeline.tuong_tu.ap_nhan_tay: khớp theo chữ ký, khớp gần đúng (Jaccard) khi cụm đổi nhẹ, nhãn tự động trùng
    nhãn tay được thêm hậu tố. Chạy trong giao dịch rồi rollback (không đụng dữ liệu)."""
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from pipeline.tuong_tu import NHAN_TONG_HOP, ap_nhan_tay, khoa_cum

    from app.db.session import engine

    def cum(tu, nhan):
        return {"khoa": khoa_cum(tu), "tu_khoa_noi_bat": tu, "nhan": nhan, "nhan_tu_dong": nhan, "da_sua_tay": False}

    a = cum(["lưu trữ", "tài liệu", "trung tâm", "quốc gia", "phông", "hồ sơ", "kho", "bảo quản"], "lưu trữ, tài liệu")
    b = cum(["văn phòng", "quản trị", "hoạt động", "bộ", "công tác", "tổ chức", "cơ quan", "hiện đại"], "văn phòng")
    c = cum(["hà nội", "tập", "văn hóa", "luật", "tổ chức", "xã hội", "kinh tế", "giáo dục"], NHAN_TONG_HOP)
    kn = engine.raw_connection()
    try:
        cur = kn.cursor()
        # nhãn tay 1: trùng chữ ký cụm a; nhãn tay 2: cụm b cũ có 6/8 từ giống (Jaccard 0,6) và khác chữ ký;
        # nhãn tay 3: không khớp cụm nào
        b_cu = ["văn phòng", "quản trị", "hoạt động", "bộ", "công tác", "tổ chức", "doanh nghiệp", "nhà nước"]
        cur.execute("INSERT INTO chu_de_nhan_tay (khoa, tu_khoa, nhan) VALUES (%s, %s, %s), (%s, %s, %s), (%s, %s, %s)",
                    (a["khoa"], a["tu_khoa_noi_bat"], "Lưu trữ quốc gia", "khoa-cu-b", b_cu, NHAN_TONG_HOP,
                     "khong|khop", ["xyz", "abc"], "Không khớp"))
        mo_ta = ap_nhan_tay(cur, [a, b, c])
        assert (a["nhan"], a["da_sua_tay"]) == ("Lưu trữ quốc gia", True)
        assert (b["nhan"], b["da_sua_tay"]) == (NHAN_TONG_HOP, True)
        # cụm c tự động cũng mang nhãn "Tổng hợp…" -> thêm hậu tố để nhãn không trùng
        assert (c["nhan"], c["da_sua_tay"]) == (f"{NHAN_TONG_HOP} (2)", False)
        assert any("không khớp" in m for m in mo_ta)
        # khớp gần đúng thì chữ ký đã lưu được cập nhật theo cụm mới
        cur.execute("SELECT khoa FROM chu_de_nhan_tay WHERE nhan = %s", (NHAN_TONG_HOP,))
        assert cur.fetchone()[0] == b["khoa"]
    finally:
        kn.rollback()
        kn.close()


def test_chu_de_tong_hop_cho_cum_kem_tap_trung():
    """Cụm kém tập trung nhận nhãn tự động "Tổng hợp (nhiều chủ đề)"; mọi chủ đề có chữ ký và nhãn tự động."""
    dong = sql("SELECT nhan_tu_dong, khoa FROM chu_de")
    assert all(n and k for n, k in dong)
    tong_hop = [n for n, _ in dong if n.startswith("Tổng hợp (nhiều chủ đề)")]
    assert 1 <= len(tong_hop) < len(dong)
