# Hợp đồng API v2

Tiền tố `/api`. JSON. Lỗi: `{"detail": "..."}`. Xác thực: cookie httpOnly `access_token` (JWT), gửi kèm `credentials: 'include'`.
Mã lỗi: 400 dữ liệu sai, 401 chưa đăng nhập, 403 sai vai trò, 404 không có, 409 xung đột (hết bản sao, đăng ký trùng).
Vai trò trả về: `sinh_vien | giang_vien | thu_thu | admin`; nhóm: `khach | nguoi_dung | thu_thu`.
Mọi khóa JSON là tiếng Việt không dấu, snake_case. Ngày theo ISO 8601.

## Kiểu dữ liệu chung
```ts
type LoaiHinh = 'luan_an'|'luan_van'|'khoa_luan'|'bao_cao_kh'|'ky_yeu'|'sach'|'sach_ha_noi'|'tu_sach_tang';
type NguoiDung = { id: number; ten_dang_nhap: string; ho_ten: string; vai_tro: string; nhom: 'nguoi_dung'|'thu_thu' };
type TaiLieuTomTat = {
  id: number; ky_hieu: string; tieu_de: string; tac_gia: string|null; loai_hinh: LoaiHinh; nam: number|null;
  so_ban: number; so_ban_con: number; co_ban_mem: boolean; muc_truy_cap: 'cong_khai'|'noi_bo'|null; khong_co_tl: boolean;
};
type TaiLieuChiTiet = TaiLieuTomTat & {
  gvhd: string|null; co_quan: string|null; nxb: string|null; nam_goc: string|null; he: string|null; khoa_hoc: string|null; ghi_chu: string|null;
  ma_van_de: { ma: string; ten: string|null } | null;
  ban_sao: { id: number; ma_ban_sao: string; trang_thai: 'con'|'dang_muon'|'mat' }[];
  luot_muon_cua_toi: LuotMuon | null;   // lượt đang mở của người đang đăng nhập với tư liệu này
};
type LuotMuon = {
  id: number; tai_lieu: { id: number; ky_hieu: string; tieu_de: string; loai_hinh: LoaiHinh };
  nguoi_dung?: { id: number; ho_ten: string; ten_dang_nhap: string; vai_tro: string }; // chỉ có ở API quản lý
  ma_ban_sao: string|null; trang_thai: 'cho_duyet'|'dang_muon'|'da_tra'|'tu_choi';
  ngay_dang_ky: string; ngay_muon: string|null; han_tra: string|null; ngay_tra: string|null; qua_han: boolean;
};
type TrangKetQua<T> = { du_lieu: T[]; tong_so: number; trang: number; kich_thuoc: number; tong_trang: number };
```

## Tài khoản
| Phương thức | Đường dẫn | Vai trò | Vào | Ra |
|---|---|---|---|---|
| POST | `/auth/dang-nhap` | * | `{ten_dang_nhap, mat_khau}` | `{nguoi_dung: NguoiDung}` + đặt cookie |
| POST | `/auth/dang-xuat` | * | — | `{ok: true}` |
| GET | `/auth/toi` | * | — | `{nguoi_dung: NguoiDung \| null}` |

## Tra cứu (mọi người)
| Phương thức | Đường dẫn | Ra |
|---|---|---|
| GET | `/gioi-thieu` | `{tong_tai_lieu, da_so_hoa, so_loai_hinh, theo_loai_hinh: {loai_hinh, so_luong}[], tu_khoa_noi_bat: string[]}` |
| GET | `/goi-y?q=` (≥2 ký tự) | `{tai_lieu: {id, tieu_de, loai_hinh, nam}[] (≤6), tu_khoa: {tu_khoa, so_lan}[] (≤5, từ log, khớp tiền tố/không dấu)}` |
| GET | `/tim-kiem?q=&loai=&tu_nam=&den_nam=&co_ban_mem=&con_ban=&sap_xep=lien_quan\|moi_nhat\|cu_nhat&chinh_xac=0\|1&trang=1&kich_thuoc=20` | `TrangKetQua<TaiLieuTomTat> & {log_id: number\|null, facet: {loai_hinh: {gia_tri, so_luong}[], thap_nien: {gia_tri, so_luong}[]}, goi_y_sua: string\|null, da_sua: string\|null}` |
| POST | `/tim-kiem/{log_id}/chon` | vào `{tai_lieu_id}`; ra `{ok: true}` |
| GET | `/tai-lieu/{id}` | `TaiLieuChiTiet` |
| GET | `/tai-lieu/{id}/tuong-tu?gioi_han=6` | `{tai_lieu: TaiLieuTomTat, diem: number}[]` — đã có dữ liệu từ chặng 4 (bảng `tai_lieu_tuong_tu`, cosine TF-IDF ≥ 0,2, top 10 mỗi tư liệu) |
| GET | `/tai-lieu/{id}/ban-mem` | file PDF; `noi_bo` cần đăng nhập (401); ghi 1 dòng `luot_doc` |

