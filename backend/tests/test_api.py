"""Kiểm thử API lõi (port các ca của v1 + gợi ý từ khóa, facet, bộ lọc thống kê).

Chạy trên CSDL đã có dữ liệu: `python -m pipeline.reset`, rồi `pytest -q` trong backend/.
"""
import datetime
import time

import pytest
from helpers import PDF_NHO, sql, tep_pdf

from app.core.config import settings

TAT_CA_THONG_KE = [
    "tong-quan", "tu-khoa", "theo-ngay", "khong-ket-qua", "nen-so-hoa", "theo-loai-hinh", "luot-doc",
    "chu-de-theo-thoi-gian", "muon-cung-nhau",
]


def dem_log(tu_khoa_chuan: str) -> int:
    return sql("SELECT count(*) FROM log_tim_kiem WHERE tu_khoa_chuan = :k AND NOT du_lieu_mau",
               k=tu_khoa_chuan)[0][0]


def dem_luot_doc(tai_lieu_id: int) -> int:
    return sql("SELECT count(*) FROM luot_doc WHERE tai_lieu_id = :t", t=tai_lieu_id)[0][0]


def trang_thai_ban_sao(tai_lieu_id: int) -> list[str]:
    return [r[0] for r in sql("SELECT trang_thai FROM ban_sao WHERE tai_lieu_id = :t ORDER BY id", t=tai_lieu_id)]


# ---------------------------------------------------------------- Tài khoản
def test_dang_nhap_sai_va_thieu_du_lieu(khach):
    assert khach.post("/api/auth/dang-nhap", json={"ten_dang_nhap": "sv01", "mat_khau": "sai"}).status_code == 401
    assert khach.post("/api/auth/dang-nhap", json={"ten_dang_nhap": "khong_co", "mat_khau": "x"}).status_code == 401
    assert khach.post("/api/auth/dang-nhap", json={"ten_dang_nhap": "sv01"}).status_code == 400
    assert khach.post("/api/auth/dang-nhap", json={}).status_code == 400
    # kiểu dữ liệu sai
    res = khach.post("/api/auth/dang-nhap", json={"ten_dang_nhap": 123, "mat_khau": ["x"]})
    assert res.status_code == 400 and "detail" in res.json()


def test_dang_nhap_dat_cookie_httponly_va_toi(sv):
    res = sv.get("/api/auth/toi")
    nd = res.json()["nguoi_dung"]
    assert nd["ten_dang_nhap"] == "sv01" and nd["vai_tro"] == "sinh_vien" and nd["nhom"] == "nguoi_dung"
    assert "mat_khau_hash" not in nd


def test_toi_khach_la_null(khach):
    assert khach.get("/api/auth/toi").json() == {"nguoi_dung": None}


def test_cookie_token_httponly_samesite_lax():
    from fastapi.testclient import TestClient

    from app.main import app
    c = TestClient(app)
    res = c.post("/api/auth/dang-nhap", json={"ten_dang_nhap": "gv01", "mat_khau": "gv123"})
    set_cookie = res.headers["set-cookie"].lower()
    assert "access_token=" in set_cookie and "httponly" in set_cookie and "samesite=lax" in set_cookie
    assert res.json()["nguoi_dung"]["vai_tro"] == "giang_vien"


def test_dang_xuat():
    from fastapi.testclient import TestClient

    from app.main import app
    c = TestClient(app)
    c.post("/api/auth/dang-nhap", json={"ten_dang_nhap": "sv01", "mat_khau": "sv123"})
    assert c.get("/api/auth/toi").json()["nguoi_dung"] is not None
    assert c.post("/api/auth/dang-xuat").json() == {"ok": True}
    assert c.get("/api/auth/toi").json()["nguoi_dung"] is None
    assert c.get("/api/muon/cua-toi").status_code == 401


# ---------------------------------------------------------------- Tra cứu
def test_gioi_thieu(khach):
    d = khach.get("/api/gioi-thieu").json()
    assert d["tong_tai_lieu"] >= 3000 and d["da_so_hoa"] >= 0
    assert d["so_loai_hinh"] == len(d["theo_loai_hinh"]) == 8
    assert set(d["theo_loai_hinh"][0]) == {"loai_hinh", "so_luong"}
    assert isinstance(d["tu_khoa_noi_bat"], list)


def test_tim_luu_tru_co_ket_qua_va_tao_dung_1_log(khach, du_lieu_test):
    truoc = dem_log("luu tru")
    res = khach.get("/api/tim-kiem", params={"q": "luu tru"})
    assert res.status_code == 200
    d = res.json()
    du_lieu_test["log_ids"].append(d["log_id"])
    assert d["tong_so"] > 0 and len(d["du_lieu"]) == min(20, d["tong_so"])
    assert d["trang"] == 1 and d["kich_thuoc"] == 20 and d["tong_trang"] >= 1
    assert d["log_id"] is not None and d["goi_y_sua"] is None and d["da_sua"] is None
    assert dem_log("luu tru") == truoc + 1
    # cấu trúc TaiLieuTomTat
    mot = d["du_lieu"][0]
    assert set(mot) == {"id", "ky_hieu", "tieu_de", "tac_gia", "loai_hinh", "nam", "so_ban", "so_ban_con",
                        "co_ban_mem", "muc_truy_cap", "khong_co_tl"}
    ghi = sql("SELECT so_ket_qua, du_lieu_mau, tu_khoa FROM log_tim_kiem WHERE id = :i", i=d["log_id"])[0]
    assert ghi.so_ket_qua == d["tong_so"] and ghi.du_lieu_mau is False and ghi.tu_khoa == "luu tru"


