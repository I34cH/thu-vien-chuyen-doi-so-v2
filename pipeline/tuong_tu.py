"""
Tư liệu tương tự (TF-IDF + cosine) và chủ đề (KMeans trên TF-IDF) — chặng 4.

- Văn bản của một tư liệu = tiêu đề đã tách từ bằng pyvi (từ ghép nối '_', bỏ từ chung chung như "nghiên_cứu",
  "thực_trạng") + một token mã vấn đề (ví dụ "mvd_qtvp") nếu có.
- TF-IDF: sublinear_tf, min_df = 2, chuẩn L2 -> cosine = tích vô hướng.
- tai_lieu_tuong_tu: tối đa 10 tư liệu giống nhất cho mỗi tư liệu, điểm >= NGUONG_DIEM.
- chu_de: KMeans (k chọn trong 8–12 theo silhouette cosine trên mẫu) trên TF-IDF đã giảm chiều bằng TruncatedSVD;
  nhãn = 2–3 từ nổi bật nhất của tâm cụm (TF-IDF trung bình), viết có dấu, bỏ token mã vấn đề; cụm kém tập trung
  nhận nhãn "Tổng hợp (nhiều chủ đề)" (tiêu chí ở NGUONG_SILHOUETTE / NGUONG_PHU_3). Nhãn thủ thư sửa tay
  (bảng chu_de_nhan_tay) được áp lại cho cụm khớp chữ ký sau mỗi lần gom (ap_nhan_tay).
- Ghi outputs/reports/chu_de.md và outputs/reports/tuong_tu_tom_tat.md.

Chạy độc lập (sau ETL; tự tách từ lại nếu không được truyền sẵn): backend/.venv/Scripts/python -m pipeline.tuong_tu
"""
import time
from collections import Counter

import numpy as np

from pipeline.chung import THU_MUC_BAO_CAO, engine
from pipeline.tach_tu import TU_DUNG_TFIDF, tach_tieu_de

SO_TUONG_TU = 10
NGUONG_DIEM = 0.2
K_UNG_VIEN = range(8, 13)
SEED = 42
# Cụm kém tập trung -> nhãn "Tổng hợp (nhiều chủ đề)" thay vì ghép từ nổi bật (vốn rời rạc, gây hiểu nhầm).
# Tiêu chí (một trong hai): silhouette cosine trung bình của cụm < 0 (tư liệu trung bình gần cụm khác hơn cụm mình),
# hoặc < 50% tư liệu của cụm chứa ít nhất một trong 3 từ nổi bật nhất (từ nổi bật không đại diện cho cụm).
# Trên kho hiện tại chỉ cụm 903 tư liệu ("hà nội, văn hóa, tổ chức") rơi vào: silhouette -0,055, phủ 19%; các cụm
# khác silhouette >= 0,03 và phủ >= 91%.
NHAN_TONG_HOP = "Tổng hợp (nhiều chủ đề)"
NGUONG_SILHOUETTE = 0.0
NGUONG_PHU_3 = 0.5
NGUONG_JACCARD = 0.5  # khớp gần đúng nhãn tay với cụm mới


def van_ban(tu_list: list[str], ma_van_de: str | None) -> str:
    tu = [t for t in tu_list if t not in TU_DUNG_TFIDF and not t.replace("_", "").isdigit() and len(t) > 1]
    if ma_van_de:
        tu.append("mvd_" + ma_van_de.lower())
    return " ".join(tu)


def tinh_tuong_tu(x, ids: list[int]) -> list[tuple[int, int, float]]:
    """Top SO_TUONG_TU theo cosine (x đã chuẩn L2), theo khối để tiết kiệm bộ nhớ."""
    cap = []
    khoi = 500
    for bd in range(0, x.shape[0], khoi):
        s = (x[bd:bd + khoi] @ x.T).toarray()
        for i in range(s.shape[0]):
            s[i, bd + i] = 0.0  # bỏ chính nó
        top = np.argpartition(-s, SO_TUONG_TU, axis=1)[:, :SO_TUONG_TU]
        for i in range(s.shape[0]):
            for j in top[i]:
                d = float(s[i, j])
                if d >= NGUONG_DIEM:
                    cap.append((ids[bd + i], ids[j], round(d, 4)))
    return cap


