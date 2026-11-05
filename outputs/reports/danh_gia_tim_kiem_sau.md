# Đánh giá tìm kiếm — SAU

Sinh bởi `python -m pipeline.danh_gia_tim_kiem`. Cách chấm: xem docstring của script (liên quan = tiêu đề + tác giả chứa liền cụm bắt buộc sau khi bỏ dấu; G = số tư liệu liên quan trong kho).

**Đạt 41/41 truy vấn.** Gợi ý sửa đúng 41/41.

| Nhóm | Truy vấn | Tiêu chí | G | Số KQ | P@5 | Chính xác | Phủ | Gợi ý sửa | KQ chính xác | ms | Đạt |
|---|---|---|---:|---:|---:|---:|---:|---|---:|---:|:---:|
| gõ đúng | lưu trữ | chứa liền 'luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 973 | 973 | 1,00 | 1,00 | 1,00 | — | 973 | 5,0 | ✓ |
| gõ đúng | văn bản | chứa liền 'van ban' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 224 | 224 | 1,00 | 1,00 | 1,00 | — | 224 | 2,0 | ✓ |
| gõ đúng | hồ sơ | chứa liền 'ho so' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 126 | 126 | 1,00 | 1,00 | 1,00 | — | 126 | 1,1 | ✓ |
| gõ đúng | lịch sử | chứa liền 'lich su' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 205 | 205 | 1,00 | 1,00 | 1,00 | — | 205 | 1,2 | ✓ |
| gõ đúng | thủ tục hành chính | chứa liền 'thu tuc hanh chinh' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 31 | 31 | 1,00 | 1,00 | 1,00 | — | 31 | 0,7 | ✓ |
| gõ đúng | văn hóa doanh nghiệp | chứa liền 'van hoa doanh nghiep' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 21 | 21 | 1,00 | 1,00 | 1,00 | — | 21 | 1,1 | ✓ |
| gõ đúng | bảo quản tài liệu | chứa liền 'bao quan tai lieu' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 31 | 31 | 1,00 | 1,00 | 1,00 | — | 31 | 0,7 | ✓ |
| gõ đúng | Hồ Chí Minh | chứa liền 'ho chi minh' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 83 | 79 | 1,00 | 1,00 | 0,95 | — | 79 | 0,7 | ✓ |
| không dấu | luu tru | chứa liền 'luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 973 | 973 | 1,00 | 1,00 | 1,00 | — | 973 | 3,0 | ✓ |
| không dấu | van thu | chứa liền 'van thu' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 213 | 211 | 1,00 | 1,00 | 0,99 | — | 211 | 1,5 | ✓ |
| không dấu | quan tri van phong | chứa liền 'quan tri van phong' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 67 | 67 | 1,00 | 1,00 | 1,00 | — | 67 | 1,3 | ✓ |
| không dấu | cai cach hanh chinh | chứa liền 'cai cach hanh chinh' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 25 | 25 | 1,00 | 1,00 | 1,00 | — | 25 | 0,9 | ✓ |
| không dấu | tai lieu anh | chứa liền 'tai lieu anh' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 9 | 9 | 1,00 | 1,00 | 1,00 | — | 9 | 0,7 | ✓ |
| gõ sai nhẹ | lu tru | chứa liền 'luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 973 | 974 | 1,00 | 1,00 | 1,00 | lưu trữ | 2 | 9,4 | ✓ |
| gõ sai nhẹ | luuu tru | chứa liền 'luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 973 | 973 | 1,00 | 1,00 | 1,00 | lưu trữ | 0 | 6,1 | ✓ |
| gõ sai nhẹ | lưu trư | chứa liền 'luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 973 | 973 | 1,00 | 1,00 | 1,00 | — | 973 | 2,8 | ✓ |
| gõ sai nhẹ | vn thư | chứa liền 'van thu' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 213 | 211 | 1,00 | 1,00 | 0,99 | văn thư | 0 | 3,8 | ✓ |
| gõ sai nhẹ | van phogn | chứa liền 'van phong' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 465 | 465 | 1,00 | 1,00 | 1,00 | văn phòng | 0 | 4,5 | ✓ |
| gõ sai nhẹ | hành chín | chứa liền 'hanh chinh' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 213 | 212 | 1,00 | 1,00 | 1,00 | hành chính | 0 | 3,9 | ✓ |
| gõ sai nhẹ | chinh ly tai leu | chứa liền 'chinh ly tai lieu' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 10 | 10 | 1,00 | 1,00 | 1,00 | chỉnh lý tài liệu | 0 | 4,0 | ✓ |
| gõ sai nhẹ | cong tac van thuw | chứa liền 'cong tac van thu' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 104 | 103 | 1,00 | 1,00 | 0,99 | công tác văn thư | 0 | 4,1 | ✓ |
| gõ sai nhẹ | luu tur | chứa liền 'luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 973 | 973 | 1,00 | 1,00 | 1,00 | lưu trữ | 0 | 5,3 | ✓ |
| gõ sai nhẹ | lich us | chứa liền 'lich su' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 205 | 205 | 1,00 | 1,00 | 1,00 | lịch sử | 0 | 3,1 | ✓ |
| gõ sai nhẹ | con gty | chứa liền 'cong ty' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 231 | 231 | 1,00 | 1,00 | 1,00 | công ty | 0 | 3,6 | ✓ |
| không có trong kho | học máy | kho không có tư liệu chứa 'hoc may' → phải 0 kết quả | 0 | 0 | — | — | — | — | 0 | 3,0 | ✓ |
| không có trong kho | hoc may | kho không có tư liệu chứa 'hoc may' → phải 0 kết quả | 0 | 0 | — | — | — | — | 0 | 3,0 | ✓ |
| không có trong kho | python | kho không có tư liệu chứa 'python' → phải 0 kết quả | 0 | 0 | — | — | — | — | 0 | 1,8 | ✓ |
| không có trong kho | trí tuệ nhân tạo | kho không có tư liệu chứa 'tri tue nhan tao' → phải 0 kết quả | 0 | 0 | — | — | — | — | 0 | 3,4 | ✓ |
| không có trong kho | machine learning | kho không có tư liệu chứa 'machine learning' → phải 0 kết quả | 0 | 0 | — | — | — | — | 0 | 1,8 | ✓ |
| không có trong kho | dữ liệu lớn | kho không có tư liệu chứa 'du lieu lon' → phải 0 kết quả | 0 | 0 | — | — | — | — | 0 | 3,4 | ✓ |
| không có trong kho | học sâu | kho không có tư liệu chứa 'hoc sau' → phải 0 kết quả | 0 | 0 | — | — | — | — | 0 | 3,1 | ✓ |
| không có trong kho | blockchain | kho không có tư liệu chứa 'blockchain' → phải 0 kết quả | 0 | 0 | — | — | — | — | 0 | 1,1 | ✓ |
| không có trong kho | an ninh mạng | kho không có tư liệu chứa 'an ninh mang' → phải 0 kết quả | 0 | 0 | — | — | — | — | 0 | 3,7 | ✓ |
| không có trong kho | mạng nơ ron | kho không có tư liệu chứa 'mang no ron' → phải 0 kết quả | 0 | 0 | — | — | — | — | 0 | 3,5 | ✓ |
| nhiều âm tiết | công tác văn thư lưu trữ | chứa liền 'cong tac van thu luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 35 | 34 | 1,00 | 1,00 | 0,97 | — | 34 | 1,4 | ✓ |
| nhiều âm tiết | tài liệu lưu trữ | chứa liền 'tai lieu luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 304 | 304 | 1,00 | 1,00 | 1,00 | — | 304 | 2,2 | ✓ |
| nhiều âm tiết | chỉnh lý tài liệu | chứa liền 'chinh ly tai lieu' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 10 | 10 | 1,00 | 1,00 | 1,00 | — | 10 | 0,7 | ✓ |
| nhiều âm tiết | bộ máy hành chính | chứa liền 'bo may hanh chinh' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 2 | 2 | 1,00 | 1,00 | 1,00 | — | 2 | 3,4 | ✓ |
| nhiều âm tiết | ủy ban nhân dân | chứa liền 'uy ban nhan dan' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 26 | 26 | 1,00 | 1,00 | 1,00 | — | 26 | 0,8 | ✓ |
| nhiều âm tiết | lưu trữ hồ sơ | chứa liền 'luu tru ho so' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 6 | 6 | 1,00 | 1,00 | 1,00 | — | 6 | 0,8 | ✓ |
| nhiều âm tiết | hồ sơ lưu trữ | chứa liền 'ho so luu tru' (bỏ dấu); top 5 đều chứa, chính xác & phủ ≥ 0,9 | 2 | 2 | 1,00 | 1,00 | 1,00 | — | 2 | 2,9 | ✓ |