def test_phan_trang_khong_sinh_log(khach, du_lieu_test):
    r1 = khach.get("/api/tim-kiem", params={"q": "tai lieu"}).json()
    du_lieu_test["log_ids"].append(r1["log_id"])
    truoc = dem_log("tai lieu")
    r2 = khach.get("/api/tim-kiem", params={"q": "tai lieu", "trang": 2}).json()
    assert r2["log_id"] is None and r2["trang"] == 2 and r2["du_lieu"]
    assert dem_log("tai lieu") == truoc
    assert {x["id"] for x in r1["du_lieu"]}.isdisjoint({x["id"] for x in r2["du_lieu"]})


def test_trang_vuot_nguong_giu_tong_so(khach):
    d = khach.get("/api/tim-kiem", params={"q": "tai lieu", "trang": 999}).json()
    assert d["du_lieu"] == [] and d["tong_so"] > 0 and d["log_id"] is None


def test_duyet_khong_tu_khoa_khong_ghi_log(khach):
    truoc = sql("SELECT count(*) FROM log_tim_kiem")[0][0]
    d = khach.get("/api/tim-kiem", params={"q": ""}).json()
    assert d["log_id"] is None and d["tong_so"] >= 3000 and len(d["du_lieu"]) == 20
    assert sql("SELECT count(*) FROM log_tim_kiem")[0][0] == truoc


def test_tim_ky_tu_dac_biet_khong_sap(khach, du_lieu_test):
    for q in ["%%%", "'; DROP TABLE tai_lieu; --", "a\0b", "\\", "_" * 50, "( | ! &", "x" * 500]:
        res = khach.get("/api/tim-kiem", params={"q": q})
        assert res.status_code == 200, q
        if res.json()["log_id"]:
            du_lieu_test["log_ids"].append(res.json()["log_id"])
    assert khach.get("/api/gioi-thieu").status_code == 200  # bảng còn nguyên


def test_tim_khong_dau_va_sai_chinh_ta_nhe(khach, du_lieu_test):
    a = khach.get("/api/tim-kiem", params={"q": "lưu trữ"}).json()
    b = khach.get("/api/tim-kiem", params={"q": "luu tru"}).json()
    du_lieu_test["log_ids"] += [a["log_id"], b["log_id"]]
    assert a["tong_so"] == b["tong_so"] > 0
    c = khach.get("/api/tim-kiem", params={"q": "luu trư"}).json()
    du_lieu_test["log_ids"].append(c["log_id"])
    assert c["tong_so"] > 0


def test_facet_va_bo_loc(khach):
    d = khach.get("/api/tim-kiem", params={"q": "luu tru", "kich_thuoc": 100}).json()
    facet = d["facet"]
    assert set(facet) == {"loai_hinh", "thap_nien"}
    assert sum(x["so_luong"] for x in facet["loai_hinh"]) == d["tong_so"]
    assert all(set(x) == {"gia_tri", "so_luong"} for x in facet["loai_hinh"] + facet["thap_nien"])
    assert facet["thap_nien"] == sorted(facet["thap_nien"], key=lambda x: x["gia_tri"])
    # lọc theo loại: kết quả đều thuộc loại; facet loại vẫn cho thấy các loại khác
    loai = facet["loai_hinh"][0]["gia_tri"]
    dl = khach.get("/api/tim-kiem", params={"q": "luu tru", "loai": loai, "kich_thuoc": 100}).json()
    assert dl["tong_so"] == facet["loai_hinh"][0]["so_luong"]
    assert {x["loai_hinh"] for x in dl["du_lieu"]} == {loai}
    assert len(dl["facet"]["loai_hinh"]) == len(facet["loai_hinh"])
    # lọc năm
    dn = khach.get("/api/tim-kiem", params={"q": "luu tru", "tu_nam": 2010, "den_nam": 2015, "kich_thuoc": 100}).json()
    assert dn["tong_so"] > 0 and all(2010 <= x["nam"] <= 2015 for x in dn["du_lieu"])
    # còn bản
    dc = khach.get("/api/tim-kiem", params={"q": "luu tru", "con_ban": "true", "kich_thuoc": 100}).json()
    assert all(x["so_ban_con"] > 0 for x in dc["du_lieu"])
    # có bản mềm
    dm = khach.get("/api/tim-kiem", params={"co_ban_mem": "true", "kich_thuoc": 100}).json()
    assert dm["tong_so"] > 0 and all(x["co_ban_mem"] for x in dm["du_lieu"])
    # sắp xếp
    dmn = khach.get("/api/tim-kiem", params={"q": "luu tru", "sap_xep": "moi_nhat", "kich_thuoc": 50}).json()
    nam = [x["nam"] for x in dmn["du_lieu"] if x["nam"] is not None]
    assert nam == sorted(nam, reverse=True)
    dcn = khach.get("/api/tim-kiem", params={"q": "luu tru", "sap_xep": "cu_nhat", "kich_thuoc": 50}).json()
    nam = [x["nam"] for x in dcn["du_lieu"] if x["nam"] is not None]
    assert nam == sorted(nam)
    assert khach.get("/api/tim-kiem", params={"q": "x", "sap_xep": "lung_tung"}).status_code == 400
    assert khach.get("/api/tim-kiem", params={"q": "x", "trang": 0}).status_code == 400


def test_goi_y(khach):
    assert khach.get("/api/goi-y", params={"q": "l"}).json() == {"tai_lieu": [], "tu_khoa": []}
    assert khach.get("/api/goi-y").json() == {"tai_lieu": [], "tu_khoa": []}
    d = khach.get("/api/goi-y", params={"q": "luu"}).json()
    assert 0 < len(d["tai_lieu"]) <= 6 and set(d["tai_lieu"][0]) == {"id", "tieu_de", "loai_hinh", "nam"}
    assert 0 < len(d["tu_khoa"]) <= 5
    assert all(set(x) == {"tu_khoa", "so_lan"} for x in d["tu_khoa"])
    assert d["tu_khoa"][0]["tu_khoa"] == "lưu trữ"  # gõ không dấu vẫn ra cụm có dấu từ log
    assert [x["so_lan"] for x in d["tu_khoa"]] == sorted((x["so_lan"] for x in d["tu_khoa"]), reverse=True)


