# Điểm lan tỏa: top 10 "nên số hóa" trước / sau đổi công thức

Sinh lúc 05/11/2026 22:43 trên CSDL sau `pipeline.reset` (bộ lọc mặc định: 90 ngày gần nhất, không lọc loại/từ khóa). Cùng dữ liệu, chỉ đổi công thức đóng góp lan tỏa của mỗi bản mềm nguồn s:

- **Trước:** `dong_gop = diem_tuong_tu(s, t) × so_luot_doc(s)`
- **Sau (quyết định của người dùng):** `dong_gop = diem_tuong_tu(s, t) × ln(1 + so_luot_doc(s))`
- `diem = so_lan_chon + 2 × so_luot_muon + Σ dong_gop` (không đổi).

## Tóm tắt

| Chỉ số | Trước | Sau |
|---|---:|---:|
| Tư liệu trong top 10 chỉ nhờ lan tỏa (chọn = mượn = 0) | 3 | 0 |
| Tư liệu trong top 10 có lan tỏa > chọn + 2×mượn | 4 | 0 |
| Điểm lan tỏa lớn nhất (mọi ứng viên) | 172.1 | 4.9 |
| Tổng lan tỏa / tổng điểm trong top 10 | 30.6% | 0.0% |
| Số tư liệu có lan tỏa > 0 trong 200 dòng đầu bảng | 143 | 43 |

Rời top 10: 421, 2660, 412, 768; vào top 10: 2879, 2865, 2275, 1538.

Kết luận: với công thức mới, lượt chọn và lượt mượn là thành phần chính của 10 tư liệu đầu; lan tỏa chỉ còn là phần cộng thêm nhỏ (tăng chậm dần theo lượt đọc) nên không đẩy được tư liệu không có nhu cầu trực tiếp lên đầu bảng. Đánh đổi: lan tỏa lớn nhất chỉ còn 4.9 điểm (trước 172.1), nên nó chủ yếu xếp thứ tự trong nhóm tư liệu có ít hoặc không có lượt chọn/mượn (bảng cuối).

## Trước (độ tương tự × lượt đọc)

| # | id | Tư liệu | Lượt chọn | Lượt mượn | Chọn + 2×mượn | Lan tỏa | Điểm | Lan tỏa / điểm |
|---:|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | 2947 | Tuyển tập những bài công bố, giới thiệu tài liệu lưu trữ của trung tâ… | 335 | 21 | 377 | 0.0 | 377.0 | 0% |
| 2 | 2004 | Giới thiệu các nguồn tài liệu lưu trữ về đảo Cô Tô (Qua khảo sát tại … | 197 | 15 | 227 | 0.0 | 227.0 | 0% |
| 3 | 1835 | Tình hình triển khai và thực hiện số hóa tài liệu lưu trữ (tài liệu h… | 162 | 12 | 186 | 0.0 | 186.0 | 0% |
| 4 | 421 | Phông lưu trữ UB Điều tra tội ác chiến tranh của Đế quốc Mỹ ở Việt Na… | 0 | 0 | 0 | 172.1 | 172.1 | 100% |
| 5 | 1133 | Đánh giá hoạt động thu thập , bổ sung tài liệu phim và tài liệu kèm t… | 111 | 15 | 141 | 0.0 | 141.0 | 0% |
| 6 | 1179 | Một vài ý kiến về công tác công văn giấytờ và công tác LT ở Bộ Thương… | 111 | 10 | 131 | 0.0 | 131.0 | 0% |
| 7 | 2660 | Nguồn tư liệu ảnh về cuộc kháng chiến chống thực dân pháp (1945- 1954) | 0 | 0 | 0 | 122.1 | 122.1 | 100% |
| 8 | 984 | Phát huy giá trị tài liệu lưu trữ về địa phương tại các lưu trữ lịch … | 112 | 5 | 122 | 0.0 | 122.0 | 0% |
| 9 | 412 | Phông lưu trữ UB thống nhất Chính phủ nguồn sử liệu về công tác viện … | 1 | 0 | 1 | 113.3 | 114.3 | 99% |
| 10 | 768 | Phông lưu trữ Uỷ ban thống nhất Chính phủ - nguồn sử liệu về cuộc đấu… | 0 | 0 | 0 | 114.3 | 114.3 | 100% |

## Sau (độ tương tự × ln(1 + lượt đọc))

| # | id | Tư liệu | Lượt chọn | Lượt mượn | Chọn + 2×mượn | Lan tỏa | Điểm | Lan tỏa / điểm |
|---:|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | 2947 | Tuyển tập những bài công bố, giới thiệu tài liệu lưu trữ của trung tâ… | 335 | 21 | 377 | 0.0 | 377.0 | 0% |
| 2 | 2004 | Giới thiệu các nguồn tài liệu lưu trữ về đảo Cô Tô (Qua khảo sát tại … | 197 | 15 | 227 | 0.0 | 227.0 | 0% |
| 3 | 1835 | Tình hình triển khai và thực hiện số hóa tài liệu lưu trữ (tài liệu h… | 162 | 12 | 186 | 0.0 | 186.0 | 0% |
| 4 | 1133 | Đánh giá hoạt động thu thập , bổ sung tài liệu phim và tài liệu kèm t… | 111 | 15 | 141 | 0.0 | 141.0 | 0% |
| 5 | 1179 | Một vài ý kiến về công tác công văn giấytờ và công tác LT ở Bộ Thương… | 111 | 10 | 131 | 0.0 | 131.0 | 0% |
| 6 | 984 | Phát huy giá trị tài liệu lưu trữ về địa phương tại các lưu trữ lịch … | 112 | 5 | 122 | 0.0 | 122.0 | 0% |
| 7 | 2879 | Giáo dục Việt Nam thời kỳ thuộc địa qua tài liệu và tài liệu lưu trữ | 68 | 5 | 78 | 0.0 | 78.0 | 0% |
| 8 | 2865 | Nửa thế kỷ Khoa Việt Nam học và Tiếng Việt | 66 | 5 | 76 | 0.0 | 76.0 | 0% |
| 9 | 2275 | Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ | 52 | 6 | 64 | 0.0 | 64.0 | 0% |
| 10 | 1538 | Công tác thu thập tài liệu phim và tài liệu kèm theo phim tại Viện ph… | 52 | 4 | 60 | 0.0 | 60.0 | 0% |

## Tư liệu có lan tỏa lớn nhất (sau), để thấy lan tỏa vẫn có tác dụng ở nhóm điểm thấp

| # | id | Tư liệu | Lượt chọn | Lượt mượn | Chọn + 2×mượn | Lan tỏa | Điểm | Lan tỏa / điểm |
|---:|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | 401 | Tìm hiểu về tổ chức sử dụng tài liệu lưu trữ phông Quốc hội tại TTLTQ… | 0 | 0 | 0 | 4.9 | 4.9 | 100% |
| 2 | 1324 | Bước đầu tìm hiểu về mạng Internet và vai trò của mạng trong hoạt độn… | 0 | 0 | 0 | 3.1 | 3.1 | 100% |
| 3 | 2032 | Tìm hiểu văn hóa giao tiếp qua E-mail | 0 | 0 | 0 | 3.1 | 3.1 | 100% |
| 4 | 2794 | Lịch sử hợp tác kinh tế và khoa học- kỹ thuật Việt Nam - Liên Xô 1950… | 0 | 1 | 2 | 2.9 | 4.9 | 59% |
| 5 | 412 | Phông lưu trữ UB thống nhất Chính phủ nguồn sử liệu về công tác viện … | 1 | 0 | 1 | 2.5 | 3.5 | 71% |