Quy tắc: ghi `log_tim_kiem` khi `q` khác rỗng và `trang=1` (cả khi `chinh_xac=1`; `so_ket_qua` là số kết quả của đúng chế độ đã tìm).
- `goi_y_sua` = hàm SQL `goi_y_sua_cum(q)`: cụm gần đúng (dạng có dấu) khi truy vấn có ≤ 3 kết quả nguyên văn và có cụm rất giống, phổ biến hơn hẳn trong tiêu đề; `null` khi truy vấn đã đúng hoặc không có ứng viên ("vn thư" → "văn thư", "python" → null). Trả cả khi `chinh_xac=1`.
- `da_sua` (đợt sửa cuối): như các công cụ tìm kiếm phổ biến, khi có sửa lỗi gõ thì **mặc định đã hiện kết quả của cụm sửa**; `da_sua` = cụm đó (bằng `goi_y_sua`) để giao diện hiện "Đang hiện kết quả cho **lưu trữ**. Tìm chính xác “lu tru”". `null` khi không sửa hoặc khi `chinh_xac=1`.
- `chinh_xac=1`: bỏ qua sửa lỗi, chỉ khớp cụm liền nguyên văn (hàm `tim_tai_lieu_chinh_xac`). Ví dụ `lu tru`: mặc định 974 kết quả (`da_sua` = "lưu trữ"), `chinh_xac=1` còn 2 (tiêu đề có sẵn chữ "lu tru"); `vn thư` chính xác ra 0.

## Người dùng (sinh_vien, giang_vien)
| POST | `/muon` | vào `{tai_lieu_id}`; ra `LuotMuon` (cho_duyet); 409 nếu hết bản sao hoặc đã có lượt mở |
|---|---|---|
| GET | `/muon/cua-toi` | `LuotMuon[]` |

## Thủ thư (thu_thu, admin)
| Phương thức | Đường dẫn | Ra |
|---|---|---|
| GET | `/quan-ly/muon?trang_thai=&q=&trang=&kich_thuoc=` | `TrangKetQua<LuotMuon> & {dem: {cho_duyet, dang_muon, qua_han, da_tra, tu_choi}}` |
| POST | `/quan-ly/muon/{id}/duyet` | `LuotMuon` (gán bản sao, hạn trả +14 ngày); 409 nếu hết bản |
| POST | `/quan-ly/muon/{id}/tu-choi` | `LuotMuon` |
| POST | `/quan-ly/muon/{id}/tra` | `LuotMuon` |
| POST | `/quan-ly/tai-lieu/{id}/ban-mem` | multipart `file` (PDF ≤ 20MB, kiểm tra `%PDF`), `muc_truy_cap`; ra `TaiLieuChiTiet` |
| GET | `/quan-ly/tai-lieu?q=&trang=` | `TrangKetQua<TaiLieuTomTat>` (không ghi log) |
| GET / PUT | `/quan-ly/ma-van-de` | `{ma, ten, so_tai_lieu}[]` / vào `{ma, ten}` |
| GET | `/quan-ly/chu-de` | `{id, nhan, nhan_tu_dong, da_sua_tay: boolean, tu_khoa_noi_bat: string[], so_tai_lieu}[]`, sắp giảm dần theo số tư liệu |
| PUT | `/quan-ly/chu-de/{id}` | vào `{nhan}` (1–200 ký tự, gộp khoảng trắng); lưu là nhãn sửa tay (`da_sua_tay = true`, giữ qua `pipeline.reset`); đặt đúng bằng `nhan_tu_dong` thì coi như khôi phục. Ra một chủ đề như trên. 400 nhãn rỗng, 404 không có, 409 trùng nhãn chủ đề khác (không phân biệt hoa thường) |
| POST | `/quan-ly/chu-de/{id}/khoi-phuc` | bỏ nhãn sửa tay, `nhan = nhan_tu_dong`, `da_sua_tay = false`; ra một chủ đề. 404 không có, 409 nếu nhãn tự động đang trùng nhãn chủ đề khác |