## 5 kết quả đầu

(✓ = liên quan theo tiêu chí, ✗ = không chứa cụm bắt buộc)

### `lưu trữ` — 973 kết quả
- ✓ Tuyển tập những bài công bố, giới thiệu tài liệu lưu trữ của trung tâm lưu trữ quốc gia I
- ✓ Giới thiệu các nguồn tài liệu lưu trữ về đảo Cô Tô (Qua khảo sát tại trung tâm lưu trữ quốc gai I, Trung tâm lưu trữ quốc gai III, Cục lưu trữ văn phòng trung ương Đảng và Ủy ban nhân dân huyện Cô Tô
- ✓ Phát huy giá trị tài liệu lưu trữ về địa phương tại các lưu trữ lịch sử (Qua khảo sát tại Trung tâm lưu trữ Quốc gia I và Trung tâm lưu trữ Quốc gia III)
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Giáo dục Việt Nam thời kỳ thuộc địa qua tài liệu và tài liệu lưu trữ

### `văn bản` — 224 kết quả
- ✓ Nghiên cứu thực trạng và giải pháp về soạn thảo văn bản và ban hành văn bản để nâng cao hiệu quả lãnh đạo và chất lượng hồ sơ phông lưu trữ của tỉnh, thành ủy trực thuộc TW
- ✓ Những vấn đề cơ bản về văn bản học
- ✓ Luật Ban hành văn bản quy phạm pháp luật và các văn bản hướng dẫn thi hành
- ✓ Soạn thảo văn bản và công tác văn thư - lưu trữ (Những văn bản chỉ đạo, quy định và hướng dẫn chủ yếu)
- ✓ Xây dựng, ban hành, quản lý văn bản và công tác lưu trữ, ( các văn bản quy định, hướng dân chủ yếu của Đảng và Nhà nước)

### `hồ sơ` — 126 kết quả
- ✓ Lập hồ sơ và nộp lưu hồ sơ vào lưu trữ tại cơ quan TW Hội liên hiệp Phụ nữ VN
- ✓ Nghiên cứu xây dựng danh mục hồ sơ và quản lý hồ sơ điện tử ĐH Hải Phòng
- ✓ T/h về pp viết tiêu Đề hồ sơ trong ctác lập hồ sơ ở Bộ y tế
- ✓ Công tác lập hồ sơ và nộp lưu hồ sơ, tài liệu vào LT CQ - Thực trạng và giải pháp
- ✓ Nghiên cứu xây dựng danh mục hồ sơ và xác định Danh mục tài liệu trong một số hồ sơ của ngân hàng nhà nước Việt Nam

### `lịch sử` — 205 kết quả
- ✓ Sử dụng nguồn tài liệu Lịch sử Quân sự về cuộc kháng chiến chống Mỹ cứu nước (1945-1975) ở Viện Lịch sử Quân sự Việt Nam
- ✓ 20 năm Tạp chí Lịch sử quân sử - Tổng mục lục (1982 - 2002)
- ✓ Tổ chức và sử dụng tư liệu tại Viện Lịch sử Đảng phục vụ nghiên cứu lịch sử
- ✓ Tổ chức và sử dụng tư liệu tại Viện lịch sử Đảng phục vụ nghiên cứu lịch sử
- ✓ Lịch sử Quân sự Việt Nam Tập 1 Buổi đầu giữ nước Thời Hùng Vương - An Dương Vương

### `thủ tục hành chính` — 31 kết quả
- ✓ Một số văn bản pháp luật về quản lý hành chính, cải cách thủ tục hành chính trong cơ quan nhà nước và tổ chức chính trị - xã hội
- ✓ Tìm hiểu tình hình triển khai và thực hiện cải cách thủ tục hành chính theo quy chế một cửa tại bộ phận tiếp nhận hồ sơ và trả kết quả giải quyết thủ tục hành chính tại UBND quận Thanh Xuân
- ✓ Bước Đầu tìm hiểu một số cải cách thủ tục hành chính ở UBND phường Nhân Chính
- ✓ Cải cách thủ tục hành chính trong quản lý thu thuế tại Cục thuế Lạng Sơn
- ✓ Cải cách thủ tục hành chính theo mô hình "một cửa" trong việc làm thủ tục cho tàu xuất nhập cảnh tại Cảng vụ Hải Phòng

### `văn hóa doanh nghiệp` — 21 kết quả
- ✓ Nghiên cứu trách nhiệm của văn phòng trong việc tổ chức thực hiện văn hóa doanh nghiệp tại công ty cổ phần nhiệt điện Phả Lại (Hải Dương)
- ✓ Nghiên cứu trách nhiệm của văn phòng trong việc ; tổ chức thực hiện văn hóa doanh nghiệp tại Công; ty Cổ phần kiến trúc không gian Việt
- ✓ Vai trò của văn phòng trong việc xây dựng và phát triển văn hóa doanh nghiệp tại Công ty cổ phần Dược phẩm Pharmacity (Chi nhánh Hà Nội
- ✓ Vai trò và trách nhiệm của văn phòng trong việc xây dựng và phát triển văn hóa doanh nghiệp tại Công ty Cổ phần Thương mại LiiQii M
- ✓ Trách nhiệm của văn phòng trong xây dựng và tổ chức thực hiện văn hóa doanh nghiệp của công ty CP tập đoàn SCI

### `bảo quản tài liệu` — 31 kết quả
- ✓ Bước Đầu nghiên cứu Định thời hạn bảo quản tài liệu quản lý Đấu thầu tại EVN
- ✓ Xây dựng bảng thời hạn bảo quản tài liệu Lưu trữ địa chính tại Ủy ban nhân dân phường Thượng Cát Quận Bắc Từu Liêm, Hà Nội
- ✓ Giải pháp bảo quản tài liệu tại Trung tâm lưu trữ lịch sử thành phố Hà Nội
- ✓ Công tác bảo quản tài liệu tại Chi cục văn thư lưu trữ tỉnh Thanh Hóa. Thực trạng và giải pháp
- ✓ Xây dựng bảng thời hạn bảo quản tài liệu ban quản lý các khu công nghiệp Bắc Ninh

### `Hồ Chí Minh` — 79 kết quả
- ✓ Di tích của Chủ tịch Hồ Chí Minh Ánh sáng của trí tuệ và niềm tin
- ✓ Chiến thắng Điện Biên Phủ và chiến trường Nam bộ
- ✓ Chủ tịch Hồ Chí Minh
- ✓ Những tên gọi, bí danh, bút danh của Chủ tịch Hồ Chí Minh
- ✓ Sưu tầm, khai thác sử dụng hiện vật, tài liệu lưu trữ của Chủ tịch Hồ Chí Minh tại Bảo tàng Hồ Chí Minh

### `luu tru` — 973 kết quả
- ✓ Tuyển tập những bài công bố, giới thiệu tài liệu lưu trữ của trung tâm lưu trữ quốc gia I
- ✓ Giới thiệu các nguồn tài liệu lưu trữ về đảo Cô Tô (Qua khảo sát tại trung tâm lưu trữ quốc gai I, Trung tâm lưu trữ quốc gai III, Cục lưu trữ văn phòng trung ương Đảng và Ủy ban nhân dân huyện Cô Tô
- ✓ Phát huy giá trị tài liệu lưu trữ về địa phương tại các lưu trữ lịch sử (Qua khảo sát tại Trung tâm lưu trữ Quốc gia I và Trung tâm lưu trữ Quốc gia III)
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Giáo dục Việt Nam thời kỳ thuộc địa qua tài liệu và tài liệu lưu trữ

### `van thu` — 211 kết quả
- ✓ Hiện đại hóa công tác văn thư - lưu trữ tại Chi cục văn thư - lưu trữ Tp.Hà Nội
- ✓ Áp dụng hệ thống quản lý chất lượng theo tiêu chuẩn TCVN ISO 9001:2000 trong công tác văn thư lưu trữ
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Hoạt động hướng dẫn, kiểm tra công tác văn thư - lưu trữ của chi cục văn thư lưu trữ Thành phố Hà Nội
- ✓ 45 năm hoạt động khoa học công nghệ trong công tác văn thư, lưu trữ

### `quan tri van phong` — 67 kết quả
- ✓ Ứng dụng mô hình SWOT vào việc định vị bản thân cho sinh viên ngành Quản trị văn phòng, Khoa Lưu trữ học và Quản trị văn phòng, trường Đại học Khoa học Xã hội và Nhân văn, DdaHQGHN trong thời kỳ hội nhập
- ✓ Ảnh hưởng dịch bệnh COVID 19 đến quá trình thực tập của SV năm 4 nhóm ngành quản lí: quản trị văn phòng, khoa học quản lí, quản trị du lịch và lữ hành trường ĐH KHXHNV ĐHQG HN
- ✓ Kỷ yếu hội thảo khoa học Lưu trữ học và Quản trị văn phòng
- ✓ Vận dụng lí thuyết quản trị trong quản trị văn phòng (qua khảo sát tại một số doanh nghiệp hoạt động trong lĩnh vực lưu trữ tại Hà Nội)
- ✓ Kỷ yếu khoa học nâng cao chất lượng đào tạo ngành quản trị văn phòng đáp ứng yêu cầu thực tiễn

### `cai cach hanh chinh` — 25 kết quả
- ✓ Cải cách hành chính ở Trung Quốc Đặt trong sự so sánh với cải cách hành chính ở VN
- ✓ Cải cách hành chính trong lĩnh vực phân chia Đơn vị hành chính thời Minh Mệnh (1820 - 1840)
- ✓ Cải cách hành chính theo mô hình "một cửa" tại sở nội vụ Tỉnh Hà Tĩnh
- ✓ Cải cách hành chính theo cơ chế một cửa ở UBND huyện Khoái Châu - Hưng Yên
- ✓ Công tác văn thư phục vụ cải cách hành chính tại UBND quận Thanh Xuân

### `tai lieu anh` — 9 kết quả
- ✓ Khai thác, sử dụng tài liệu ảnh lưu trữ tại Phòng Tư liệu ảnh Thông tấn xã Việt Nam
- ✓ Tổ chức khoa học tài liệu ảnh tại kho Lưu trữ Trung Ương Đảng
- ✓ Tổ chức khoa học tài liệu ảnh tại kho Lưu trữ Trung Ương Đảng
- ✓ Phát huy giá trị tài liệu ảnh tại trung tâm lưu trữ; quốc gia III
- ✓ Ứng dụng công nghệ thông tin để khôi phục hình ảnh ban đầu của tài liệu ảnh trong các kho lưu trữ

### `lu tru` — 974 kết quả
- ✓ Tuyển tập những bài công bố, giới thiệu tài liệu lưu trữ của trung tâm lưu trữ quốc gia I
- ✓ Giới thiệu các nguồn tài liệu lưu trữ về đảo Cô Tô (Qua khảo sát tại trung tâm lưu trữ quốc gai I, Trung tâm lưu trữ quốc gai III, Cục lưu trữ văn phòng trung ương Đảng và Ủy ban nhân dân huyện Cô Tô
- ✓ Phát huy giá trị tài liệu lưu trữ về địa phương tại các lưu trữ lịch sử (Qua khảo sát tại Trung tâm lưu trữ Quốc gia I và Trung tâm lưu trữ Quốc gia III)
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Giáo dục Việt Nam thời kỳ thuộc địa qua tài liệu và tài liệu lưu trữ

### `luuu tru` — 973 kết quả
- ✓ Tuyển tập những bài công bố, giới thiệu tài liệu lưu trữ của trung tâm lưu trữ quốc gia I
- ✓ Giới thiệu các nguồn tài liệu lưu trữ về đảo Cô Tô (Qua khảo sát tại trung tâm lưu trữ quốc gai I, Trung tâm lưu trữ quốc gai III, Cục lưu trữ văn phòng trung ương Đảng và Ủy ban nhân dân huyện Cô Tô
- ✓ Phát huy giá trị tài liệu lưu trữ về địa phương tại các lưu trữ lịch sử (Qua khảo sát tại Trung tâm lưu trữ Quốc gia I và Trung tâm lưu trữ Quốc gia III)
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Giáo dục Việt Nam thời kỳ thuộc địa qua tài liệu và tài liệu lưu trữ

### `lưu trư` — 973 kết quả
- ✓ Tuyển tập những bài công bố, giới thiệu tài liệu lưu trữ của trung tâm lưu trữ quốc gia I
- ✓ Giới thiệu các nguồn tài liệu lưu trữ về đảo Cô Tô (Qua khảo sát tại trung tâm lưu trữ quốc gai I, Trung tâm lưu trữ quốc gai III, Cục lưu trữ văn phòng trung ương Đảng và Ủy ban nhân dân huyện Cô Tô
- ✓ Phát huy giá trị tài liệu lưu trữ về địa phương tại các lưu trữ lịch sử (Qua khảo sát tại Trung tâm lưu trữ Quốc gia I và Trung tâm lưu trữ Quốc gia III)
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Giáo dục Việt Nam thời kỳ thuộc địa qua tài liệu và tài liệu lưu trữ

### `vn thư` — 211 kết quả
- ✓ Hiện đại hóa công tác văn thư - lưu trữ tại Chi cục văn thư - lưu trữ Tp.Hà Nội
- ✓ Áp dụng hệ thống quản lý chất lượng theo tiêu chuẩn TCVN ISO 9001:2000 trong công tác văn thư lưu trữ
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Hoạt động hướng dẫn, kiểm tra công tác văn thư - lưu trữ của chi cục văn thư lưu trữ Thành phố Hà Nội
- ✓ 45 năm hoạt động khoa học công nghệ trong công tác văn thư, lưu trữ

### `van phogn` — 465 kết quả
- ✓ Sổ tay tổ chức hành chính văn phòng dành cho Trưởng phòng tổ chức, chánh văn phòng Quy định mới nhất về nghiệp vụ hành chính văn phòng, hướng dẫn soạn thảo văn bản,diễn văn bài phát biểu dùng cho các sự kiện quan trọng
- ✓ Ảnh hưởng của phong cách lãnh đạo tới hoạt động của Văn phòng thông qua khỏa sát tại Văn phòng Bộ Nông nghiệp & Phát triển nông thôn
- ✓ Văn bản chỉ đạo hướng dẫn công tác văn phòng các cấp ủy địa phương
- ✓ Văn bản chỉ đạo hướng dẫn công tác văn phòng các cấp ủy địa phương
- ✓ Nghiệp vụ tổ chức hội họp của người thư kí văn phòng tại văn phòng ủy ban nhân dân huyện Thuận Thành - Bắc Ninh

### `hành chín` — 212 kết quả
- ✓ Một số văn bản pháp luật về quản lý hành chính, cải cách thủ tục hành chính trong cơ quan nhà nước và tổ chức chính trị - xã hội
- ✓ So sánh hành chính công - hành chính tư: Qua đó làm rõ những hoạt động kém hiệu quả của Doanh nghiệp Nhà nước qua một số bài báo trên mạng
- ✓ Giáo trình về Quản lý Nhà nước - Tập 2: Quản lý Hành chính Nhà nước
- ✓ 10 công việc chuyên viên trong quản lý hành chính nhà nước
- ✓ Tìm hiểu về thể chế nền hành chính của Nhà nước trong nền hành chính nước ta

### `chinh ly tai leu` — 10 kết quả
- ✓ Chỉnh lý KHKT tài liệu Phông lưu trữ cơ quan Bộ (Qua thực tiễn chỉnh lý tài liệu phông Lưu trữ cơ quan BCN)
- ✓ Quá trình khôi phục hồ sơ bằng phương pháp thẻ trong chỉnh lý tài liệu Ban Tài chính - Kế toán Tổng Công ty Điện lực Việt Nam
- ✓ Công tác lập hồ sơ trong chỉnh lý tài liệu của vụ tài chính kế toán thuộc phông lưu trữ Bộ Công nghiệp
- ✓ Tình hình thu thập và chỉnh lý tài liệu lưu trữ tại một số Sở tại UBND Thành phố Hà Nội
- ✓ Nghiên cứu ứng dụng công nghệ thông tin trong chỉnh lý tài liệu tại lưu trữ Hiện hành

### `cong tac van thuw` — 103 kết quả
- ✓ Quản lý công tác văn thư và công tác lưu trữ tại Bộ Công thương, thực trạng và giải pháp
- ✓ ứng dụng công nghệ tin học trong công tác văn thư tại Văn phòng Bộ Công nghiệp
- ✓ 45 năm hoạt động khoa học công nghệ trong công tác văn thư, lưu trữ
- ✓ Vai trò của nghiệp vụ công tác văn thư trong công tác phòng chống tham nhũng trong các cơ quan hành chính nhà nước
- ✓ Hệ thống văn bản và công tác văn thư lưu trữ trong một số công ty trách nhiệm hữu hạn

### `luu tur` — 973 kết quả
- ✓ Tuyển tập những bài công bố, giới thiệu tài liệu lưu trữ của trung tâm lưu trữ quốc gia I
- ✓ Giới thiệu các nguồn tài liệu lưu trữ về đảo Cô Tô (Qua khảo sát tại trung tâm lưu trữ quốc gai I, Trung tâm lưu trữ quốc gai III, Cục lưu trữ văn phòng trung ương Đảng và Ủy ban nhân dân huyện Cô Tô
- ✓ Phát huy giá trị tài liệu lưu trữ về địa phương tại các lưu trữ lịch sử (Qua khảo sát tại Trung tâm lưu trữ Quốc gia I và Trung tâm lưu trữ Quốc gia III)
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Giáo dục Việt Nam thời kỳ thuộc địa qua tài liệu và tài liệu lưu trữ

### `lich us` — 205 kết quả
- ✓ Sử dụng nguồn tài liệu Lịch sử Quân sự về cuộc kháng chiến chống Mỹ cứu nước (1945-1975) ở Viện Lịch sử Quân sự Việt Nam
- ✓ 20 năm Tạp chí Lịch sử quân sử - Tổng mục lục (1982 - 2002)
- ✓ Tổ chức và sử dụng tư liệu tại Viện Lịch sử Đảng phục vụ nghiên cứu lịch sử
- ✓ Tổ chức và sử dụng tư liệu tại Viện lịch sử Đảng phục vụ nghiên cứu lịch sử
- ✓ Lịch sử Quân sự Việt Nam Tập 1 Buổi đầu giữ nước Thời Hùng Vương - An Dương Vương

### `con gty` — 231 kết quả
- ✓ Thực trạng việc phân công lao động tại Văn phòng các Công ty trực thuộc Tổng Công ty Tư vấn Thiết kế GTVT
- ✓ Hệ thống văn bản hình thành trong Công ty Tư vấn Đầu tư Mỏ và Công nghiệp (ICMM) trực thuộc Công ty Than Việt Nam
- ✓ Thẩm quyền và biện pháp quản lý Nhà nước đối với hoạt động lưu trữ tại các công ty CP và công ty TNHH có sự góp vốn của Nhà nước
- ✓ Tổ chức quản lý công tác lưu trữ của các công ty cổ phần (Qua khảo sát một số công ty trên địa bàn thành phố Hà Nội)
- ✓ Quản trị nhân sự tại Công ty Tư vấn Xây dựng thuộc Tổng Công ty xây dựng và phát triển; hạ tâng Licogi - thực trạng và giải pháp

### `học máy` — 0 kết quả
- (không có)

### `hoc may` — 0 kết quả
- (không có)

### `python` — 0 kết quả
- (không có)

### `trí tuệ nhân tạo` — 0 kết quả
- (không có)

### `machine learning` — 0 kết quả
- (không có)

### `dữ liệu lớn` — 0 kết quả
- (không có)

### `học sâu` — 0 kết quả
- (không có)

### `blockchain` — 0 kết quả
- (không có)

### `an ninh mạng` — 0 kết quả
- (không có)

### `mạng nơ ron` — 0 kết quả
- (không có)

### `công tác văn thư lưu trữ` — 34 kết quả
- ✓ Số hóa tài liệu nền tảng hiện đại hóa công tác văn thư - Lưu trữ
- ✓ Hiện đại hóa công tác văn thư - lưu trữ tại Chi cục văn thư - lưu trữ Tp.Hà Nội
- ✓ Áp dụng hệ thống quản lý chất lượng theo tiêu chuẩn TCVN ISO 9001:2000 trong công tác văn thư lưu trữ
- ✓ 45 năm hoạt động khoa học công nghệ trong công tác văn thư, lưu trữ
- ✓ Hoạt động hướng dẫn, kiểm tra công tác văn thư - lưu trữ của chi cục văn thư lưu trữ Thành phố Hà Nội

### `tài liệu lưu trữ` — 304 kết quả
- ✓ Phát huy giá trị tài liệu lưu trữ về địa phương tại các lưu trữ lịch sử (Qua khảo sát tại Trung tâm lưu trữ Quốc gia I và Trung tâm lưu trữ Quốc gia III)
- ✓ Giáo dục Việt Nam thời kỳ thuộc địa qua tài liệu và tài liệu lưu trữ
- ✓ Phát huy giá trị tài liệu lưu trữ qua mạng xã hội và đề một số giải pháp nhằm phát huy giá trị tài liệu lưu trữ tại Trung tâm Lưu trữ Quốc gia I
- ✓ Phát huy giá trị tài liệu lưu trữ trong các phòng lưu trữ cá nhân tại Trung tâm lưu trữ QG III
- ✓ Giải pháp sưu tầm tài liệu lưu trữ tại các lưu trữ ; lịch sử ở Việt Nam

### `chỉnh lý tài liệu` — 10 kết quả
- ✓ Chỉnh lý KHKT tài liệu Phông lưu trữ cơ quan Bộ (Qua thực tiễn chỉnh lý tài liệu phông Lưu trữ cơ quan BCN)
- ✓ Quá trình khôi phục hồ sơ bằng phương pháp thẻ trong chỉnh lý tài liệu Ban Tài chính - Kế toán Tổng Công ty Điện lực Việt Nam
- ✓ Công tác lập hồ sơ trong chỉnh lý tài liệu của vụ tài chính kế toán thuộc phông lưu trữ Bộ Công nghiệp
- ✓ Tình hình thu thập và chỉnh lý tài liệu lưu trữ tại một số Sở tại UBND Thành phố Hà Nội
- ✓ Nghiên cứu ứng dụng công nghệ thông tin trong chỉnh lý tài liệu tại lưu trữ Hiện hành

### `bộ máy hành chính` — 2 kết quả
- ✓ Tìm hiểu bộ máy hành chính cấp TW ở VN qua quy Định của các bản Hiến pháp
- ✓ Quan và lại ở miền Bắc Việt Nam một bộ máy hành chính trước thử thách (1820-1918)

### `ủy ban nhân dân` — 26 kết quả
- ✓ Dự án luật ban hành văn bản quy phạm pháp luật của Hội đồng nhân dân, Ủy ban nhân dân
- ✓ Hệ thống văn bản pháp luật về tổ chức Hội đông nhân dân và Ủy ban nhân dân
- ✓ Phông lưu trữ Hội đồng nhân dân và Ủy ban nhân dân tỉnh Thái Bình - nguồn sử liệu về lịch sử đấu tranh của nhân dân Thái Bình giai đoạn chống Pháp (1945 - 1954)
- ✓ Luật tổ chức Hội đồng nhân dân và Ủy ban nhân dân
- ✓ Chiến thắng Điện Biên Phủ và chiến trường Nam bộ

### `lưu trữ hồ sơ` — 6 kết quả
- ✓ Công tác quảnlý văn bản và lưu trữ hồ sơ tài liệu ở một số doanh nghiệp 100% vốn nước ngoài
- ✓ Công tác lưu trữ hồ sơ cấp giấy chứng nhận quyền sở hữu nhà ở và quyền sử dụng đất ở cùng tài sản gắn liền với đất
- ✓ Tổ chức lưu trữ hồ sơ bệnh án quân nhân tại bệnh viện Trung ương quân đội 108
- ✓ Công tác lưu trữ hồ sơ đăng kí biến động đất đai tại văn phòng đăng kí nhà đất quận Hai Bà Trưng (TP Hà Nội) và văn phòng đăng kí quyền sử dụng đất huyện Giao Thủy (Nam Định)
- ✓ Lưu trữ hồ sơ Phủ Quốc vụ khanh đặc trách Văn hóa

### `hồ sơ lưu trữ` — 2 kết quả
- ✓ Quản lí hồ sơ lưu trữ tại văn phòng huyện ủy Lý Nhân
- ✓ Quản lí hồ sơ lưu trữ tại văn phòng huyện ủy Lý Nhân