def test_goi_y_tu_khoa_tu_log(khach, du_lieu_test):
    """Cụm riêng lẻ (1 lượt) không được gợi ý; từ 2 lượt trở lên thì có; cụm 0 kết quả bị loại."""
    ids = []
    for tk, so_kq in [("zzkiemthu alpha", 1), ("zzkiemthu alpha", 1), ("zzkiemthu beta", 1),
                      ("zzkiemthu gama", 0), ("zzkiemthu gama", 0)]:
        ids.append(sql("INSERT INTO log_tim_kiem (tu_khoa, tu_khoa_chuan, so_ket_qua, du_lieu_mau) "
                       "VALUES (:t, f_chuan_hoa(:t), :k, false) RETURNING id", t=tk, k=so_kq)[0][0])
    du_lieu_test["log_ids"] += ids
    d = khach.get("/api/goi-y", params={"q": "zzkiemthu"}).json()
    ten = {x["tu_khoa"]: x["so_lan"] for x in d["tu_khoa"]}
    assert ten == {"zzkiemthu alpha": 2}
    # khớp đầu một từ ở giữa cụm, và có phân biệt dấu/không dấu
    assert khach.get("/api/goi-y", params={"q": "ALPHA"}).json()["tu_khoa"][0]["tu_khoa"] == "zzkiemthu alpha"


def test_chon_ket_qua(khach, khach_khac, du_lieu_test):
    d = khach.get("/api/tim-kiem", params={"q": "van ban"}).json()
    log_id = d["log_id"]
    du_lieu_test["log_ids"].append(log_id)
    tl_id = d["du_lieu"][0]["id"]
    # dữ liệu sai
    assert khach.post(f"/api/tim-kiem/{log_id}/chon", json={}).status_code == 400
    assert khach.post(f"/api/tim-kiem/{log_id}/chon", json={"tai_lieu_id": "abc"}).status_code == 400
    assert khach.post(f"/api/tim-kiem/{log_id}/chon", json={"tai_lieu_id": -1}).status_code == 400
    assert khach.post("/api/tim-kiem/abc/chon", json={"tai_lieu_id": tl_id}).status_code == 400
    # không tồn tại
    assert khach.post("/api/tim-kiem/999999999/chon", json={"tai_lieu_id": tl_id}).status_code == 404
    assert khach.post(f"/api/tim-kiem/{log_id}/chon", json={"tai_lieu_id": 999999999}).status_code == 404
    # phiên khác không được cập nhật
    khach_khac.get("/api/gioi-thieu")
    assert khach_khac.post(f"/api/tim-kiem/{log_id}/chon", json={"tai_lieu_id": tl_id}).status_code == 403
    # đúng phiên
    assert khach.post(f"/api/tim-kiem/{log_id}/chon", json={"tai_lieu_id": tl_id}).json() == {"ok": True}
    assert sql("SELECT tai_lieu_chon_id FROM log_tim_kiem WHERE id = :i", i=log_id)[0][0] == tl_id


def test_chi_tiet_tai_lieu(khach, sv):
    d = khach.get("/api/tai-lieu/1").json()
    for khoa in ("id", "ky_hieu", "tieu_de", "gvhd", "co_quan", "nxb", "nam_goc", "he", "khoa_hoc", "ghi_chu",
                 "ma_van_de", "ban_sao", "luot_muon_cua_toi", "so_ban", "so_ban_con"):
        assert khoa in d, khoa
    assert "tsv" not in d and d["luot_muon_cua_toi"] is None
    assert d["so_ban"] == len(d["ban_sao"])
    assert set(d["ban_sao"][0]) == {"id", "ma_ban_sao", "trang_thai"}
    assert d["ma_van_de"] is None or set(d["ma_van_de"]) == {"ma", "ten"}
    assert khach.get("/api/tai-lieu/99999999").status_code == 404
    assert khach.get("/api/tai-lieu/abc").status_code == 400


def test_tuong_tu_rong_roi_co_du_lieu(khach, du_lieu_test):
    a, b = du_lieu_test["id"]["tuong_tu"], du_lieu_test["id"]["vong_doi"]
    assert khach.get(f"/api/tai-lieu/{a}/tuong-tu").json() == []
    sql("INSERT INTO tai_lieu_tuong_tu VALUES (:a, :b, 0.42)", a=a, b=b)
    d = khach.get(f"/api/tai-lieu/{a}/tuong-tu").json()
    assert len(d) == 1 and d[0]["diem"] == pytest.approx(0.42) and d[0]["tai_lieu"]["id"] == b
    sql("DELETE FROM tai_lieu_tuong_tu WHERE tai_lieu_id = :a", a=a)


def test_endpoint_khong_ton_tai_tra_json_404(khach):
    res = khach.get("/api/khong-co-endpoint-nay")
    assert res.status_code == 404 and "detail" in res.json()
    # chặng 5 đã có API này: khách nhận 401 (không phải 404)
    assert khach.get("/api/thong-ke/muon-cung-nhau").status_code == 401


# ---------------------------------------------------------------- Mượn trả
def test_khach_muon_401(khach, du_lieu_test):
    res = khach.post("/api/muon", json={"tai_lieu_id": du_lieu_test["id"]["vong_doi"]})
    assert res.status_code == 401
    assert khach.get("/api/muon/cua-toi").status_code == 401


def test_thu_thu_khong_dang_ky_muon_403(thuthu, du_lieu_test):
    assert thuthu.post("/api/muon", json={"tai_lieu_id": du_lieu_test["id"]["vong_doi"]}).status_code == 403


