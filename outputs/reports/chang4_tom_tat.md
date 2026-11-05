# Chặng 4 — Tìm kiếm nâng cao: tóm tắt

Ngày chạy: 06/11/2026. Mọi số liệu dưới đây lấy từ lần chạy thật (`pipeline.reset`, `pipeline.danh_gia_tim_kiem`, `EXPLAIN ANALYZE`).
Báo cáo chi tiết: `danh_gia_tim_kiem_truoc.md`, `danh_gia_tim_kiem_sau.md`, `danh_gia_tim_kiem_so_sanh.md`, `chu_de.md`.

## 1. Thiết kế đã chọn

### Nguyên nhân khớp nhầm ở v1
`tim_tai_lieu` cũ = `tsv @@ plainto_tsquery('simple', q)` **hoặc** `q <% tiêu_đề` (trigram, ngưỡng 0,6).
- `plainto_tsquery` nối các âm tiết bằng `&` → "học máy" khớp "bộ **máy** ... Xã hội **học**".
- Trigram trên cả tiêu đề với âm tiết tiếng Việt rất ngắn → "học máy" khớp "Hướng dẫn **học m**ôn", "dệt **may**".
  Đây cũng là nguồn chậm: `word_similarity` phải tính lại trên ~1.000 dòng ứng viên cho mỗi truy vấn.

### Hàm `tim_tai_lieu` mới (migration `0003`, theo tầng)
| Tầng | Điều kiện | Cách khớp | Điểm |
|---|---|---|---|
| 1. Cụm liền | luôn | `tsv @@ phraseto_tsquery('simple', q)` (chỉ mục GIN có sẵn) | 3 + ts_rank |
| 2. Đủ các từ ghép | tầng 1 < 10 kết quả **và** truy vấn tách hết được thành ≥ 2 từ ghép | mỗi từ ghép là một cụm liền, nối `&` ("lưu trữ hồ sơ" khớp "hồ sơ ... lưu trữ") | 1 + ts_rank |
| 3. Sửa lỗi gõ | tầng 1+2 ≤ 3 kết quả | sửa truy vấn về cụm phổ biến trong tiêu đề (`sua_cum`), rồi khớp cụm liền | 3 + ts_rank (bản gõ nguyên văn hạ xuống 2) |

Sửa lỗi gõ (`sua_cum`) dựa trên **từ vựng tiêu đề** (bảng `cum_tu`: 50.214 cụm 1–4 âm tiết đã bỏ dấu, kèm số tư liệu chứa cụm và dạng có dấu phổ biến nhất):
- Ứng viên = cụm có trong ≥ 4 tiêu đề, cùng số âm tiết, Levenshtein **chèn 1 / xóa 1 / thay 2** ≤ 1 (truy vấn < 8 ký tự) hoặc ≤ 2; cộng ứng viên do **đổi chỗ hai ký tự liền nhau** (chi phí 1, kể cả với dấu cách: "con gty" → "cong ty").
- Chỉ nhận khi truy vấn 0 kết quả, hoặc ≤ 3 kết quả và cụm sửa có ≥ 10 lần số đó ("lu tru" có sẵn trong 2–3 tiêu đề gõ sai, "lưu trữ" có 973).
- Nếu vẫn 0 kết quả: sửa từng âm tiết lạ (không có trong từ vựng, ≥ 3 ký tự) về âm tiết phổ biến gần nhất. Nối thêm một bước nếu cụm sửa vẫn ít kết quả ("lu utru" → "lu tru" → "luu tru").
- **Vì sao "thay" tính 2**: âm tiết tiếng Việt bỏ dấu rất ngắn, thay 1 ký tự thường ra một từ có nghĩa khác ("hoc may" → "hoc mai"). Chèn/xóa/đổi chỗ là kiểu lỗi gõ thường gặp (đúng với bộ sinh lỗi gõ của seed). Với quy tắc này "học máy", "học sâu", "python" không có ứng viên → 0 kết quả và không gợi ý sửa.
- Không dùng trigram nữa; chỉ mục trigram cũ vẫn giữ (dùng được cho việc khác), không ảnh hưởng.

