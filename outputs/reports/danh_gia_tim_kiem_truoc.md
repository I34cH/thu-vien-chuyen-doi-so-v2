# Đánh giá tìm kiếm — TRUOC

Sinh bởi `python -m pipeline.danh_gia_tim_kiem`. Cách chấm: xem docstring của script (liên quan = tiêu đề + tác giả chứa liền cụm bắt buộc sau khi bỏ dấu; G = số tư liệu liên quan trong kho).

**Đạt 10/38 truy vấn.** (Chưa có hàm gợi ý sửa.)

| Nhóm | Truy vấn | Tiêu chí | G | Số KQ | P@5 | Chính xác | Phủ | Gợi ý sửa | ms | Đạt |
|---|---|---|---:|---:|---:|---:|---:|---|---:|:---:|
| gõ đúng | lưu trữ | chứa liền 'luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 973 | 975 | 1,00 | 1,00 | 1,00 | — | 24,2 | ✓ |
| gõ đúng | văn bản | chứa liền 'van ban' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 224 | 307 | 1,00 | 0,73 | 1,00 | — | 16,1 | ✗ |
| gõ đúng | hồ sơ | chứa liền 'ho so' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 126 | 184 | 1,00 | 0,68 | 1,00 | — | 13,8 | ✗ |
| gõ đúng | lịch sử | chứa liền 'lich su' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 205 | 244 | 1,00 | 0,84 | 1,00 | — | 10,0 | ✗ |
| gõ đúng | thủ tục hành chính | chứa liền 'thu tuc hanh chinh' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 31 | 81 | 1,00 | 0,38 | 1,00 | — | 14,5 | ✗ |
| gõ đúng | văn hóa doanh nghiệp | chứa liền 'van hoa doanh nghiep' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 21 | 90 | 1,00 | 0,23 | 1,00 | — | 16,2 | ✗ |
| gõ đúng | bảo quản tài liệu | chứa liền 'bao quan tai lieu' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 31 | 173 | 0,60 | 0,18 | 1,00 | — | 24,4 | ✗ |
| gõ đúng | Hồ Chí Minh | chứa liền 'ho chi minh' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 83 | 79 | 1,00 | 1,00 | 0,95 | — | 7,9 | ✓ |
| không dấu | luu tru | chứa liền 'luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 973 | 975 | 1,00 | 1,00 | 1,00 | — | 21,2 | ✓ |
| không dấu | van thu | chứa liền 'van thu' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 213 | 458 | 1,00 | 0,47 | 1,00 | — | 33,1 | ✗ |
| không dấu | quan tri van phong | chứa liền 'quan tri van phong' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 67 | 269 | 1,00 | 0,25 | 1,00 | — | 42,2 | ✗ |
| không dấu | cai cach hanh chinh | chứa liền 'cai cach hanh chinh' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 25 | 208 | 0,80 | 0,12 | 1,00 | — | 20,0 | ✗ |
| không dấu | tai lieu anh | chứa liền 'tai lieu anh' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 9 | 737 | 1,00 | 0,01 | 1,00 | — | 49,9 | ✗ |
| gõ sai nhẹ | lu tru | chứa liền 'luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 973 | 929 | 0,80 | 1,00 | 0,95 | — | 52,6 | ✗ |
| gõ sai nhẹ | luuu tru | chứa liền 'luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 973 | 930 | 1,00 | 1,00 | 0,95 | — | 53,7 | ✓ |
| gõ sai nhẹ | lưu trư | chứa liền 'luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 973 | 975 | 1,00 | 1,00 | 1,00 | — | 30,4 | ✓ |
| gõ sai nhẹ | vn thư | chứa liền 'van thu' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 213 | 35 | 0,40 | 0,46 | 0,08 | — | 10,9 | ✗ |
| gõ sai nhẹ | van phogn | chứa liền 'van phong' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 465 | 441 | 0,80 | 1,00 | 0,94 | — | 32,8 | ✗ |
| gõ sai nhẹ | hành chín | chứa liền 'hanh chinh' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 213 | 227 | 1,00 | 0,90 | 0,96 | — | 27,6 | ✓ |
| gõ sai nhẹ | chinh ly tai leu | chứa liền 'chinh ly tai lieu' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 10 | 79 | 0,80 | 0,13 | 1,00 | — | 19,2 | ✗ |
| gõ sai nhẹ | cong tac van thuw | chứa liền 'cong tac van thu' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 104 | 176 | 0,60 | 0,59 | 1,00 | — | 33,8 | ✗ |
| không có trong kho | học máy | kho không có tư liệu chứa 'hoc may' → phải 0 kết quả | 0 | 11 | 0,00 | 0,00 | — | — | 6,8 | ✗ |
| không có trong kho | hoc may | kho không có tư liệu chứa 'hoc may' → phải 0 kết quả | 0 | 11 | 0,00 | 0,00 | — | — | 6,0 | ✗ |
| không có trong kho | python | kho không có tư liệu chứa 'python' → phải 0 kết quả | 0 | 0 | — | — | — | — | 0,6 | ✓ |
| không có trong kho | trí tuệ nhân tạo | kho không có tư liệu chứa 'tri tue nhan tao' → phải 0 kết quả | 0 | 16 | 0,00 | 0,00 | — | — | 8,6 | ✗ |
| không có trong kho | machine learning | kho không có tư liệu chứa 'machine learning' → phải 0 kết quả | 0 | 0 | — | — | — | — | 0,9 | ✓ |
| không có trong kho | dữ liệu lớn | kho không có tư liệu chứa 'du lieu lon' → phải 0 kết quả | 0 | 13 | 0,00 | 0,00 | — | — | 10,4 | ✗ |
| không có trong kho | học sâu | kho không có tư liệu chứa 'hoc sau' → phải 0 kết quả | 0 | 30 | 0,00 | 0,00 | — | — | 9,0 | ✗ |
| không có trong kho | blockchain | kho không có tư liệu chứa 'blockchain' → phải 0 kết quả | 0 | 0 | — | — | — | — | 0,8 | ✓ |
| không có trong kho | an ninh mạng | kho không có tư liệu chứa 'an ninh mang' → phải 0 kết quả | 0 | 1 | 0,00 | 0,00 | — | — | 3,1 | ✗ |
| không có trong kho | mạng nơ ron | kho không có tư liệu chứa 'mang no ron' → phải 0 kết quả | 0 | 0 | — | — | — | — | 1,3 | ✓ |
| nhiều âm tiết | công tác văn thư lưu trữ | chứa liền 'cong tac van thu luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 35 | 295 | 1,00 | 0,12 | 1,00 | — | 51,1 | ✗ |
| nhiều âm tiết | tài liệu lưu trữ | chứa liền 'tai lieu luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 304 | 825 | 1,00 | 0,37 | 1,00 | — | 48,1 | ✗ |
| nhiều âm tiết | chỉnh lý tài liệu | chứa liền 'chinh ly tai lieu' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 10 | 116 | 0,80 | 0,09 | 1,00 | — | 25,4 | ✗ |
| nhiều âm tiết | bộ máy hành chính | chứa liền 'bo may hanh chinh' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 2 | 25 | 0,40 | 0,08 | 1,00 | — | 9,6 | ✗ |
| nhiều âm tiết | ủy ban nhân dân | chứa liền 'uy ban nhan dan' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 26 | 33 | 1,00 | 0,79 | 1,00 | — | 7,2 | ✗ |
| nhiều âm tiết | lưu trữ hồ sơ | chứa liền 'luu tru' + 'ho so' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 33 | 152 | 1,00 | 0,22 | 1,00 | — | 29,9 | ✗ |
| nhiều âm tiết | hồ sơ lưu trữ | chứa liền 'ho so' + 'luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 33 | 152 | 1,00 | 0,22 | 1,00 | — | 29,6 | ✗ |