## Thống kê (thủ thư) — chỉ số tổng hợp
Mọi API nhận bộ lọc chung để lọc chéo: `tu_ngay`, `den_ngay` (mặc định 90 ngày gần nhất), `loai` (loại hình), `tu_khoa` (cụm đã chuẩn hóa).
| Đường dẫn | Ra |
|---|---|
| `/thong-ke/tong-quan` | `{tong_luot_tim, ti_le_khong_ket_qua, luot_muon_mo, qua_han, da_so_hoa, tong_tai_lieu, luot_doc, so_sanh_ky_truoc: {tong_luot_tim, ti_le_khong_ket_qua, luot_doc}}` |
| `/thong-ke/tu-khoa?gioi_han=60` | `{tu_khoa, hien_thi, so_lan, so_lan_khong_kq}[]` |
| `/thong-ke/theo-ngay` | `{ngay, so_luot, so_luot_khong_kq, dang_cap_nhat: boolean}[]` (đủ mọi ngày, ngày thiếu = 0) |
| `/thong-ke/khong-ket-qua?gioi_han=20` | `{tu_khoa, hien_thi, so_lan, lan_cuoi}[]` |
| `/thong-ke/nen-so-hoa?gioi_han=20` | `{tai_lieu: TaiLieuTomTat, so_lan_chon, so_luot_muon, diem_lan_toa, diem, lan_toa_tu: {id, tieu_de, so_luot_doc, diem_tuong_tu, dong_gop}[]}[]` (`lan_toa_tu`: top 3 nguồn, chặng 5) |
| `/thong-ke/theo-loai-hinh` | `{loai_hinh, so_tai_lieu, so_luot_chon, so_luot_muon, da_so_hoa}[]` |
| `/thong-ke/luot-doc?gioi_han=20` | `{top: {tai_lieu: TaiLieuTomTat, so_luot_doc}[], theo_ngay: {ngay, so_luot}[]}` |
| `/thong-ke/chu-de-theo-thoi-gian` | `{chu_de: {id, nhan, so_luot}[], don_vi: 'ngay'\|'tuan', du_lieu: [ngay, so_luot, nhan_chu_de][]}` (ThemeRiver, chặng 5) |
| `/thong-ke/muon-cung-nhau?nguong=2&gioi_han_nut=60` (`nguong` 2–50) | `{nut: {id, ten, tieu_de, ky_hieu, loai_hinh, chu_de: {id, nhan}\|null, so_luot_muon}[], canh: {nguon, dich, trong_so}[], nguong, trong_so_lon_nhat, tong_so_nut}` (chặng 5) |

## Đã chốt khi cài đặt chặng 1–2 (06/11/2026)
- Dữ liệu vào sai (kể cả sai kiểu) → **400** (không dùng 422). Chuyển trạng thái sai (duyệt/từ chối lượt không ở `cho_duyet`, trả lượt không ở `dang_muon`) → **409**.
- `POST /muon` → **201**; **409** khi tư liệu `khong_co_tl`, `so_ban_con = 0`, hoặc đã có lượt mở cho cùng tư liệu.
- Facet `thap_nien.gia_tri` là chuỗi đầu thập niên (`"2010"`), sắp tăng dần. Mỗi nhóm facet bỏ bộ lọc của chính nó.
- Khách có cookie httpOnly `ma_phien` để gắn log và lượt đọc. `/tim-kiem/{log_id}/chon`: 403 nếu khác phiên/người dùng, 404 nếu log không có.
- `/goi-y.tu_khoa`: chỉ cụm có kết quả và được tìm ≥ 2 lần; khớp tiền tố hoặc đầu một từ.
- `/gioi-thieu.tu_khoa_noi_bat`: 8 cụm tìm nhiều nhất trong 30 ngày, có kết quả, ≥ 2 lượt.
- `GET /quan-ly/muon` nhận thêm `trang_thai=qua_han`.
- Thống kê: `ti_le_khong_ket_qua` là phần trăm 0–100 (1 chữ số thập phân). `luot_muon_mo`, `qua_han`, `da_so_hoa`, `tong_tai_lieu` không phụ thuộc khoảng ngày. Khoảng ngày tối đa 366 ngày (sai → 400). `theo-loai-hinh` bỏ qua bộ lọc `loai`.
- (Chặng 1–2) `chu-de-theo-thoi-gian`, `muon-cung-nhau` chưa có (404), `diem_lan_toa = 0`. Từ chặng 5 đã có, xem mục dưới.

`diem = so_lan_chon + 2 × so_luot_muon + diem_lan_toa`. `diem_lan_toa` = tổng (độ tương tự TF-IDF × ln(1 + số lượt đọc)) của các tư liệu tương tự đã có bản mềm: tư liệu đã số hóa được đọc nhiều thì các tư liệu giống nó (chưa số hóa) được cộng điểm. Đây là cách khép vòng lặp "bản mềm sinh dữ liệu cho vòng sau" (đã cài ở chặng 5, chi tiết dưới).