Hàm phụ (cùng migration): `tach_am_tiet`, `tsquery_tu_ghep`, `dem_khop`, `sua_cum_mot_buoc`, `sua_cum`, `goi_y_sua_cum` (→ `goi_y_sua` của `/tim-kiem`), `quy_ve_cum` (dạng chuẩn để gộp biến thể), trigger `log_quy_ve` điền cột mới `log_tim_kiem.tu_khoa_quy_ve`. Downgrade khôi phục đúng hàm của 0002 (đã thử: sau `alembic downgrade 0002`, `tim_tai_lieu('hoc may')` lại ra 11, bảng/cột mới bị xóa; `upgrade head` chạy lại được).

### Tách từ tiếng Việt
- **pyvi 0.1.1** (CRF) cài được vào `backend/.venv` trên Python 3.13, không lỗi. Dung lượng: pyvi 29 MB + python-crfsuite 1,5 MB; scikit-learn 44 MB + scipy 114 MB (scikit-learn cần cho TF-IDF dù có pyvi hay không). Không thử underthesea (nặng hơn, không cần).
- Thời gian tách 3.400 tiêu đề: ~3 giây (gồm nạp mô hình).
- Nhược điểm quan sát được: pyvi đôi khi ghép quá dài ("văn_thư_lưu_trữ", "chỉnh_lý_tài_liệu") và không nhất quán ("Hồ_Chí Minh" bên cạnh "Hồ_Chí_Minh"). Đã thêm lượt 2: ghép hai từ liền nhau nếu dạng ghép đã xuất hiện như một từ ở tiêu đề khác.
- Dùng ở đâu: (1) TF-IDF tư liệu tương tự và chủ đề; (2) từ điển 945 từ ghép (`cum_tu.la_tu_ghep`, pyvi ghép trong ≥ 2 tiêu đề) cho tầng 2 của tìm kiếm. Chỉ mục full-text **không** đổi sang từ ghép: tầng 1 khớp cụm liền theo âm tiết đã cho kết quả đúng với mọi truy vấn gõ đúng trong bộ ca, mà vẫn giữ được tìm theo một âm tiết.
- Lợi ích tầng 2 theo bộ ca: "lưu trữ hồ sơ" phủ 0,18 → 1,00, "hồ sơ lưu trữ" 0,06 → 1,00 (nếu chỉ khớp cụm liền: 6 và 2 kết quả); đổi lại "bộ máy hành chính" thêm 4 kết quả ngoài tiêu chí (xem mục 3).

### Tư liệu tương tự và chủ đề (`pipeline/tuong_tu.py`)
- Văn bản = tiêu đề đã tách từ, bỏ từ chung chung ("nghiên_cứu", "thực_trạng", "giải_pháp", …) + token mã vấn đề (`mvd_qtvp`). Không thêm loại hình (sẽ làm mọi luận văn giống nhau).
- `TfidfVectorizer(min_df=2, sublinear_tf=True)`: 1.510 từ. Cosine, top 10 mỗi tư liệu, ngưỡng **0,2** → 33.210 cặp, 3.391/3.400 tư liệu có ≥ 1 tư liệu tương tự, điểm trung vị 0,426.
- Chủ đề: KMeans trên TruncatedSVD 100 chiều (chuẩn L2), k chọn trong 8–12 theo silhouette cosine → **k = 12** (silhouette 0,09–0,10: chủ đề chồng lấn, đúng bản chất tiêu đề ngắn). Nhãn = 2–3 từ ghép nổi bật nhất của tâm cụm. Bảng `chu_de(id, nhan, tu_khoa_noi_bat text[])`, cột `tai_lieu.chu_de_id`. Danh sách ở `chu_de.md`.

### Gợi ý từ khóa và gợi ý sửa
- `/goi-y.tu_khoa`: nhóm theo `coalesce(tu_khoa_quy_ve, tu_khoa_chuan)`, khớp tiền tố trên dạng chuẩn, hiển thị dạng có dấu của `cum_tu` (nếu không có thì dạng người dùng gõ đúng phổ biến nhất). "luuu tru", "lu tru", "luu tu", … được cộng vào "lưu trữ" và không bao giờ hiện ra. Hình dạng JSON giữ nguyên.
- `/tim-kiem.goi_y_sua` = `goi_y_sua_cum(q)`: "vn thư" → "văn thư", "lich us" → "lịch sử", "python" → null, "lưu trữ" → null.