def test_dang_ky_muon_du_lieu_sai_va_het_ban(sv, du_lieu_test):
    assert sv.post("/api/muon", json={}).status_code == 400
    assert sv.post("/api/muon", json={"tai_lieu_id": "abc"}).status_code == 400
    assert sv.post("/api/muon", json={"tai_lieu_id": 99999999}).status_code == 404
    # hết bản sao / không có tài liệu -> 409
    assert sv.post("/api/muon", json={"tai_lieu_id": du_lieu_test["id"]["het_ban"]}).status_code == 409
    assert sv.post("/api/muon", json={"tai_lieu_id": du_lieu_test["id"]["khong_co_tl"]}).status_code == 409


def test_nguoi_dung_goi_thong_ke_403_khach_401(sv, gv, khach):
    for duong_dan in TAT_CA_THONG_KE:
        assert sv.get(f"/api/thong-ke/{duong_dan}").status_code == 403, duong_dan
        assert gv.get(f"/api/thong-ke/{duong_dan}").status_code == 403, duong_dan
        assert khach.get(f"/api/thong-ke/{duong_dan}").status_code == 401, duong_dan
    for duong_dan in ("/quan-ly/muon", "/quan-ly/tai-lieu", "/quan-ly/ma-van-de"):
        assert sv.get(f"/api{duong_dan}").status_code == 403
        assert khach.get(f"/api{duong_dan}").status_code == 401
    assert sv.post("/api/quan-ly/muon/1/duyet").status_code == 403


def test_duyet_het_ban_sao_409(sv, thuthu, du_lieu_test):
    het = du_lieu_test["id"]["het_ban"]
    luot_id = sql("INSERT INTO luot_muon (nguoi_dung_id, tai_lieu_id, trang_thai) "
                  "VALUES ((SELECT id FROM nguoi_dung WHERE ten_dang_nhap = 'sv01'), :t, 'cho_duyet') RETURNING id",
                  t=het)[0][0]
    res = thuthu.post(f"/api/quan-ly/muon/{luot_id}/duyet")
    assert res.status_code == 409
    assert sql("SELECT trang_thai FROM luot_muon WHERE id = :i", i=luot_id)[0][0] == "cho_duyet"
    assert thuthu.post("/api/quan-ly/muon/99999999/duyet").status_code == 404


def test_luong_dang_ky_duyet_tra(sv, thuthu, du_lieu_test):
    tl = du_lieu_test["id"]["vong_doi"]
    # đăng ký
    res = sv.post("/api/muon", json={"tai_lieu_id": tl})
    assert res.status_code == 201
    luot = res.json()
    assert luot["trang_thai"] == "cho_duyet" and luot["ma_ban_sao"] is None and luot["qua_han"] is False
    assert luot["tai_lieu"]["id"] == tl and "nguoi_dung" not in luot
    assert trang_thai_ban_sao(tl) == ["con"]
    # đăng ký trùng -> 409
    assert sv.post("/api/muon", json={"tai_lieu_id": tl}).status_code == 409
    # chi tiết hiện lượt mượn của tôi
    assert sv.get(f"/api/tai-lieu/{tl}").json()["luot_muon_cua_toi"]["id"] == luot["id"]
    # xuất hiện trong danh sách của tôi
    ds = sv.get("/api/muon/cua-toi").json()
    assert luot["id"] in [x["id"] for x in ds]
    # thủ thư thấy kèm người dùng và bộ đếm
    q = thuthu.get("/api/quan-ly/muon", params={"trang_thai": "cho_duyet", "q": "TEST_VONG_DOI"}).json()
    assert q["tong_so"] == 1 and q["du_lieu"][0]["nguoi_dung"]["ten_dang_nhap"] == "sv01"
    assert set(q["dem"]) == {"cho_duyet", "dang_muon", "qua_han", "da_tra", "tu_choi"}
    assert q["dem"]["cho_duyet"] == 1
    # duyệt
    res = thuthu.post(f"/api/quan-ly/muon/{luot['id']}/duyet")
    assert res.status_code == 200
    d = res.json()
    assert d["trang_thai"] == "dang_muon" and d["ma_ban_sao"] == "TEST_VONG_DOI-1" and d["qua_han"] is False
    han = datetime.date.fromisoformat(d["han_tra"])
    assert han - datetime.date.fromisoformat(d["ngay_muon"]) == datetime.timedelta(days=14)
    assert trang_thai_ban_sao(tl) == ["dang_muon"]
    assert sv.get(f"/api/tai-lieu/{tl}").json()["so_ban_con"] == 0
    # duyệt lại / từ chối lại -> 409; hết bản -> người khác đăng ký 409
    assert thuthu.post(f"/api/quan-ly/muon/{luot['id']}/duyet").status_code == 409
    assert thuthu.post(f"/api/quan-ly/muon/{luot['id']}/tu-choi").status_code == 409
    # trả
    res = thuthu.post(f"/api/quan-ly/muon/{luot['id']}/tra")
    assert res.status_code == 200 and res.json()["trang_thai"] == "da_tra"
    assert res.json()["ngay_tra"] == datetime.date.today().isoformat()
    assert trang_thai_ban_sao(tl) == ["con"]
    assert thuthu.post(f"/api/quan-ly/muon/{luot['id']}/tra").status_code == 409
    # sau khi trả có thể đăng ký lại
    assert sv.post("/api/muon", json={"tai_lieu_id": tl}).status_code == 201


def test_het_ban_sau_khi_duyet_nguoi_khac_409(gv, du_lieu_test):
    """Tư liệu vòng đời chỉ có 1 bản và đang có lượt chờ duyệt của sv01; gv01 vẫn đăng ký được (chưa duyệt)."""
    tl = du_lieu_test["id"]["vong_doi"]
    assert gv.post("/api/muon", json={"tai_lieu_id": tl}).status_code == 201