def gom_chu_de(x, ten_tu: np.ndarray):
    """KMeans trên SVD(100) đã chuẩn hóa; trả (nhãn cụm cho từng tư liệu, k, bảng silhouette, danh sách chủ đề)."""
    from sklearn.cluster import KMeans
    from sklearn.decomposition import TruncatedSVD
    from sklearn.metrics import silhouette_samples, silhouette_score
    from sklearn.preprocessing import normalize

    z = normalize(TruncatedSVD(n_components=100, random_state=SEED).fit_transform(x))
    rng = np.random.default_rng(SEED)
    mau = rng.choice(z.shape[0], size=min(2000, z.shape[0]), replace=False)
    diem_k, mo_hinh = {}, {}
    for k in K_UNG_VIEN:
        km = KMeans(n_clusters=k, n_init=10, random_state=SEED).fit(z)
        diem_k[k] = float(silhouette_score(z[mau], km.labels_[mau], metric="cosine"))
        mo_hinh[k] = km
    k_tot = max(diem_k, key=diem_k.get)
    nhan = mo_hinh[k_tot].labels_
    # Silhouette từng tư liệu (toàn bộ, cosine) để đo độ tập trung của từng cụm
    sil = silhouette_samples(z, nhan, metric="cosine")

    chu_de = []
    da_dung = set()
    so_tong_hop = 0
    for c in range(k_tot):
        trong_cum = nhan == c
        tam = np.asarray(x[trong_cum].mean(axis=0)).ravel()
        thu_tu = [i for i in np.argsort(-tam) if not ten_tu[i].startswith("mvd_")]
        noi_bat = [ten_tu[i].replace("_", " ") for i in thu_tu[:8]]
        # Độ tập trung: silhouette trung bình của cụm và tỉ lệ tư liệu chứa ít nhất một trong 3 từ nổi bật nhất
        sil_tb = float(sil[trong_cum].mean())
        phu_3 = float((x[trong_cum][:, thu_tu[:3]].sum(axis=1) > 0).mean())
        tong_hop = sil_tb < NGUONG_SILHOUETTE or phu_3 < NGUONG_PHU_3
        if tong_hop:
            so_tong_hop += 1
            ten = NHAN_TONG_HOP if so_tong_hop == 1 else f"{NHAN_TONG_HOP} {so_tong_hop}"
        else:
            # Nhãn: 2–3 từ đầu, ưu tiên từ ghép; tránh trùng nhãn giữa các chủ đề
            chon = [t for t in noi_bat if " " in t][:3] or noi_bat[:3]
            if len(chon) < 2:
                chon = noi_bat[:3]
            ten = ", ".join(chon[:3])
            while ten in da_dung:
                chon = chon[1:] + noi_bat[len(chon):len(chon) + 1]
                ten = ", ".join(chon[:3])
        da_dung.add(ten)
        mvd = Counter(ten_tu[i][4:].upper() for i in np.argsort(-tam)[:15] if ten_tu[i].startswith("mvd_"))
        chu_de.append({"cum": c, "nhan": ten, "nhan_tu_dong": ten, "khoa": khoa_cum(noi_bat),
                       "tu_khoa_noi_bat": noi_bat, "so_tai_lieu": int(trong_cum.sum()), "ma_van_de": list(mvd),
                       "silhouette": sil_tb, "phu_3": phu_3, "tong_hop": tong_hop, "da_sua_tay": False})
    return nhan, k_tot, diem_k, chu_de


def khoa_cum(noi_bat: list[str]) -> str:
    """Chữ ký ổn định của cụm: 5 từ nổi bật đầu, sắp xếp, nối '|' (không phụ thuộc id hay thứ tự cụm của KMeans)."""
    return "|".join(sorted(noi_bat[:5]))


def jaccard(a, b) -> float:
    a, b = set(a), set(b)
    return len(a & b) / len(a | b) if a | b else 0.0