## 2. Số liệu trước / sau

### Bộ ca đánh giá (38 truy vấn cố định + 3 bổ sung sau)
| | Trước (hàm 0002) | Sau (hàm 0003) |
|---|---:|---:|
| Đạt / 38 truy vấn ban đầu | **10** | **37** |
| Đạt / 41 (có 3 ca đổi chỗ ký tự bổ sung) | — | **40** |
| Truy vấn "không có trong kho" ra 0 kết quả | 4/10 | 10/10 |
| Gợi ý sửa đúng | (chưa có) | 41/41 |

Một số dòng tiêu biểu (đầy đủ ở `danh_gia_tim_kiem_so_sanh.md`):
| Truy vấn | G (đúng trong kho) | KQ trước | KQ sau | Chính xác trước → sau |
|---|---:|---:|---:|---|
| học máy | 0 | 11 | 0 | 0 → — |
| trí tuệ nhân tạo | 0 | 16 | 0 | 0 → — |
| học sâu | 0 | 30 | 0 | 0 → — |
| lưu trữ / luu tru | 973 | 975 | 973 | 1,00 → 1,00 |
| lu tru | 973 | 929 | 974 | 1,00 → 1,00 (phủ 0,95 → 1,00) |
| vn thư | 213 | 35 | 211 | 0,46 → 1,00 (phủ 0,08 → 0,99) |
| tài liệu ảnh | 9 | 737 | 9 | 0,01 → 1,00 |
| văn thư | 213 | 458 | 211 | 0,47 → 1,00 |
| công tác văn thư lưu trữ | 35 | 295 | 34 | 0,12 → 1,00 |

### Dữ liệu mô phỏng (seed dùng hàm tìm kiếm thật nên số liệu đổi)
| Chỉ số | Trước | Sau |
|---|---:|---:|
| Tỉ lệ lượt tìm 0 kết quả | 12,1% | 11,8% |
| Tỉ lệ log có `tai_lieu_chon_id` | 41,3% | 41,8% |
| Độ dốc log-log 100 hạng đầu | -1,10 | -1,08 |
| Lượt mượn cho_duyet / dang_muon / da_tra / tu_choi | 12 / 58 / 306 / 24 | 12 / 52 / 307 / 29 (đổi vì lượt mượn ưu tiên tư liệu được chọn nhiều) |
| Số cụm chuẩn hóa khác nhau trong log (`tu_khoa_chuan`) | — | 505 |
| Số nhóm sau khi gộp lỗi gõ (`tu_khoa_quy_ve`) | — | 275 |
| Log là biến thể lỗi gõ được gộp | — | 364 (cả 364 đều có kết quả) |

Lý do tỉ lệ 0 kết quả gần như không đổi dù khớp nhầm giảm mạnh: hai hiệu ứng ngược chiều. "học máy", "trí tuệ nhân tạo", "dữ liệu lớn", "học sâu" giờ ra 0 kết quả nên được seed chọn vào nhóm 30 từ khóa "không có tư liệu" (trước đây chúng bị loại vì có kết quả nhầm, chỗ của chúng là "python", "blockchain", … xếp hạng thấp hơn); đồng thời lỗi gõ (5% log) giờ có kết quả nhờ sửa lỗi. Top 0 kết quả mới: học máy 334, python 180, trí tuệ nhân tạo 87, blockchain 47, dữ liệu lớn 33.
Top 10 từ khóa đổi: trước là lưu trữ 1584, tài liệu 737, công tác 493, python 329, việt nam 285, tổ chức 229, văn phòng 190, blockchain 163, …; sau là lưu trữ 1578, tài liệu 759, công tác 454, **học máy 334**, việt nam 289, tổ chức 192, python 180, văn phòng 176, quản lý 131, khoa học 119 ("blockchain" ra khỏi top 10). Test cũ `test_thong_ke_loc_tu_khoa` (top 1 = "lưu trữ") vẫn đúng.