def test_qua_han_va_dem(thuthu, du_lieu_test):
    tl = du_lieu_test["id"]["tu_choi"]
    bs = sql("SELECT id FROM ban_sao WHERE tai_lieu_id = :t ORDER BY id LIMIT 1", t=tl)[0][0]
    sql("UPDATE ban_sao SET trang_thai = 'dang_muon' WHERE id = :b", b=bs)
    luot_id = sql(
        """INSERT INTO luot_muon (nguoi_dung_id, tai_lieu_id, ban_sao_id, trang_thai, ngay_muon, han_tra)
           VALUES ((SELECT id FROM nguoi_dung WHERE ten_dang_nhap = 'sv01'), :t, :b, 'dang_muon',
                   CURRENT_DATE - 20, CURRENT_DATE - 6) RETURNING id""", t=tl, b=bs)[0][0]
    d = thuthu.get("/api/quan-ly/muon", params={"trang_thai": "qua_han", "q": "TEST_TU_CHOI"}).json()
    assert d["tong_so"] == 1 and d["du_lieu"][0]["id"] == luot_id and d["du_lieu"][0]["qua_han"] is True
    assert d["dem"]["qua_han"] == 1 and d["dem"]["dang_muon"] == 1
    assert thuthu.post(f"/api/quan-ly/muon/{luot_id}/tra").status_code == 200


def test_tu_choi_muon(sv, thuthu, du_lieu_test):
    tl = du_lieu_test["id"]["tu_choi"]
    luot = sv.post("/api/muon", json={"tai_lieu_id": tl}).json()
    res = thuthu.post(f"/api/quan-ly/muon/{luot['id']}/tu-choi")
    assert res.status_code == 200 and res.json()["trang_thai"] == "tu_choi"
    assert trang_thai_ban_sao(tl) == ["con", "con"]
    assert thuthu.post(f"/api/quan-ly/muon/{luot['id']}/tra").status_code == 409
    assert thuthu.post("/api/quan-ly/muon/99999999/tu-choi").status_code == 404


def test_quan_ly_muon_loc_va_phan_trang(thuthu, sv):
    d = thuthu.get("/api/quan-ly/muon", params={"kich_thuoc": 5}).json()
    assert len(d["du_lieu"]) == 5 and d["tong_so"] >= 400 and d["tong_trang"] >= 80
    assert set(d) >= {"du_lieu", "tong_so", "trang", "kich_thuoc", "tong_trang", "dem"}
    for tt in ("cho_duyet", "dang_muon", "da_tra", "tu_choi"):
        r = thuthu.get("/api/quan-ly/muon", params={"trang_thai": tt, "kich_thuoc": 20}).json()
        assert all(x["trang_thai"] == tt for x in r["du_lieu"])
        assert r["tong_so"] == r["dem"][tt]
    assert thuthu.get("/api/quan-ly/muon", params={"trang_thai": "linh_tinh"}).status_code == 400
    assert sv.get("/api/quan-ly/muon").status_code == 403


# ---------------------------------------------------------------- Bản mềm
def test_upload_ban_mem_va_doc(khach, sv, thuthu, du_lieu_test):
    tl = du_lieu_test["id"]["ban_mem"]
    # chưa có bản mềm
    assert khach.get(f"/api/tai-lieu/{tl}/ban-mem").status_code == 404
    # người dùng thường không được tải lên
    assert sv.post(f"/api/quan-ly/tai-lieu/{tl}/ban-mem", files=tep_pdf(), data={"muc_truy_cap": "cong_khai"}).status_code == 403
    # tải lên nội bộ
    res = thuthu.post(f"/api/quan-ly/tai-lieu/{tl}/ban-mem", files=tep_pdf(), data={"muc_truy_cap": "noi_bo"})
    assert res.status_code == 200
    d = res.json()
    assert d["co_ban_mem"] is True and d["muc_truy_cap"] == "noi_bo" and d["id"] == tl and "ban_sao" in d
    # tệp thật sự nằm trong thư mục lưu trữ
    ten = sql("SELECT duong_dan_ban_mem FROM tai_lieu WHERE id = :t", t=tl)[0][0]
    assert (settings.thu_muc_ban_mem / ten).is_file()
    # khách đọc nội bộ -> 401, không ghi lượt đọc
    truoc = dem_luot_doc(tl)
    assert khach.get(f"/api/tai-lieu/{tl}/ban-mem").status_code == 401
    assert dem_luot_doc(tl) == truoc
    # người đăng nhập đọc được, ghi luot_doc có nguoi_dung_id
    res = sv.get(f"/api/tai-lieu/{tl}/ban-mem")
    assert res.status_code == 200 and res.headers["content-type"] == "application/pdf" and res.content[:4] == b"%PDF"
    assert dem_luot_doc(tl) == truoc + 1
    ghi = sql("SELECT nguoi_dung_id, du_lieu_mau FROM luot_doc WHERE tai_lieu_id = :t ORDER BY id DESC LIMIT 1", t=tl)[0]
    assert ghi.nguoi_dung_id is not None and ghi.du_lieu_mau is False
    # chuyển sang công khai: khách đọc được, ghi luot_doc với nguoi_dung_id NULL
    thuthu.post(f"/api/quan-ly/tai-lieu/{tl}/ban-mem", files=tep_pdf(), data={"muc_truy_cap": "cong_khai"})
    res = khach.get(f"/api/tai-lieu/{tl}/ban-mem")
    assert res.status_code == 200 and res.content[:4] == b"%PDF"
    assert dem_luot_doc(tl) == truoc + 2
    ghi = sql("SELECT nguoi_dung_id, ma_phien FROM luot_doc WHERE tai_lieu_id = :t ORDER BY id DESC LIMIT 1", t=tl)[0]
    assert ghi.nguoi_dung_id is None and ghi.ma_phien
    # chi tiết hiện đã số hóa
    assert khach.get(f"/api/tai-lieu/{tl}").json()["muc_truy_cap"] == "cong_khai"