## Đã chốt khi cài đặt chặng 4 (06/11/2026)
- CSDL (migration `0003`): bảng `cum_tu(cum, so_am_tiet, do_dai, so_tai_lieu, hien_thi, la_tu_ghep)` — từ vựng tiêu đề (cụm 1–4 âm tiết đã bỏ dấu) dùng sửa lỗi gõ và tách từ ghép; bảng `chu_de(id, nhan, tu_khoa_noi_bat text[])` — 12 chủ đề KMeans trên TF-IDF tiêu đề; cột `tai_lieu.chu_de_id` (FK `chu_de`, `ON DELETE SET NULL`); cột `log_tim_kiem.tu_khoa_quy_ve` (dạng chuẩn sau khi gộp lỗi gõ, trigger `log_quy_ve` tự điền). Bảng `tai_lieu_tuong_tu` có dữ liệu (≈ 33.210 cặp, có hướng: `tai_lieu_id` → top 10 `tai_lieu_lien_quan_id`).
- `/tim-kiem` dùng hàm `tim_tai_lieu` mới (khớp cụm liền → đủ các từ ghép → sửa lỗi gõ); hình dạng JSON không đổi, `goi_y_sua` có giá trị. (Migration 0004 bỏ tầng "đủ các từ ghép", xem mục cuối.)
- `/goi-y.tu_khoa` gộp theo `coalesce(tu_khoa_quy_ve, tu_khoa_chuan)`; biến thể gõ sai không hiện ra. Hình dạng không đổi.
- `/tai-lieu/{id}/tuong-tu` trả dữ liệu thật (điểm cosine TF-IDF, giảm dần).

## Đã chốt khi cài đặt chặng 5
Cả ba API thống kê mới nhận bộ lọc chung (`tu_ngay`, `den_ngay`, `loai`, `tu_khoa`), chỉ thủ thư (khách 401, người dùng 403), chỉ trả số tổng hợp (không có định danh bạn đọc).

**`/thong-ke/chu-de-theo-thoi-gian`** (ThemeRiver)
- Một lượt tìm thuộc chủ đề của tư liệu được chọn (`tai_lieu_chon_id` → `tai_lieu.chu_de_id`); lượt không chọn, hoặc tư liệu chưa có chủ đề, không tính. Bộ lọc giống các API log khác (`loai` = loại của tư liệu được chọn, `tu_khoa` = cụm đã chuẩn hóa).
- `don_vi = 'tuan'` khi khoảng ngày > 45 ngày (tính cả hai đầu), ngược lại `'ngay'`. Gộp tuần: `ngay` là thứ Hai của tuần (ISO), riêng tuần đầu lấy `tu_ngay` nên tuần đầu/cuối có thể thiếu ngày.
- `chu_de`: các chủ đề có ≥ 1 lượt trong khoảng, sắp giảm dần theo `so_luot` (tổng). `du_lieu` đủ lưới kỳ × chủ đề (ô thiếu = 0), sắp theo chủ đề rồi theo ngày. Không có dữ liệu → `chu_de: []`, `du_lieu: []`.

**`/thong-ke/muon-cung-nhau?nguong=2&gioi_han_nut=60`**
- Hai tư liệu nối nhau nếu cùng một bạn đọc có lượt mượn không bị từ chối (`trang_thai <> 'tu_choi'`) với cả hai, `ngay_dang_ky` trong khoảng ngày; `trong_so` = số bạn đọc khác nhau mượn chung. `loai`/`tu_khoa` lọc lượt mượn như các API mượn khác (nên cả hai đầu cạnh cùng loại khi lọc loại).
- Giữ cạnh `trong_so ≥ nguong` (2–50, mặc định 2; `nguong` < 2 → 400: một bạn đọc chung dễ là trùng hợp). Nếu số nút > `gioi_han_nut` (5–150, mặc định 60) thì giữ các nút có tổng trọng số cạnh lớn nhất và các cạnh giữa chúng. Mọi nút trả về đều có ít nhất một cạnh.
- `ten` = tiêu đề rút gọn ≤ 48 ký tự (thêm `…`); `tieu_de` đầy đủ cho tooltip; `so_luot_muon` = số lượt mượn không bị từ chối trong khoảng (theo bộ lọc). Thêm `trong_so_lon_nhat` (trên mọi cạnh, trước ngưỡng — để đặt thanh trượt) và `tong_so_nut` (số nút sau ngưỡng, trước khi cắt giới hạn).