Số dòng bảng (sau reset): tai_lieu 3.400, ma_van_de 29, ban_sao 5.817, nguoi_dung 63, luot_muon 400, log_tim_kiem 8.000, luot_doc 1.500, **cum_tu 50.214, tai_lieu_tuong_tu 33.210, chu_de 12** (ba bảng cuối mới có dữ liệu ở chặng này; trước đều 0 hoặc chưa có).

### Hiệu năng
| | Trước | Sau |
|---|---:|---:|
| `python -m pipeline.reset` (tổng, `time`) | **51,8 giây** | **16,6 giây** |
| trong đó seed | ~45 giây (ước tính: tổng trừ migrate/ETL) | 6,6 giây |
| bước mới: tách từ + cum_tu / TF-IDF + chủ đề | — | 2,8 / 3,2 giây |

`EXPLAIN ANALYZE` (lần chạy cuối, máy cá nhân, có dao động giữa các lần chạy):
| Truy vấn | Thân hàm cũ (Bitmap OR tsv + trigram, recheck `<%`) | Tầng 1 mới (Bitmap Index Scan `idx_tai_lieu_tsv`, `'luu' <-> 'tru'`) | Cả hàm mới |
|---|---:|---:|---:|
| lưu trữ | 44,4 ms (lần trước 18,6 ms) | 2,6 ms (lần trước 0,6 ms) | 4,5 ms |
| lu tru | 52,8 ms (lần trước 37,5 ms) | 1,0 ms | 10,3 ms (gồm sửa lỗi) |
| học máy | 41,2 ms (lần trước 4,3 ms) | 1,5 ms | 4,5 ms |
Truy vấn ứng viên sửa lỗi trên `cum_tu` dùng chỉ mục `(so_am_tiet, do_dai)`: 1,1–1,4 ms. Hàm cũ phải recheck `word_similarity` trên ~1.000 dòng; hàm mới chỉ đọc dòng khớp cụm.

## 3. Hạn chế đã biết
- **"bộ máy hành chính" không đạt tiêu chí**: chỉ 2 tiêu đề chứa liền cụm, nên tầng 2 thêm 4 tiêu đề chứa "bộ máy" và "hành chính" rời nhau (ví dụ "tổ chức bộ máy quản lý hành chính thành phố Nam Định" — thực ra liên quan; "cải cách hành chính … bộ máy Nhà nước" — liên quan một phần). Hai kết quả khớp liền vẫn đứng đầu. Đây là đánh đổi có chủ ý để "lưu trữ hồ sơ"/"hồ sơ lưu trữ" đủ kết quả.
- "Hồ Chí Minh": 4/83 tư liệu không khớp vì bộ tách token của PostgreSQL đọc "tp.Hồ" (trong cột tác giả/cơ quan) thành một token kiểu tên miền. Sửa được bằng cách thay dấu chấm trước khi tạo `tsv` (phải tạo lại cột sinh); chưa làm vì chỉ ảnh hưởng cột tác giả.
- Tiêu chí chấm là xấp xỉ ("liên quan" = chứa liền cụm sau khi bỏ dấu); không đo được tư liệu liên quan mà không chứa cụm (từ đồng nghĩa).
- Chủ đề lớn nhất ("hà nội, văn hóa, tổ chức", 903 tư liệu) là nhóm tạp; nhãn tự động có thể cần người dùng sửa.
- Ngưỡng (≥ 4 tiêu đề, gấp 10 lần, < 10 kết quả cho tầng 2, chi phí sửa 1/2, TF-IDF 0,2) chọn theo bộ ca đánh giá trên chính kho này — có nguy cơ khớp quá với bộ ca.

## 4. Sự cố trong lúc làm
Bản nháp đầu của `pipeline/tuong_tu.py` dùng `TRUNCATE chu_de RESTART IDENTITY CASCADE`; vì `tai_lieu.chu_de_id` tham chiếu `chu_de`, CASCADE đã xóa sạch `tai_lieu` và mọi bảng phụ thuộc trong CSDL dev. Đã sửa thành `DELETE FROM chu_de` + đặt lại sequence, và dựng lại toàn bộ bằng `pipeline.reset` (dữ liệu sinh lại được hoàn toàn, Excel gốc không bị ảnh hưởng).