def test_upload_don_tep_cu(thuthu, du_lieu_test):
    tl = du_lieu_test["id"]["ban_mem"]
    thuthu.post(f"/api/quan-ly/tai-lieu/{tl}/ban-mem", files=tep_pdf())
    cu = sql("SELECT duong_dan_ban_mem FROM tai_lieu WHERE id = :t", t=tl)[0][0]
    assert (settings.thu_muc_ban_mem / cu).is_file()
    time.sleep(0.01)
    thuthu.post(f"/api/quan-ly/tai-lieu/{tl}/ban-mem", files=tep_pdf())
    moi = sql("SELECT duong_dan_ban_mem FROM tai_lieu WHERE id = :t", t=tl)[0][0]
    assert moi != cu and (settings.thu_muc_ban_mem / moi).is_file()
    assert not (settings.thu_muc_ban_mem / cu).exists()


def test_upload_chan_tep_khong_hop_le(thuthu, du_lieu_test):
    tl = du_lieu_test["id"]["ban_mem"]
    url = f"/api/quan-ly/tai-lieu/{tl}/ban-mem"
    # đuôi không phải .pdf dù khai Content-Type PDF
    assert thuthu.post(url, files=tep_pdf(ten="virus.exe")).status_code == 400
    assert thuthu.post(url, files=tep_pdf(ten="a.txt")).status_code == 400
    # Content-Type sai
    assert thuthu.post(url, files=tep_pdf(loai="text/plain")).status_code == 400
    # thiếu magic %PDF
    assert thuthu.post(url, files=tep_pdf(noi_dung=b"Day khong phai PDF")).status_code == 400
    # quá 20MB
    lon = b"%PDF-" + b"0" * (20 * 1024 * 1024)
    assert thuthu.post(url, files=tep_pdf(noi_dung=lon)).status_code == 400
    # thiếu tệp, mức truy cập sai, tư liệu không có
    assert thuthu.post(url).status_code == 400
    assert thuthu.post(url, files=tep_pdf(), data={"muc_truy_cap": "bi_mat"}).status_code == 400
    assert thuthu.post("/api/quan-ly/tai-lieu/99999999/ban-mem", files=tep_pdf()).status_code == 404


def test_chong_path_traversal(khach, du_lieu_test):
    tl = du_lieu_test["id"]["ban_mem"]
    thu_muc = settings.thu_muc_ban_mem
    for dd in ["../../.env", "..\\..\\..\\.env", "mau/../../../../.env", "/etc/passwd", "C:\\Windows\\win.ini",
               "../ban_mem_ngoai.pdf"]:
        sql("UPDATE tai_lieu SET co_ban_mem = true, muc_truy_cap = 'cong_khai', duong_dan_ban_mem = :d WHERE id = :t",
            d=dd, t=tl)
        res = khach.get(f"/api/tai-lieu/{tl}/ban-mem")
        assert res.status_code in (403, 404), (dd, res.status_code)
        assert b"JWT_SECRET" not in res.content
    # tệp tồn tại nhưng nằm ngoài thư mục bản mềm bị chặn
    ngoai = thu_muc.parent / "ngoai_thu_muc.pdf"
    ngoai.write_bytes(PDF_NHO)
    try:
        sql("UPDATE tai_lieu SET duong_dan_ban_mem = '../ngoai_thu_muc.pdf' WHERE id = :t", t=tl)
        assert khach.get(f"/api/tai-lieu/{tl}/ban-mem").status_code == 403
    finally:
        ngoai.unlink()
    sql("UPDATE tai_lieu SET co_ban_mem = false, muc_truy_cap = NULL, duong_dan_ban_mem = NULL WHERE id = :t", t=tl)


def test_doc_ban_mem_mau_cua_seed(khach):
    """Tư liệu số hóa sẵn của dữ liệu mô phỏng (công khai) đọc được từ mau/ban_mem_mau.pdf."""
    r = sql("SELECT id FROM tai_lieu WHERE duong_dan_ban_mem = 'mau/ban_mem_mau.pdf' AND muc_truy_cap = 'cong_khai' "
            "ORDER BY id LIMIT 1")
    assert r, "chưa có dữ liệu seed"
    tl = r[0][0]
    truoc = dem_luot_doc(tl)
    try:
        res = khach.get(f"/api/tai-lieu/{tl}/ban-mem")
        assert res.status_code == 200 and res.content[:4] == b"%PDF"
    finally:
        sql("DELETE FROM luot_doc WHERE tai_lieu_id = :t AND NOT du_lieu_mau", t=tl)
    assert dem_luot_doc(tl) == truoc


# ---------------------------------------------------------------- Thủ thư: tư liệu, mã vấn đề
def test_quan_ly_tai_lieu_khong_ghi_log(thuthu):
    truoc = sql("SELECT count(*) FROM log_tim_kiem")[0][0]
    d = thuthu.get("/api/quan-ly/tai-lieu", params={"q": "luu tru", "kich_thuoc": 5}).json()
    assert d["tong_so"] > 0 and len(d["du_lieu"]) == 5 and "log_id" not in d
    d2 = thuthu.get("/api/quan-ly/tai-lieu", params={"q": "LA.01"}).json()
    assert d2["du_lieu"][0]["ky_hieu"] == "LA.01"
    d3 = thuthu.get("/api/quan-ly/tai-lieu").json()
    assert d3["tong_so"] >= 3000
    assert sql("SELECT count(*) FROM log_tim_kiem")[0][0] == truoc


