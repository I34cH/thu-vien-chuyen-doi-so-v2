"""
Bộ ca đánh giá tìm kiếm: chạy một bộ truy vấn cố định qua hàm SQL tim_tai_lieu (cùng hàm API và seed dùng),
chấm tự động theo tiêu chí ghi rõ cho từng truy vấn, ghi báo cáo vào outputs/reports/.

Chạy:
    backend/.venv/Scripts/python -m pipeline.danh_gia_tim_kiem --nhan truoc   # trước khi sửa
    backend/.venv/Scripts/python -m pipeline.danh_gia_tim_kiem                # sau khi sửa (+ bảng so sánh)
(Không truyền --nhan: ghi "truoc" nếu chưa có kết quả trước, ngược lại ghi "sau".)

Cách chấm (không gán nhãn tay):
- Mỗi truy vấn có danh sách CỤM BẮT BUỘC (đã bỏ dấu, chữ thường). Một tư liệu được coi là LIÊN QUAN khi chuỗi âm tiết
  của "tiêu đề + tác giả" (sau f_chuan_hoa, tách theo ký tự không phải chữ/số) chứa LIỀN từng cụm bắt buộc.
- Tập đúng G = mọi tư liệu liên quan trong kho (tính trên toàn bảng tai_lieu, không phụ thuộc hàm tìm kiếm).
- Nếu G rỗng (kho không có tư liệu chứa cụm): đạt khi hàm trả 0 kết quả.
- Nếu G khác rỗng: đạt khi có kết quả, 5 kết quả đầu đều liên quan, độ chính xác >= 0,9 và độ phủ >= 0,9.
- Với truy vấn gõ sai, cụm bắt buộc là cụm người dùng định gõ; "gợi ý sửa" đạt khi trùng cụm đó (sau bỏ dấu),
  còn với truy vấn gõ đúng hoặc từ không có trong kho thì gợi ý sửa phải rỗng.
Đây là tiêu chí xấp xỉ (chứa cụm = liên quan), đủ để phát hiện khớp nhầm kiểu "học máy" và mất kết quả khi gõ sai.
Từ migration 0004: thêm cột "KQ chính xác" = số kết quả của tim_tai_lieu_chinh_xac (API chinh_xac=1, không sửa lỗi);
với truy vấn gõ sai có sửa, đây là số tư liệu chứa nguyên văn cụm gõ sai (lối "Tìm chính xác …").
"""
import argparse
import json
import re
import time

from sqlalchemy import text

from pipeline.chung import THU_MUC_BAO_CAO, engine