def ap_nhan_tay(cur, chu_de: list[dict]) -> list[str]:
    """Áp nhãn thủ thư đã sửa tay (bảng chu_de_nhan_tay) cho cụm khớp; trả danh sách dòng mô tả để in/báo cáo.

    Khớp: trùng chữ ký (khoa) trước; nếu không, cụm chưa có nhãn tay có Jaccard(từ nổi bật) >= NGUONG_JACCARD lớn
    nhất (cụm đổi nhẹ khi dữ liệu đổi) — khi đó cập nhật chữ ký đã lưu theo cụm mới. Nhãn tay không khớp cụm nào
    vẫn được giữ trong bảng (có thể khớp lại ở lần gom sau). Nhãn tự động trùng nhãn tay thì thêm hậu tố " (2)".
    """
    cur.execute("SELECT khoa, tu_khoa, nhan FROM chu_de_nhan_tay ORDER BY cap_nhat, khoa")
    nhan_tay = cur.fetchall()
    mo_ta = []
    theo_khoa = {cd["khoa"]: cd for cd in chu_de}
    con_lai = []
    for khoa, tu_khoa, nhan_moi in nhan_tay:
        cd = theo_khoa.get(khoa)
        if cd is not None and not cd["da_sua_tay"]:
            cd["nhan"], cd["da_sua_tay"] = nhan_moi, True
            mo_ta.append(f"'{nhan_moi}' -> cụm '{cd['nhan_tu_dong']}' (trùng chữ ký)")
        else:
            con_lai.append((khoa, tu_khoa, nhan_moi))
    for khoa, tu_khoa, nhan_moi in con_lai:
        ung_vien = [(jaccard(tu_khoa, cd["tu_khoa_noi_bat"]), cd) for cd in chu_de if not cd["da_sua_tay"]]
        diem, cd = max(ung_vien, key=lambda u: u[0], default=(0.0, None))
        if cd is None or diem < NGUONG_JACCARD:
            mo_ta.append(f"'{nhan_moi}' không khớp cụm nào (giữ lại trong chu_de_nhan_tay)")
            continue
        cd["nhan"], cd["da_sua_tay"] = nhan_moi, True
        cur.execute("SELECT 1 FROM chu_de_nhan_tay WHERE khoa = %s", (cd["khoa"],))
        if cur.fetchone() is None:
            cur.execute("UPDATE chu_de_nhan_tay SET khoa = %s, tu_khoa = %s WHERE khoa = %s",
                        (cd["khoa"], cd["tu_khoa_noi_bat"], khoa))
        mo_ta.append(f"'{nhan_moi}' -> cụm '{cd['nhan_tu_dong']}' (Jaccard {diem:.2f})")
    # Nhãn phải khác nhau (ThemeRiver phân biệt chuỗi theo nhãn): nhãn tay được ưu tiên
    da_dung = {cd["nhan"].lower() for cd in chu_de if cd["da_sua_tay"]}
    for cd in chu_de:
        if cd["da_sua_tay"]:
            continue
        ten, so = cd["nhan"], 2
        while ten.lower() in da_dung:
            ten, so = f"{cd['nhan']} ({so})", so + 1
        cd["nhan"] = ten
        da_dung.add(ten.lower())
    return mo_ta