**Điểm lan tỏa trong `/thong-ke/nen-so-hoa`**
- `diem_lan_toa(t) = Σ diem_tuong_tu(s, t) × ln(1 + so_luot_doc(s))` (đợt sửa cuối; trước là `× so_luot_doc(s)`) trên các tư liệu `s` đã có bản mềm mà `t` nằm trong danh sách tương tự của `s` (`tai_lieu_tuong_tu.tai_lieu_id = s`, tức đúng danh sách "tư liệu tương tự" hiện ở trang chi tiết của `s`); `so_luot_doc(s)` = lượt đọc bản mềm trong khoảng ngày.
- Bỏ cặp trùng tiêu đề (`f_chuan_hoa(tieu_de)` bằng nhau: cùng tác phẩm nhập ở hai sheet), vì bản kia đã có bản mềm nên không phải "lan tỏa".
- `diem = round(so_lan_chon + 2 × so_luot_muon + diem_lan_toa, 1)`; `diem_lan_toa` cũng làm tròn 1 chữ số. Danh sách gồm tư liệu chưa số hóa, không `khong_co_tl`, có lượt chọn/mượn **hoặc** điểm lan tỏa > 0. Khi có `tu_khoa`, chỉ giữ tư liệu có lượt chọn/mượn gắn với từ khóa đó (lượt đọc chỉ lọc theo ngày). `loai` lọc tư liệu ứng viên.
- `lan_toa_tu`: tối đa 3 nguồn đóng góp nhiều nhất, `dong_gop = diem_tuong_tu × ln(1 + so_luot_doc)` (1 chữ số), `diem_tuong_tu` 3 chữ số; rỗng khi `diem_lan_toa = 0`.

**Quản lý chủ đề**: `GET /quan-ly/chu-de`, `PUT /quan-ly/chu-de/{id}`, `POST /quan-ly/chu-de/{id}/khoi-phuc` như bảng trên. Từ đợt sửa cuối, nhãn sửa tay **không** bị ghi đè khi `pipeline.reset` / `pipeline.tuong_tu` gom cụm lại (xem mục dưới).

## Đã chốt ở đợt sửa cuối (migration `0004`, quyết định của người dùng 06/11/2026)
- **Tìm kiếm chỉ còn hai tầng**: (1) khớp cụm liền (`phraseto_tsquery`), (3) sửa lỗi gõ khi tầng 1 có ≤ 3 kết quả. Bỏ tầng 2 "khớp đủ các từ ghép": đảo thứ tự từ ghép **không** còn khớp ("hồ sơ lưu trữ" ra 2 kết quả chứa liền cụm đó, không ra "lưu trữ hồ sơ"); đổi lại "bộ máy hành chính" không còn kết quả chứa "bộ máy" và "hành chính" rời nhau. Hàm mới `tim_tai_lieu_chinh_xac(q)`; `dem_khop` chỉ đếm tầng 1; bỏ `tsquery_tu_ghep`. Downgrade về 0003 khôi phục đúng các hàm cũ.
- **Gõ sai**: `/tim-kiem` thêm tham số `chinh_xac` và trường `da_sua` (xem mục Tra cứu).
- **Nhãn chủ đề**: bảng `chu_de` thêm `nhan_tu_dong`, `khoa` (chữ ký cụm = 5 từ nổi bật đầu, sắp xếp, nối `|`), `da_sua_tay`; bảng mới `chu_de_nhan_tay(khoa PK, tu_khoa text[], nhan, cap_nhat)`. `pipeline.tuong_tu` áp lại nhãn tay cho cụm trùng chữ ký, hoặc (nếu cụm đổi nhẹ) cụm có Jaccard từ nổi bật ≥ 0,5; `pipeline.reset` sao lưu bảng này qua downgrade/upgrade. Cụm kém tập trung (silhouette cosine trung bình < 0 **hoặc** < 50% tư liệu chứa một trong 3 từ nổi bật đầu) nhận nhãn tự động "Tổng hợp (nhiều chủ đề)"; trên kho hiện tại chỉ cụm 903 tư liệu (silhouette −0,055, phủ 19%).
- **Điểm lan tỏa** = Σ độ tương tự × ln(1 + lượt đọc). Top 10 "nên số hóa" không còn tư liệu chỉ nhờ lan tỏa (trước: 3); số liệu ở `outputs/reports/lan_toa_truoc_sau.md`.
- **Đồ thị mượn cùng nhau**: `nguong` tối thiểu 2 (400 nếu nhỏ hơn); thanh trượt bắt đầu từ 2.