# (nhóm, truy vấn, cụm bắt buộc, cụm định gõ khi là lỗi gõ hoặc None)
BO_CA = [
    ("gõ đúng", "lưu trữ", ["luu tru"], None),
    ("gõ đúng", "văn bản", ["van ban"], None),
    ("gõ đúng", "hồ sơ", ["ho so"], None),
    ("gõ đúng", "lịch sử", ["lich su"], None),
    ("gõ đúng", "thủ tục hành chính", ["thu tuc hanh chinh"], None),
    ("gõ đúng", "văn hóa doanh nghiệp", ["van hoa doanh nghiep"], None),
    ("gõ đúng", "bảo quản tài liệu", ["bao quan tai lieu"], None),
    ("gõ đúng", "Hồ Chí Minh", ["ho chi minh"], None),
    ("không dấu", "luu tru", ["luu tru"], None),
    ("không dấu", "van thu", ["van thu"], None),
    ("không dấu", "quan tri van phong", ["quan tri van phong"], None),
    ("không dấu", "cai cach hanh chinh", ["cai cach hanh chinh"], None),
    ("không dấu", "tai lieu anh", ["tai lieu anh"], None),
    ("gõ sai nhẹ", "lu tru", ["luu tru"], "luu tru"),
    ("gõ sai nhẹ", "luuu tru", ["luu tru"], "luu tru"),
    ("gõ sai nhẹ", "lưu trư", ["luu tru"], None),  # sai dấu: bỏ dấu là đúng, không cần gợi ý
    ("gõ sai nhẹ", "vn thư", ["van thu"], "van thu"),
    ("gõ sai nhẹ", "van phogn", ["van phong"], "van phong"),
    ("gõ sai nhẹ", "hành chín", ["hanh chinh"], "hanh chinh"),
    ("gõ sai nhẹ", "chinh ly tai leu", ["chinh ly tai lieu"], "chinh ly tai lieu"),
    ("gõ sai nhẹ", "cong tac van thuw", ["cong tac van thu"], "cong tac van thu"),
    # Bổ sung sau lần chạy "trước" (đổi chỗ hai ký tự, lỗi hay gặp trong log mô phỏng); bảng so sánh không có cột trước
    ("gõ sai nhẹ", "luu tur", ["luu tru"], "luu tru"),
    ("gõ sai nhẹ", "lich us", ["lich su"], "lich su"),
    ("gõ sai nhẹ", "con gty", ["cong ty"], "cong ty"),
    ("không có trong kho", "học máy", ["hoc may"], None),
    ("không có trong kho", "hoc may", ["hoc may"], None),
    ("không có trong kho", "python", ["python"], None),
    ("không có trong kho", "trí tuệ nhân tạo", ["tri tue nhan tao"], None),
    ("không có trong kho", "machine learning", ["machine learning"], None),
    ("không có trong kho", "dữ liệu lớn", ["du lieu lon"], None),
    ("không có trong kho", "học sâu", ["hoc sau"], None),
    ("không có trong kho", "blockchain", ["blockchain"], None),
    ("không có trong kho", "an ninh mạng", ["an ninh mang"], None),
    ("không có trong kho", "mạng nơ ron", ["mang no ron"], None),
    ("nhiều âm tiết", "công tác văn thư lưu trữ", ["cong tac van thu luu tru"], None),
    ("nhiều âm tiết", "tài liệu lưu trữ", ["tai lieu luu tru"], None),
    ("nhiều âm tiết", "chỉnh lý tài liệu", ["chinh ly tai lieu"], None),
    ("nhiều âm tiết", "bộ máy hành chính", ["bo may hanh chinh"], None),
    ("nhiều âm tiết", "ủy ban nhân dân", ["uy ban nhan dan"], None),
    # Đảo thứ tự hai từ ghép. Migration 0004 (quyết định của người dùng) bỏ tầng "khớp đủ các từ ghép": CHỦ ĐÍCH chỉ
    # khớp cụm liền, nên "hồ sơ lưu trữ" KHÔNG còn khớp "lưu trữ hồ sơ" (và ngược lại). Kỳ vọng mới: liên quan khi
    # chứa liền đúng cụm đã gõ (trước 0004 tiêu chí là chứa cả hai từ ghép ở bất kỳ đâu).
    ("nhiều âm tiết", "lưu trữ hồ sơ", ["luu tru ho so"], None),
    ("nhiều âm tiết", "hồ sơ lưu trữ", ["ho so luu tru"], None),
]