def chay(tieu_de_tach: dict[int, list[str]] | None = None) -> dict:
    from sklearn.feature_extraction.text import TfidfVectorizer

    t0 = time.perf_counter()
    kn = engine.raw_connection()
    try:
        cur = kn.cursor()
        cur.execute("SELECT id, tieu_de, ma_van_de, loai_hinh FROM tai_lieu ORDER BY id")
        dong = cur.fetchall()
        ids = [r[0] for r in dong]
        if tieu_de_tach is None or set(tieu_de_tach) != set(ids):
            tieu_de_tach = dict(zip(ids, tach_tieu_de([r[1] for r in dong])))
        tai_lieu = [van_ban(tieu_de_tach[r[0]], r[2]) for r in dong]

        vec = TfidfVectorizer(token_pattern=r"\S+", lowercase=False, min_df=2, sublinear_tf=True)
        x = vec.fit_transform(tai_lieu)
        ten_tu = vec.get_feature_names_out()

        cap = tinh_tuong_tu(x, ids)
        cur.execute("TRUNCATE tai_lieu_tuong_tu")
        cur.executemany("INSERT INTO tai_lieu_tuong_tu (tai_lieu_id, tai_lieu_lien_quan_id, diem) VALUES (%s, %s, %s)",
                        cap)

        nhan, k_tot, diem_k, chu_de = gom_chu_de(x, ten_tu)
        nhan_tay = ap_nhan_tay(cur, chu_de)
        cur.execute("UPDATE tai_lieu SET chu_de_id = NULL")
        # Không TRUNCATE ... CASCADE: tai_lieu tham chiếu chu_de nên CASCADE sẽ xóa sạch tai_lieu
        cur.execute("DELETE FROM chu_de")
        cur.execute("ALTER SEQUENCE chu_de_id_seq RESTART WITH 1")
        id_chu_de = {}
        for cd in chu_de:
            cur.execute("INSERT INTO chu_de (nhan, tu_khoa_noi_bat, nhan_tu_dong, khoa, da_sua_tay) "
                        "VALUES (%s, %s, %s, %s, %s) RETURNING id",
                        (cd["nhan"], cd["tu_khoa_noi_bat"], cd["nhan_tu_dong"], cd["khoa"], cd["da_sua_tay"]))
            id_chu_de[cd["cum"]] = cur.fetchone()[0]
            cd["id"] = id_chu_de[cd["cum"]]
        cur.executemany("UPDATE tai_lieu SET chu_de_id = %s WHERE id = %s",
                        [(id_chu_de[int(c)], i) for i, c in zip(ids, nhan)])
        kn.commit()

        # ---- Báo cáo ----
        co_tuong_tu = len({a for a, _, _ in cap})
        diem = np.array([d for _, _, d in cap]) if cap else np.array([0.0])
        loai = {r[0]: r[3] for r in dong}
        theo_loai = Counter()
        for i, c in zip(ids, nhan):
            theo_loai[(int(c), loai[i])] += 1
        mau_tl = {}
        td = {r[0]: r[1] for r in dong}
        for i, c in zip(ids, nhan):
            mau_tl.setdefault(int(c), []).append(td[i])
    finally:
        kn.close()

    giay = time.perf_counter() - t0
    THU_MUC_BAO_CAO.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(SEED)
    d = ["# Chủ đề tư liệu (KMeans trên TF-IDF tiêu đề đã tách từ)", "",
         f"- Số từ vựng TF-IDF (min_df = 2): **{len(ten_tu)}**; số tư liệu: **{len(ids)}**.",
         f"- k chọn theo silhouette (cosine, mẫu 2.000 tư liệu, trên SVD 100 chiều): "
         + ", ".join(f"k={k}: {v:.3f}" for k, v in diem_k.items()) + f" → **k = {k_tot}**.",
         "- Silhouette thấp là bình thường với tiêu đề ngắn: chủ đề chồng lấn nhau, coi là nhóm thô cho ThemeRiver.",
         "- Nhãn tự động = 2–3 từ ghép nổi bật nhất của tâm cụm. Cụm kém tập trung (silhouette trung bình < "
         f"{NGUONG_SILHOUETTE:g} hoặc < {NGUONG_PHU_3:.0%} tư liệu chứa một trong 3 từ nổi bật đầu) nhận nhãn "
         f"\"{NHAN_TONG_HOP}\".",
         "- Nhãn thủ thư sửa tay (Quản lý › Chủ đề) lưu ở `chu_de_nhan_tay` theo chữ ký cụm (5 từ nổi bật đầu đã sắp "
         "xếp) và được áp lại sau mỗi lần gom cụm. Lần này: " + ("; ".join(nhan_tay) or "không có nhãn tay") + ".", "",
         "| id | Nhãn | Nhãn tự động | Số tư liệu | Silhouette TB | Phủ 3 từ đầu | Từ nổi bật | Mã vấn đề nổi bật "
         "| Loại hình chính |", "|---:|---|---|---:|---:|---:|---|---|---|"]
    for cd in sorted(chu_de, key=lambda c: -c["so_tai_lieu"]):
        lh = sorted(((n, l) for (c, l), n in theo_loai.items() if c == cd["cum"]), reverse=True)[:2]
        d.append(f"| {cd['id']} | {cd['nhan']}{' (sửa tay)' if cd['da_sua_tay'] else ''} | {cd['nhan_tu_dong']} | "
                 f"{cd['so_tai_lieu']} | {cd['silhouette']:.3f} | {cd['phu_3']:.0%} | "
                 f"{', '.join(cd['tu_khoa_noi_bat'])} | "
                 f"{', '.join(cd['ma_van_de']) or '—'} | {', '.join(f'{l} ({n})' for n, l in lh)} |")
    d += ["", "## Ví dụ tiêu đề mỗi chủ đề (ngẫu nhiên, seed 42)", ""]
    for cd in sorted(chu_de, key=lambda c: -c["so_tai_lieu"]):
        ds = mau_tl[cd["cum"]]
        d.append(f"### {cd['id']}. {cd['nhan']}")
        for j in rng.choice(len(ds), size=min(4, len(ds)), replace=False):
            d.append(f"- {ds[j]}")
        d.append("")
    (THU_MUC_BAO_CAO / "chu_de.md").write_text("\n".join(d), encoding="utf-8")

    tom_tat = {"so_cap_tuong_tu": len(cap), "so_tl_co_tuong_tu": co_tuong_tu, "so_tu_vung": len(ten_tu),
               "so_chu_de": k_tot, "giay": round(giay, 1),
               "diem_trung_vi": round(float(np.median(diem)), 3)}
    print(f"tai_lieu_tuong_tu: {len(cap)} cặp, {co_tuong_tu}/{len(ids)} tư liệu có >= 1 tư liệu tương tự "
          f"(ngưỡng {NGUONG_DIEM}), điểm trung vị {tom_tat['diem_trung_vi']}")
    print(f"chu_de: k = {k_tot} | " + " | ".join(f"{c['nhan']} ({c['so_tai_lieu']})"
                                                for c in sorted(chu_de, key=lambda c: -c['so_tai_lieu'])))
    print("Nhãn tay: " + ("; ".join(nhan_tay) or "không có"))
    print(f"TF-IDF + chủ đề: {giay:.1f} giây")
    return tom_tat


if __name__ == "__main__":
    chay()