## 5 kết quả đầu

(✓ = liên quan theo tiêu chí, ✗ = không chứa cụm bắt buộc)

### `lưu trữ` — 975 kết quả
- ✓ Tuyển tập những bài công bố, giới thiệu tài liệu lưu trữ của trung tâm lưu trữ quốc gia I
- ✓ Giới thiệu các nguồn tài liệu lưu trữ về đảo Cô Tô (Qua khảo sát tại trung tâm lưu trữ quốc gai I, Trung tâm lưu trữ quốc gai III, Cục lưu trữ văn phòng trung ương Đảng và Ủy ban nhân dân huyện Cô Tô
- ✓ Phát huy giá trị tài liệu lưu trữ về địa phương tại các lưu trữ lịch sử (Qua khảo sát tại Trung tâm lưu trữ Quốc gia I và Trung tâm lưu trữ Quốc gia III)
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Giáo dục Việt Nam thời kỳ thuộc địa qua tài liệu và tài liệu lưu trữ

### `văn bản` — 307 kết quả
- ✓ Nghiên cứu thực trạng và giải pháp về soạn thảo văn bản và ban hành văn bản để nâng cao hiệu quả lãnh đạo và chất lượng hồ sơ phông lưu trữ của tỉnh, thành ủy trực thuộc TW
- ✓ Những vấn đề cơ bản về văn bản học
- ✓ Luật Ban hành văn bản quy phạm pháp luật và các văn bản hướng dẫn thi hành
- ✓ Soạn thảo văn bản và công tác văn thư - lưu trữ (Những văn bản chỉ đạo, quy định và hướng dẫn chủ yếu)
- ✓ Xây dựng, ban hành, quản lý văn bản và công tác lưu trữ, ( các văn bản quy định, hướng dân chủ yếu của Đảng và Nhà nước)

### `hồ sơ` — 184 kết quả
- ✓ Lập hồ sơ và nộp lưu hồ sơ vào lưu trữ tại cơ quan TW Hội liên hiệp Phụ nữ VN
- ✓ Nghiên cứu xây dựng danh mục hồ sơ và quản lý hồ sơ điện tử ĐH Hải Phòng
- ✓ T/h về pp viết tiêu Đề hồ sơ trong ctác lập hồ sơ ở Bộ y tế
- ✓ Công tác lập hồ sơ và nộp lưu hồ sơ, tài liệu vào LT CQ - Thực trạng và giải pháp
- ✓ Nghiên cứu xây dựng danh mục hồ sơ và xác định Danh mục tài liệu trong một số hồ sơ của ngân hàng nhà nước Việt Nam

### `lịch sử` — 244 kết quả
- ✓ Sử dụng nguồn tài liệu Lịch sử Quân sự về cuộc kháng chiến chống Mỹ cứu nước (1945-1975) ở Viện Lịch sử Quân sự Việt Nam
- ✓ 20 năm Tạp chí Lịch sử quân sử - Tổng mục lục (1982 - 2002)
- ✓ Tổ chức và sử dụng tư liệu tại Viện Lịch sử Đảng phục vụ nghiên cứu lịch sử
- ✓ Tổ chức và sử dụng tư liệu tại Viện lịch sử Đảng phục vụ nghiên cứu lịch sử
- ✓ Lịch sử Quân sự Việt Nam Tập 1 Buổi đầu giữ nước Thời Hùng Vương - An Dương Vương

### `thủ tục hành chính` — 81 kết quả
- ✓ Một số văn bản pháp luật về quản lý hành chính, cải cách thủ tục hành chính trong cơ quan nhà nước và tổ chức chính trị - xã hội
- ✓ Tìm hiểu tình hình triển khai và thực hiện cải cách thủ tục hành chính theo quy chế một cửa tại bộ phận tiếp nhận hồ sơ và trả kết quả giải quyết thủ tục hành chính tại UBND quận Thanh Xuân
- ✓ Bước Đầu tìm hiểu một số cải cách thủ tục hành chính ở UBND phường Nhân Chính
- ✓ Cải cách thủ tục hành chính trong quản lý thu thuế tại Cục thuế Lạng Sơn
- ✓ Cải cách thủ tục hành chính theo mô hình "một cửa" trong việc làm thủ tục cho tàu xuất nhập cảnh tại Cảng vụ Hải Phòng

### `văn hóa doanh nghiệp` — 90 kết quả
- ✓ Nghiên cứu trách nhiệm của văn phòng trong việc tổ chức thực hiện văn hóa doanh nghiệp tại công ty cổ phần nhiệt điện Phả Lại (Hải Dương)
- ✓ Nghiên cứu trách nhiệm của văn phòng trong việc ; tổ chức thực hiện văn hóa doanh nghiệp tại Công; ty Cổ phần kiến trúc không gian Việt
- ✓ Vai trò của văn phòng trong việc xây dựng và phát triển văn hóa doanh nghiệp tại Công ty cổ phần Dược phẩm Pharmacity (Chi nhánh Hà Nội
- ✓ Vai trò và trách nhiệm của văn phòng trong việc xây dựng và phát triển văn hóa doanh nghiệp tại Công ty Cổ phần Thương mại LiiQii M
- ✓ Trách nhiệm của văn phòng trong xây dựng và tổ chức thực hiện văn hóa doanh nghiệp của công ty CP tập đoàn SCI

### `bảo quản tài liệu` — 173 kết quả
- ✓ Bước Đầu nghiên cứu Định thời hạn bảo quản tài liệu quản lý Đấu thầu tại EVN
- ✗ Cơ sở lý luận và thực tiễn xác Định thời hạn bảo quản cho tài liệu quản lý Đấu thầu tại EVN
- ✓ Xây dựng bảng thời hạn bảo quản tài liệu Lưu trữ địa chính tại Ủy ban nhân dân phường Thượng Cát Quận Bắc Từu Liêm, Hà Nội
- ✗ Thực trạng tài liệu được bảo quản tại lưu trữ quận
- ✓ Giải pháp bảo quản tài liệu tại Trung tâm lưu trữ lịch sử thành phố Hà Nội

### `Hồ Chí Minh` — 79 kết quả
- ✓ Di tích của Chủ tịch Hồ Chí Minh Ánh sáng của trí tuệ và niềm tin
- ✓ Chủ tịch Hồ Chí Minh
- ✓ Những tên gọi, bí danh, bút danh của Chủ tịch Hồ Chí Minh
- ✓ Sưu tầm, khai thác sử dụng hiện vật, tài liệu lưu trữ của Chủ tịch Hồ Chí Minh tại Bảo tàng Hồ Chí Minh
- ✓ Hoạt động lưu trữ tài liệu của Hổ Chí Minh tại bảo tàng Hồ Chí Minh

### `luu tru` — 975 kết quả
- ✓ Tuyển tập những bài công bố, giới thiệu tài liệu lưu trữ của trung tâm lưu trữ quốc gia I
- ✓ Giới thiệu các nguồn tài liệu lưu trữ về đảo Cô Tô (Qua khảo sát tại trung tâm lưu trữ quốc gai I, Trung tâm lưu trữ quốc gai III, Cục lưu trữ văn phòng trung ương Đảng và Ủy ban nhân dân huyện Cô Tô
- ✓ Phát huy giá trị tài liệu lưu trữ về địa phương tại các lưu trữ lịch sử (Qua khảo sát tại Trung tâm lưu trữ Quốc gia I và Trung tâm lưu trữ Quốc gia III)
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Giáo dục Việt Nam thời kỳ thuộc địa qua tài liệu và tài liệu lưu trữ

### `van thu` — 458 kết quả
- ✓ Hiện đại hóa công tác văn thư - lưu trữ tại Chi cục văn thư - lưu trữ Tp.Hà Nội
- ✓ Áp dụng hệ thống quản lý chất lượng theo tiêu chuẩn TCVN ISO 9001:2000 trong công tác văn thư lưu trữ
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Hoạt động hướng dẫn, kiểm tra công tác văn thư - lưu trữ của chi cục văn thư lưu trữ Thành phố Hà Nội
- ✓ 45 năm hoạt động khoa học công nghệ trong công tác văn thư, lưu trữ

### `quan tri van phong` — 269 kết quả
- ✓ Ứng dụng mô hình SWOT vào việc định vị bản thân cho sinh viên ngành Quản trị văn phòng, Khoa Lưu trữ học và Quản trị văn phòng, trường Đại học Khoa học Xã hội và Nhân văn, DdaHQGHN trong thời kỳ hội nhập
- ✓ Ảnh hưởng dịch bệnh COVID 19 đến quá trình thực tập của SV năm 4 nhóm ngành quản lí: quản trị văn phòng, khoa học quản lí, quản trị du lịch và lữ hành trường ĐH KHXHNV ĐHQG HN
- ✓ Kỷ yếu hội thảo khoa học Lưu trữ học và Quản trị văn phòng
- ✓ Vận dụng lí thuyết quản trị trong quản trị văn phòng (qua khảo sát tại một số doanh nghiệp hoạt động trong lĩnh vực lưu trữ tại Hà Nội)
- ✓ Kỷ yếu khoa học nâng cao chất lượng đào tạo ngành quản trị văn phòng đáp ứng yêu cầu thực tiễn

### `cai cach hanh chinh` — 208 kết quả
- ✓ Cải cách hành chính ở Trung Quốc Đặt trong sự so sánh với cải cách hành chính ở VN
- ✗ Một số văn bản pháp luật về quản lý hành chính, cải cách thủ tục hành chính trong cơ quan nhà nước và tổ chức chính trị - xã hội
- ✓ Cải cách hành chính trong lĩnh vực phân chia Đơn vị hành chính thời Minh Mệnh (1820 - 1840)
- ✓ Cải cách hành chính theo mô hình "một cửa" tại sở nội vụ Tỉnh Hà Tĩnh
- ✓ Cải cách hành chính theo cơ chế một cửa ở UBND huyện Khoái Châu - Hưng Yên

### `tai lieu anh` — 737 kết quả
- ✓ Khai thác, sử dụng tài liệu ảnh lưu trữ tại Phòng Tư liệu ảnh Thông tấn xã Việt Nam
- ✓ Tổ chức khoa học tài liệu ảnh tại kho Lưu trữ Trung Ương Đảng
- ✓ Tổ chức khoa học tài liệu ảnh tại kho Lưu trữ Trung Ương Đảng
- ✓ Phát huy giá trị tài liệu ảnh tại trung tâm lưu trữ; quốc gia III
- ✓ Ứng dụng công nghệ thông tin để khôi phục hình ảnh ban đầu của tài liệu ảnh trong các kho lưu trữ

### `lu tru` — 929 kết quả
- ✓ Thu thập và bổ sung tài liệu lưu trữ vào Chi cục văn thư lư trữ tỉnh Phú Thọ. Thực trạng và giải pháp
- ✗ Số hóa tài liệu lư trữ phim điện ảnh tại Việt Nam - Thực trạng và khuynh hướng
- ✓ Giá trị và vấn đề tổ chức lựa chọn, lưu trữ, lưu giữ, sử dụng tài liệu thuộc sở hữu của các gia đình nông dân
- ✓ Xác định nguồn và thành phần tài liệu nghe nhìn nộp lưu vào lưu trữ lịch sử tỉnh Thừa Thiên Huế
- ✓ Tổ chức, sử dụng tài liệu tại lưu trữ lịch sử Tỉnh Đồng Nai

### `luuu tru` — 930 kết quả
- ✓ XD công cụ tra tìm tra tìm Thông tin Sử liệu Kho lưu trữ trung ương Đảng Cộng sản Việt Nam
- ✓ Lưu trữ tài liệu truyền miệng qua nghiên cứu hồi ức của các cựu chiến binh trong chiến tranh Việt Nam giai đoạn 1954 - 1975
- ✓ Quản trị rủi ro trong lưu trữ (qua thực tế ở Việt Nam)
- ✓ Tổ chức hoạt động marketing tại các trung tâm lưu trữ quốc gia Việt Nam
- ✓ Nghiên cứu về tổ chức và quản lý lưu trữ tỉnh, thành phố trực thuộc trung ương

### `lưu trư` — 975 kết quả
- ✓ Tuyển tập những bài công bố, giới thiệu tài liệu lưu trữ của trung tâm lưu trữ quốc gia I
- ✓ Giới thiệu các nguồn tài liệu lưu trữ về đảo Cô Tô (Qua khảo sát tại trung tâm lưu trữ quốc gai I, Trung tâm lưu trữ quốc gai III, Cục lưu trữ văn phòng trung ương Đảng và Ủy ban nhân dân huyện Cô Tô
- ✓ Phát huy giá trị tài liệu lưu trữ về địa phương tại các lưu trữ lịch sử (Qua khảo sát tại Trung tâm lưu trữ Quốc gia I và Trung tâm lưu trữ Quốc gia III)
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Giáo dục Việt Nam thời kỳ thuộc địa qua tài liệu và tài liệu lưu trữ

### `vn thư` — 35 kết quả
- ✓ Những quy định hiện hành và việc thực hiện chính sách, chế độ đối với công chức văn thư - Lưu trữ trong cơ quan Nhà nước ở Vn, thực trạng và giải pháp
- ✓ Những quy định hiện hành và việc thực hiện chính sách, chế độ đối với công chức văn thư - Lưu trữ trong cơ quan Nhà nước ở Vn, thực trạng và giải pháp
- ✗ Số hóa tài liệu lưu trữ phim điện ảnh tại VN- Thực trạng và khuynh hướng(qua khảo sát thực tế ở viện phim VN và điện ảnh Quân đội nhân dân)
- ✗ Mối quan hệ giữa các cơ quan trong hệ thống chính trị VN
- ✗ Lưu trữ tài liệu khoa học tại thư viện khoa học xã hội việt nam thực trạng - giải pháp

### `van phogn` — 441 kết quả
- ✗ Tăng cường năng lực hoạt Động của văn phòg UBND huyện Vũ Thư - Thái Bình Đáp ứng yêu cầu cải cách hành chính Đến năm 2010
- ✓ Đảm bảo thông tin tư liệu của hệ thống quản lý tin học hoá hồ sơ cán bộ, công chức ở văn phòng Quốc hội
- ✓ Phương pháp thu thập, xử lý và cung cấp thông tin của chuyên viên tổng hợp văn phòng Bộ phục vụ hoạt động quản lý.
- ✓ Văn phong trong văn bản quản lý của ngân hàng nông nghiệp và phát triển nông thôn VN
- ✓ Công tác lập hồ sơ hiện hành ở văn phòng trung ương đảng - thực trạng và giải pháp

### `hành chín` — 227 kết quả
- ✓ Hoàn thiện hệ thống văn bản quản lý hành chính nhà nước ở cấp tỉnh, thành phố trực thuộc trung ương trong giai đoạn hiện nay
- ✓ Xác định giá trị tài liệu hành chính hình thành trong hoạt động của các công ty 100% vốn Nhà nước
- ✓ Cải cách thủ tục hồ sơ hành chính theo cơ chế "một cửa" tại UBND các quận của tp. Hà Nội
- ✓ Tổ chức quản lý hồ sơ hành chính ở UBND thành phố Ninh Bình - thực trạng và giải pháp
- ✓ PLT Ủy ban Kháng chiến hành chính Nam Bộ - một nguồn sử liệu về Nam bộ thời kháng chiến chống Pháp (1945-1954)

### `chinh ly tai leu` — 79 kết quả
- ✗ Tổ chức chỉnh lý khoa học tài liệu tài chính - kế toán tại Công ty Lưới điện cao thế Thành phố Hà Nội
- ✓ Quá trình khôi phục hồ sơ bằng phương pháp thẻ trong chỉnh lý tài liệu Ban Tài chính - Kế toán Tổng Công ty Điện lực Việt Nam
- ✓ Công tác lập hồ sơ trong chỉnh lý tài liệu của vụ tài chính kế toán thuộc phông lưu trữ Bộ Công nghiệp
- ✓ Chỉnh lý KHKT tài liệu Phông lưu trữ cơ quan Bộ (Qua thực tiễn chỉnh lý tài liệu phông Lưu trữ cơ quan BCN)
- ✓ Tình hình thu thập và chỉnh lý tài liệu lưu trữ tại một số Sở tại UBND Thành phố Hà Nội

### `cong tac van thuw` — 176 kết quả
- ✓ Quản lý công tác văn thư và công tác lưu trữ tại Bộ Công thương, thực trạng và giải pháp
- ✗ Những văn kiện chủ yếu của Đảng và Nhà nước về công tác công văn giấy tờ và công tác lưu trữ
- ✓ ứng dụng công nghệ tin học trong công tác văn thư tại Văn phòng Bộ Công nghiệp
- ✗ Một vài ý kiến về công tác công văn giấytờ và công tác LT ở Bộ Thương mại
- ✓ Vai trò của nghiệp vụ công tác văn thư trong công tác phòng chống tham nhũng trong các cơ quan hành chính nhà nước

### `học máy` — 11 kết quả
- ✗ Phương thức tổ chức hooajt động quản lý của bộ máy NN
- ✗ Cải cách hành chính ; Vấn đề cấp thiết để đổi mới bộ máy Nhà nước
- ✗ Văn hoá doanh nghiệp tại Tổng công ty cổ phền dệt may Hà Nội
- ✗ T/h 1 số vĐ c/cách bộ máy h/chính ở nước ta từ 1986 Đến nay
- ✗ Tìm hiểu bộ máy hành chính cấp TW ở VN qua quy Định của các bản Hiến pháp

### `hoc may` — 11 kết quả
- ✗ Phương thức tổ chức hooajt động quản lý của bộ máy NN
- ✗ Cải cách hành chính ; Vấn đề cấp thiết để đổi mới bộ máy Nhà nước
- ✗ Văn hoá doanh nghiệp tại Tổng công ty cổ phền dệt may Hà Nội
- ✗ T/h 1 số vĐ c/cách bộ máy h/chính ở nước ta từ 1986 Đến nay
- ✗ Tìm hiểu bộ máy hành chính cấp TW ở VN qua quy Định của các bản Hiến pháp

### `python` — 0 kết quả
- (không có)

### `trí tuệ nhân tạo` — 16 kết quả
- ✗ Thực trạng quản trị nhân sự tại Công ty TNHH Bảo hiểm Nhân thọ Aviva
- ✗ Giải pháp nâng cao hiệu quả Quản trị nhân sự văn thư, lưu trữ tại Tổng công ty Bảo Việt Nhân Thọ
- ✗ Nghiên cứu chế độ đãi ngộ đối với các vị trí nhân sự làm công tác văn phòng tại Công ty TNHH Bảo hiểm Nhân thọ AVIVA Việt Nam
- ✗ Hồi ức, ký ức, tài liệu lưu trữ về Việt Nam - Giá trị nhân văn nhìn từ nhiều phía (Bản tóm tắt)
- ✗ Quản trị nhân sự tại Công ty Tư vấn Xây dựng thuộc Tổng Công ty xây dựng và phát triển; hạ tâng Licogi - thực trạng và giải pháp

### `machine learning` — 0 kết quả
- (không có)

### `dữ liệu lớn` — 13 kết quả
- ✗ Nghiên cứu xây dựng va quản lý cơ sở dữ liệu tài liệu lưu trữ tại hội sở ngân hàng thương mại cổ phần quân đội
- ✗ Nghiên cứu xây dựng và quản lý cơ sở dữ liệu tài liệu lưu trữ tại hội sở ngân hàng thương mại cổ phần quân đội
- ✗ Nghiên cứu xây dựng va quản lý cơ sở dữ liệu tài liệu lưu trữ Sở quy hoạch kiến trúc Hà Nội
- ✗ Nghiên cứu xây dựng cơ sở dữ liệu tài liệu lưu trữ tại Tổng cục Thuế
- ✗ T/h quy trình xây dựng cơ sở dữ liệu tra tìm ; tài liệu trong các kho lưu trữ

### `học sâu` — 30 kết quả
- ✗ Cán bộ trẻ và học viên sau đại học năm học 2013-2014
- ✗ Chương trình đào tạo sau đại học khung chương trình
- ✗ Tìm hiểu kỹ năng tìm kiếm việc làm của sinh viên nói chung và sinh viên khuyết tật nói riêng sau khi tốt nghiệp đại học
- ✗ Tổ chức lưu trữ và khai thác sử dụng tài liệu nghiên cứu khoa học của viện Hàn lâm khoa học và công nghệ Việt Nam
- ✗ Giới thiệu về chính sách đối với học sinh miền Nam trong các trường học sinh Miền Nam trên đất Bắc giai đoạng 1954-1975 qua tài liệu lưu trữ tại trung tâm lưu trữ quốc gia III

### `blockchain` — 0 kết quả
- (không có)

### `an ninh mạng` — 1 kết quả
- ✗ Chuẩn hóa hoạt động văn phòng tại trung tâm Giáo dục Quốc phòng và An ninh, Đại học Quốc gia Hà Nội

### `mạng nơ ron` — 0 kết quả
- (không có)

### `công tác văn thư lưu trữ` — 295 kết quả
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Hiện đại hóa công tác văn thư - lưu trữ tại Chi cục văn thư - lưu trữ Tp.Hà Nội
- ✓ Áp dụng hệ thống quản lý chất lượng theo tiêu chuẩn TCVN ISO 9001:2000 trong công tác văn thư lưu trữ
- ✓ 45 năm hoạt động khoa học công nghệ trong công tác văn thư, lưu trữ
- ✓ Hoạt động hướng dẫn, kiểm tra công tác văn thư - lưu trữ của chi cục văn thư lưu trữ Thành phố Hà Nội

### `tài liệu lưu trữ` — 825 kết quả
- ✓ Phát huy giá trị tài liệu lưu trữ về địa phương tại các lưu trữ lịch sử (Qua khảo sát tại Trung tâm lưu trữ Quốc gia I và Trung tâm lưu trữ Quốc gia III)
- ✓ Giáo dục Việt Nam thời kỳ thuộc địa qua tài liệu và tài liệu lưu trữ
- ✓ Phát huy giá trị tài liệu lưu trữ qua mạng xã hội và đề một số giải pháp nhằm phát huy giá trị tài liệu lưu trữ tại Trung tâm Lưu trữ Quốc gia I
- ✓ Phát huy giá trị tài liệu lưu trữ trong các phòng lưu trữ cá nhân tại Trung tâm lưu trữ QG III
- ✓ Giải pháp sưu tầm tài liệu lưu trữ tại các lưu trữ ; lịch sử ở Việt Nam

### `chỉnh lý tài liệu` — 116 kết quả
- ✓ Chỉnh lý KHKT tài liệu Phông lưu trữ cơ quan Bộ (Qua thực tiễn chỉnh lý tài liệu phông Lưu trữ cơ quan BCN)
- ✗ Tổ chức chỉnh lý khoa học tài liệu tài chính - kế toán tại Công ty Lưới điện cao thế Thành phố Hà Nội
- ✓ Quá trình khôi phục hồ sơ bằng phương pháp thẻ trong chỉnh lý tài liệu Ban Tài chính - Kế toán Tổng Công ty Điện lực Việt Nam
- ✓ Công tác lập hồ sơ trong chỉnh lý tài liệu của vụ tài chính kế toán thuộc phông lưu trữ Bộ Công nghiệp
- ✓ Tình hình thu thập và chỉnh lý tài liệu lưu trữ tại một số Sở tại UBND Thành phố Hà Nội

### `bộ máy hành chính` — 25 kết quả
- ✓ Tìm hiểu bộ máy hành chính cấp TW ở VN qua quy Định của các bản Hiến pháp
- ✓ Quan và lại ở miền Bắc Việt Nam một bộ máy hành chính trước thử thách (1820-1918)
- ✗ Quá trình hình thành và tổ chức bộ máy quản lý hành chính thành phố Nam Định từ năm 1884 đến năm 1921
- ✗ Tìm hiểu việc ban hành quyết Định hành chính ; Bộ văn hoá thông tin hiện nay
- ✗ Quy trình soạn thảo, ban hành, quản lý VB hành chính ở Bộ Công nghiệp

### `ủy ban nhân dân` — 33 kết quả
- ✓ Dự án luật ban hành văn bản quy phạm pháp luật của Hội đồng nhân dân, Ủy ban nhân dân
- ✓ Hệ thống văn bản pháp luật về tổ chức Hội đông nhân dân và Ủy ban nhân dân
- ✓ Phông lưu trữ Hội đồng nhân dân và Ủy ban nhân dân tỉnh Thái Bình - nguồn sử liệu về lịch sử đấu tranh của nhân dân Thái Bình giai đoạn chống Pháp (1945 - 1954)
- ✓ Luật tổ chức Hội đồng nhân dân và Ủy ban nhân dân
- ✓ Quy trình ban hành văn bản quy phạm pháp luật của Ủy ban nhân dân quận Thanh Xuân

### `lưu trữ hồ sơ` — 152 kết quả
- ✓ Lập hồ sơ và nộp lưu hồ sơ vào lưu trữ tại cơ quan TW Hội liên hiệp Phụ nữ VN
- ✓ Vấn đề lập hồ sơ hiện hành và nộp lưu hồ sơ tài liệu vào lưu trữ cơ quan Bộ- thực trạng và giải pháp
- ✓ Vấn đề lập hồ sơ hiện hành và nộp lưu hồ sơ tài liệu vào lưu trữ cơ quan Bộ- thực trạng và giải pháp
- ✓ Công tác quảnlý văn bản và lưu trữ hồ sơ tài liệu ở một số doanh nghiệp 100% vốn nước ngoài
- ✓ Công tác lưu trữ hồ sơ cấp giấy chứng nhận quyền sở hữu nhà ở và quyền sử dụng đất ở cùng tài sản gắn liền với đất

### `hồ sơ lưu trữ` — 152 kết quả
- ✓ Lập hồ sơ và nộp lưu hồ sơ vào lưu trữ tại cơ quan TW Hội liên hiệp Phụ nữ VN
- ✓ Vấn đề lập hồ sơ hiện hành và nộp lưu hồ sơ tài liệu vào lưu trữ cơ quan Bộ- thực trạng và giải pháp
- ✓ Vấn đề lập hồ sơ hiện hành và nộp lưu hồ sơ tài liệu vào lưu trữ cơ quan Bộ- thực trạng và giải pháp
- ✓ Công tác quảnlý văn bản và lưu trữ hồ sơ tài liệu ở một số doanh nghiệp 100% vốn nước ngoài
- ✓ Công tác lưu trữ hồ sơ cấp giấy chứng nhận quyền sở hữu nhà ở và quyền sử dụng đất ở cùng tài sản gắn liền với đất