def am_tiet(s: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", s)


def chua_lien(tu: list[str], cum: list[str]) -> bool:
    n = len(cum)
    return any(tu[i:i + n] == cum for i in range(len(tu) - n + 1))


def cham(nhan: str) -> list[dict]:
    with engine.connect() as kn:
        # Văn bản đã chuẩn hóa của toàn kho (dùng đúng f_chuan_hoa của CSDL)
        kho = {
            r.id: (r.tieu_de, am_tiet(r.chuan))
            for r in kn.execute(text(
                "SELECT id, tieu_de, f_chuan_hoa(coalesce(tieu_de, '') || ' ' || coalesce(tac_gia, '')) AS chuan "
                "FROM tai_lieu WHERE sheet_goc <> 'TEST'"
            ))
        }
        co_ham_sua = kn.execute(text("SELECT to_regprocedure('goi_y_sua_cum(text)') IS NOT NULL")).scalar_one()
        co_chinh_xac = kn.execute(
            text("SELECT to_regprocedure('tim_tai_lieu_chinh_xac(text)') IS NOT NULL")).scalar_one()
        ket_qua = []
        for nhom, q, cum_bat_buoc, dinh_go in BO_CA:
            cum = [c.split() for c in cum_bat_buoc]
            g = {i for i, (_, tu) in kho.items() if all(chua_lien(tu, c) for c in cum)}
            t0 = time.perf_counter()
            ids = [r[0] for r in kn.execute(
                text("SELECT tai_lieu_id FROM tim_tai_lieu(:q) ORDER BY diem DESC, tai_lieu_id"), {"q": q})]
            ms = (time.perf_counter() - t0) * 1000
            goi_y = kn.execute(text("SELECT goi_y_sua_cum(:q)"), {"q": q}).scalar_one() if co_ham_sua else None
            so_kq_cx = kn.execute(text("SELECT count(*) FROM tim_tai_lieu_chinh_xac(:q) s JOIN tai_lieu t "
                                       "ON t.id = s.tai_lieu_id WHERE t.sheet_goc <> 'TEST'"),
                                  {"q": q}).scalar_one() if co_chinh_xac else None
            goi_y_chuan = kn.execute(text("SELECT f_chuan_hoa(:g)"), {"g": goi_y}).scalar_one() if goi_y else None
            ids = [i for i in ids if i in kho]
            n = len(ids)
            dung = [i for i in ids if i in g]
            top5 = ids[:5]
            p5 = (sum(i in g for i in top5) / len(top5)) if top5 else None
            chinh_xac = len(dung) / n if n else None
            do_phu = len(dung) / len(g) if g else None
            if g:
                dat = n > 0 and p5 == 1 and chinh_xac >= 0.9 and do_phu >= 0.9
            else:
                dat = n == 0
            if co_ham_sua:
                dat_goi_y = (goi_y_chuan == dinh_go) if dinh_go else (goi_y is None)
            else:
                dat_goi_y = None
            ket_qua.append({
                "nhom": nhom, "q": q, "cum_bat_buoc": cum_bat_buoc, "dinh_go": dinh_go,
                "so_dung_trong_kho": len(g), "so_ket_qua": n, "p_at_5": p5, "chinh_xac": chinh_xac,
                "do_phu": do_phu, "dat": dat, "goi_y_sua": goi_y, "so_kq_chinh_xac": so_kq_cx, "dat_goi_y": dat_goi_y, "ms": round(ms, 1),
                "top5": [{"tieu_de": kho[i][0], "lien_quan": i in g} for i in top5],
            })
    return ket_qua


def so(x, k=2):
    return "—" if x is None else f"{x:.{k}f}".replace(".", ",")


def tieu_chi(r) -> str:
    cum = " + ".join(f"'{c}'" for c in r["cum_bat_buoc"])
    if r["so_dung_trong_kho"] == 0:
        return f"kho không có tư liệu chứa {cum} → phải 0 kết quả"
    return f"chứa liền {cum} (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9"


def ghi_bao_cao(nhan: str, ket_qua: list[dict]) -> None:
    THU_MUC_BAO_CAO.mkdir(parents=True, exist_ok=True)
    (THU_MUC_BAO_CAO / f"danh_gia_tim_kiem_{nhan}.json").write_text(
        json.dumps(ket_qua, ensure_ascii=False, indent=1), encoding="utf-8")
    so_dat = sum(r["dat"] for r in ket_qua)
    co_goi_y = [r for r in ket_qua if r["dat_goi_y"] is not None]
    dong = [f"# Đánh giá tìm kiếm — {nhan.upper()}", "",
            "Sinh bởi `python -m pipeline.danh_gia_tim_kiem`. Cách chấm: xem docstring của script "
            "(liên quan = tiêu đề + tác giả chứa liền cụm bắt buộc sau khi bỏ dấu; G = số tư liệu liên quan trong kho).",
            "", f"**Đạt {so_dat}/{len(ket_qua)} truy vấn.**"
            + (f" Gợi ý sửa đúng {sum(r['dat_goi_y'] for r in co_goi_y)}/{len(co_goi_y)}." if co_goi_y else
               " (Chưa có hàm gợi ý sửa.)"), "",
            "| Nhóm | Truy vấn | Tiêu chí | G | Số KQ | P@5 | Chính xác | Phủ | Gợi ý sửa | KQ chính xác | ms | Đạt |",
            "|---|---|---|---:|---:|---:|---:|---:|---|---:|---:|:---:|"]
    for r in ket_qua:
        gy = r["goi_y_sua"] or "—"
        if r["dat_goi_y"] is False:
            gy += " ✗"
        dong.append(f"| {r['nhom']} | {r['q']} | {tieu_chi(r)} | {r['so_dung_trong_kho']} | {r['so_ket_qua']} | "
                    f"{so(r['p_at_5'])} | {so(r['chinh_xac'])} | {so(r['do_phu'])} | {gy} | "
                    f"{'—' if r.get('so_kq_chinh_xac') is None else r['so_kq_chinh_xac']} | {so(r['ms'], 1)} | "
                    f"{'✓' if r['dat'] else '✗'} |")
    dong += ["", "## 5 kết quả đầu", "", "(✓ = liên quan theo tiêu chí, ✗ = không chứa cụm bắt buộc)", ""]
    for r in ket_qua:
        dong.append(f"### `{r['q']}` — {r['so_ket_qua']} kết quả")
        if not r["top5"]:
            dong.append("- (không có)")
        for x in r["top5"]:
            dong.append(f"- {'✓' if x['lien_quan'] else '✗'} {x['tieu_de']}")
        dong.append("")
    (THU_MUC_BAO_CAO / f"danh_gia_tim_kiem_{nhan}.md").write_text("\n".join(dong), encoding="utf-8")


def ghi_so_sanh() -> None:
    tep_truoc = THU_MUC_BAO_CAO / "danh_gia_tim_kiem_truoc.json"
    tep_sau = THU_MUC_BAO_CAO / "danh_gia_tim_kiem_sau.json"
    if not (tep_truoc.exists() and tep_sau.exists()):
        return
    truoc = {r["q"]: r for r in json.loads(tep_truoc.read_text(encoding="utf-8"))}
    sau = json.loads(tep_sau.read_text(encoding="utf-8"))
    chung = [r for r in sau if r["q"] in truoc]
    dat_t = sum(truoc[r["q"]]["dat"] for r in chung)
    dat_s = sum(r["dat"] for r in chung)
    dong = ["# So sánh tìm kiếm trước (hàm 0002) / sau (hàm hiện hành, 0004: khớp cụm liền + sửa lỗi gõ)", "",
            "Ca \"lưu trữ hồ sơ\" / \"hồ sơ lưu trữ\" đổi tiêu chí ở 0004 (chứa liền đúng cụm, không khớp đảo thứ "
            "tự — chủ đích), nên G và cột \"trước\" của hai ca này tính theo tiêu chí khác nhau.", "",
            f"Đạt trên {len(chung)} truy vấn có ở cả hai lần chạy: **{dat_t}/{len(chung)} → {dat_s}/{len(chung)}**. "
            f"Lần chạy sau có thêm {len(sau) - len(chung)} truy vấn bổ sung; tổng lần sau: "
            f"{sum(r['dat'] for r in sau)}/{len(sau)}.", "",
            "| Nhóm | Truy vấn | G | KQ trước | KQ sau | Chính xác trước → sau | Phủ trước → sau | "
            "ms trước → sau | Gợi ý sửa (sau) | Đạt trước → sau |",
            "|---|---|---:|---:|---:|---|---|---|---|---|"]
    for r in sau:
        t = truoc.get(r["q"])
        if t is None:
            continue
        dong.append(
            f"| {r['nhom']} | {r['q']} | {r['so_dung_trong_kho']} | {t['so_ket_qua']} | {r['so_ket_qua']} | "
            f"{so(t['chinh_xac'])} → {so(r['chinh_xac'])} | {so(t['do_phu'])} → {so(r['do_phu'])} | "
            f"{so(t['ms'], 1)} → {so(r['ms'], 1)} | {r['goi_y_sua'] or '—'} | "
            f"{'✓' if t['dat'] else '✗'} → {'✓' if r['dat'] else '✗'} |")
    (THU_MUC_BAO_CAO / "danh_gia_tim_kiem_so_sanh.md").write_text("\n".join(dong) + "\n", encoding="utf-8")


def chay(nhan: str | None = None) -> list[dict]:
    if nhan is None:
        nhan = "sau" if (THU_MUC_BAO_CAO / "danh_gia_tim_kiem_truoc.json").exists() else "truoc"
    ket_qua = cham(nhan)
    ghi_bao_cao(nhan, ket_qua)
    if nhan == "sau":
        ghi_so_sanh()
    print(f"== Đánh giá tìm kiếm ({nhan})")
    print(f"{'Truy vấn':<28}{'G':>5}{'KQ':>6}{'P@5':>6}{'CX':>6}{'Phủ':>6}  {'Gợi ý sửa':<20}{'ms':>7}  Đạt")
    for r in ket_qua:
        print(f"{r['q']:<28}{r['so_dung_trong_kho']:>5}{r['so_ket_qua']:>6}{so(r['p_at_5']):>6}"
              f"{so(r['chinh_xac']):>6}{so(r['do_phu']):>6}  {(r['goi_y_sua'] or '—'):<20}{r['ms']:>7}  "
              f"{'✓' if r['dat'] else '✗'}{'' if r['dat_goi_y'] in (None, True) else ' (gợi ý ✗)'}")
    print(f"Đạt {sum(r['dat'] for r in ket_qua)}/{len(ket_qua)}; báo cáo: "
          f"{THU_MUC_BAO_CAO / f'danh_gia_tim_kiem_{nhan}.md'}")
    return ket_qua


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--nhan", choices=["truoc", "sau"], default=None)
    chay(ap.parse_args().nhan)