def test_ma_van_de(thuthu, sv):
    ds = thuthu.get("/api/quan-ly/ma-van-de").json()
    assert len(ds) >= 29 and set(ds[0]) == {"ma", "ten", "so_tai_lieu"}
    ma = ds[0]["ma"]
    ten_cu = ds[0]["ten"]
    try:
        res = thuthu.put("/api/quan-ly/ma-van-de", json={"ma": ma, "ten": "Tên thử nghiệm"})
        assert res.status_code == 200 and res.json()["ten"] == "Tên thử nghiệm"
        assert {x["ma"]: x["ten"] for x in thuthu.get("/api/quan-ly/ma-van-de").json()}[ma] == "Tên thử nghiệm"
        assert thuthu.put("/api/quan-ly/ma-van-de", json={"ma": ma, "ten": "  "}).json()["ten"] is None
    finally:
        sql("UPDATE ma_van_de SET ten = :t WHERE ma = :m", t=ten_cu, m=ma)
    assert thuthu.put("/api/quan-ly/ma-van-de", json={"ma": "KHONG_CO", "ten": "x"}).status_code == 404
    assert sv.put("/api/quan-ly/ma-van-de", json={"ma": ma, "ten": "x"}).status_code == 403


# ---------------------------------------------------------------- Thống kê
def test_thong_ke_thu_thu_truy_cap_day_du(thuthu):
    for duong_dan in TAT_CA_THONG_KE:
        res = thuthu.get(f"/api/thong-ke/{duong_dan}")
        assert res.status_code == 200, duong_dan
        assert "nguoi_dung_id" not in res.text and "ma_phien" not in res.text  # chỉ số tổng hợp


def test_thong_ke_tong_quan(thuthu):
    d = thuthu.get("/api/thong-ke/tong-quan").json()
    assert set(d) == {"tong_luot_tim", "ti_le_khong_ket_qua", "luot_muon_mo", "qua_han", "da_so_hoa",
                      "tong_tai_lieu", "luot_doc", "so_sanh_ky_truoc"}
    assert set(d["so_sanh_ky_truoc"]) == {"tong_luot_tim", "ti_le_khong_ket_qua", "luot_doc"}
    assert d["tong_luot_tim"] >= 7000 and 0 < d["ti_le_khong_ket_qua"] < 100
    assert d["tong_tai_lieu"] >= 3400 and d["da_so_hoa"] >= 40 and d["luot_doc"] >= 1300
    sql_mo = sql("SELECT count(*) FROM luot_muon WHERE trang_thai IN ('cho_duyet', 'dang_muon')")[0][0]
    assert d["luot_muon_mo"] == sql_mo
    sql_qh = sql("SELECT count(*) FROM luot_muon WHERE trang_thai = 'dang_muon' AND han_tra < CURRENT_DATE")[0][0]
    assert d["qua_han"] == sql_qh


def test_thong_ke_so_sanh_ky_truoc(thuthu):
    """Kỳ trước = khoảng liền trước, cùng độ dài; kiểm tra với SQL."""
    hom_nay = datetime.date.today()
    tu, den = hom_nay - datetime.timedelta(days=13), hom_nay - datetime.timedelta(days=7)  # 7 ngày
    d = thuthu.get("/api/thong-ke/tong-quan", params={"tu_ngay": tu.isoformat(), "den_ngay": den.isoformat()}).json()
    truoc_den = tu - datetime.timedelta(days=1)
    truoc_tu = truoc_den - datetime.timedelta(days=6)
    n = sql("SELECT count(*) FROM log_tim_kiem WHERE thoi_diem::date BETWEEN :a AND :b", a=tu, b=den)[0][0]
    m = sql("SELECT count(*) FROM log_tim_kiem WHERE thoi_diem::date BETWEEN :a AND :b", a=truoc_tu, b=truoc_den)[0][0]
    assert d["tong_luot_tim"] == n and d["so_sanh_ky_truoc"]["tong_luot_tim"] == m and n > 0 and m > 0


def test_thong_ke_theo_ngay_du_ngay_va_bo_loc(thuthu):
    d = thuthu.get("/api/thong-ke/theo-ngay").json()
    assert len(d) == 90 and d[-1]["ngay"] == datetime.date.today().isoformat() and d[-1]["dang_cap_nhat"] is True
    assert not any(x["dang_cap_nhat"] for x in d[:-1])
    assert set(d[0]) == {"ngay", "so_luot", "so_luot_khong_kq", "dang_cap_nhat"}
    tong = sql("SELECT count(*) FROM log_tim_kiem WHERE thoi_diem::date >= CURRENT_DATE - 89")[0][0]
    assert sum(x["so_luot"] for x in d) == tong
    # bộ lọc 7 ngày: đủ 7 mục
    hom_nay = datetime.date.today()
    d7 = thuthu.get("/api/thong-ke/theo-ngay", params={
        "tu_ngay": (hom_nay - datetime.timedelta(days=6)).isoformat(), "den_ngay": hom_nay.isoformat()}).json()
    assert len(d7) == 7
    # ngày không có dữ liệu = 0 (khoảng tương lai)
    xa = hom_nay + datetime.timedelta(days=30)
    d0 = thuthu.get("/api/thong-ke/theo-ngay", params={"tu_ngay": xa.isoformat(), "den_ngay": xa.isoformat()}).json()
    assert d0 == [{"ngay": xa.isoformat(), "so_luot": 0, "so_luot_khong_kq": 0, "dang_cap_nhat": False}]
    # khoảng ngày không hợp lệ
    assert thuthu.get("/api/thong-ke/theo-ngay", params={"tu_ngay": "2026-12-01", "den_ngay": "2026-11-01"}).status_code == 400
    assert thuthu.get("/api/thong-ke/theo-ngay", params={"tu_ngay": "2020-01-01"}).status_code == 400
    assert thuthu.get("/api/thong-ke/theo-ngay", params={"tu_ngay": "khong-phai-ngay"}).status_code == 400


def test_thong_ke_loc_tu_khoa(thuthu):
    tk = thuthu.get("/api/thong-ke/tu-khoa", params={"gioi_han": 5}).json()
    assert len(tk) == 5 and set(tk[0]) == {"tu_khoa", "hien_thi", "so_lan", "so_lan_khong_kq"}
    assert [x["so_lan"] for x in tk] == sorted((x["so_lan"] for x in tk), reverse=True)
    top = tk[0]
    assert top["tu_khoa"] == "luu tru" and top["hien_thi"] == "lưu trữ"
    # lọc theo cụm đã chuẩn hóa: chỉ còn đúng cụm đó, mọi API khác đổi theo
    loc = {"tu_khoa": "Lưu  Trữ"}  # nhập có dấu, hoa, thừa khoảng trắng vẫn khớp cụm chuẩn
    t = thuthu.get("/api/thong-ke/tu-khoa", params=loc).json()
    assert [x["tu_khoa"] for x in t] == ["luu tru"] and t[0]["so_lan"] == top["so_lan"]
    q = thuthu.get("/api/thong-ke/tong-quan", params=loc).json()
    assert q["tong_luot_tim"] == top["so_lan"]
    n = thuthu.get("/api/thong-ke/theo-ngay", params=loc).json()
    assert sum(x["so_luot"] for x in n) == top["so_lan"]
    sql_chon = sql("SELECT count(*) FROM log_tim_kiem WHERE tu_khoa_chuan = 'luu tru' AND tai_lieu_chon_id IS NOT NULL "
                   "AND thoi_diem::date >= CURRENT_DATE - 89")[0][0]
    ns = thuthu.get("/api/thong-ke/nen-so-hoa", params={**loc, "gioi_han": 200}).json()
    assert sum(x["so_lan_chon"] for x in ns) == sql_chon
    # từ khóa không tồn tại -> rỗng / 0
    z = {"tu_khoa": "khong-ton-tai-xyz"}
    assert thuthu.get("/api/thong-ke/tu-khoa", params=z).json() == []
    assert thuthu.get("/api/thong-ke/tong-quan", params=z).json()["tong_luot_tim"] == 0


def test_thong_ke_loc_loai(thuthu):
    ds = thuthu.get("/api/thong-ke/theo-loai-hinh").json()
    assert len(ds) == 8 and set(ds[0]) == {"loai_hinh", "so_tai_lieu", "so_luot_chon", "so_luot_muon", "da_so_hoa"}
    loai = ds[0]["loai_hinh"]
    # theo-loai-hinh bỏ qua tham số loai (để biểu đồ vẫn hiện đủ các cột)
    assert thuthu.get("/api/thong-ke/theo-loai-hinh", params={"loai": loai}).json() == ds
    tl_loai = sql("SELECT count(*) FROM tai_lieu WHERE loai_hinh = :l", l=loai)[0][0]
    q = thuthu.get("/api/thong-ke/tong-quan", params={"loai": loai}).json()
    assert q["tong_tai_lieu"] == tl_loai == ds[0]["so_tai_lieu"]
    chon = sql("""SELECT count(*) FROM log_tim_kiem l JOIN tai_lieu t ON t.id = l.tai_lieu_chon_id
                  WHERE t.loai_hinh = :l AND l.thoi_diem::date >= CURRENT_DATE - 89""", l=loai)[0][0]
    assert q["tong_luot_tim"] == chon == ds[0]["so_luot_chon"]
    # nên số hóa: chỉ tư liệu thuộc loại
    ns = thuthu.get("/api/thong-ke/nen-so-hoa", params={"loai": loai}).json()
    assert ns and all(x["tai_lieu"]["loai_hinh"] == loai for x in ns)
    # luot-doc theo loại
    ld = thuthu.get("/api/thong-ke/luot-doc", params={"loai": loai}).json()
    assert all(x["tai_lieu"]["loai_hinh"] == loai for x in ld["top"])


def test_thong_ke_nen_so_hoa(thuthu):
    d = thuthu.get("/api/thong-ke/nen-so-hoa", params={"gioi_han": 20}).json()
    assert len(d) == 20 and set(d[0]) == {
        "tai_lieu", "so_lan_chon", "so_luot_muon", "diem_lan_toa", "diem", "lan_toa_tu",
    }
    diem = [x["diem"] for x in d]
    assert diem == sorted(diem, reverse=True)
    for x in d:
        # chặng 5: diem có thêm diem_lan_toa (1 chữ số thập phân)
        assert x["diem"] == pytest.approx(round(x["so_lan_chon"] + 2 * x["so_luot_muon"] + x["diem_lan_toa"], 1),
                                          abs=0.11)
        assert x["tai_lieu"]["co_ban_mem"] is False and x["tai_lieu"]["khong_co_tl"] is False
    # phần chọn + mượn vẫn khớp view v1 (view không có lan tỏa)
    v = dict(sql("SELECT tai_lieu_id, diem FROM v_nen_so_hoa"))
    for x in d:
        assert x["so_lan_chon"] + 2 * x["so_luot_muon"] == v.get(x["tai_lieu"]["id"], 0)


def test_thong_ke_khong_ket_qua_va_luot_doc(thuthu):
    kk = thuthu.get("/api/thong-ke/khong-ket-qua", params={"gioi_han": 10}).json()
    assert 0 < len(kk) <= 10 and set(kk[0]) == {"tu_khoa", "hien_thi", "so_lan", "lan_cuoi"}
    assert [x["so_lan"] for x in kk] == sorted((x["so_lan"] for x in kk), reverse=True)
    ld = thuthu.get("/api/thong-ke/luot-doc", params={"gioi_han": 5}).json()
    assert set(ld) == {"top", "theo_ngay"} and len(ld["top"]) == 5 and len(ld["theo_ngay"]) == 90
    assert set(ld["top"][0]) == {"tai_lieu", "so_luot_doc"}
    assert sum(x["so_luot"] for x in ld["theo_ngay"]) == thuthu.get("/api/thong-ke/tong-quan").json()["luot_doc"]
    assert [x["so_luot_doc"] for x in ld["top"]] == sorted((x["so_luot_doc"] for x in ld["top"]), reverse=True)
