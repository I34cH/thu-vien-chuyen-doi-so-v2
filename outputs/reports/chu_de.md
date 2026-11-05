# Chủ đề tư liệu (KMeans trên TF-IDF tiêu đề đã tách từ)

- Số từ vựng TF-IDF (min_df = 2): **1490**; số tư liệu: **3400**.
- k chọn theo silhouette (cosine, mẫu 2.000 tư liệu, trên SVD 100 chiều): k=8: 0.095, k=9: 0.097, k=10: 0.095, k=11: 0.100, k=12: 0.108 → **k = 12**.
- Silhouette thấp là bình thường với tiêu đề ngắn: chủ đề chồng lấn nhau, coi là nhóm thô cho ThemeRiver.
- Nhãn tự động = 2–3 từ ghép nổi bật nhất của tâm cụm. Cụm kém tập trung (silhouette trung bình < 0 hoặc < 50% tư liệu chứa một trong 3 từ nổi bật đầu) nhận nhãn "Tổng hợp (nhiều chủ đề)".
- Nhãn thủ thư sửa tay (Quản lý › Chủ đề) lưu ở `chu_de_nhan_tay` theo chữ ký cụm (5 từ nổi bật đầu đã sắp xếp) và được áp lại sau mỗi lần gom cụm. Lần này: không có nhãn tay.

| id | Nhãn | Nhãn tự động | Số tư liệu | Silhouette TB | Phủ 3 từ đầu | Từ nổi bật | Mã vấn đề nổi bật | Loại hình chính |
|---:|---|---|---:|---:|---:|---|---|---|
| 11 | Tổng hợp (nhiều chủ đề) | Tổng hợp (nhiều chủ đề) | 903 | -0.055 | 19% | hà nội, tập, văn hóa, luật, tổ chức, cán bộ, vn, sinh viên | — | sach (328), bao_cao_kh (245) |
| 1 | lưu trữ, tài liệu, trung tâm | lưu trữ, tài liệu, trung tâm | 499 | 0.056 | 100% | lưu trữ, tài liệu, trung tâm, quốc gia, phông, khoa học, iii, xây dựng | PL | khoa_luan (170), bao_cao_kh (132) |
| 5 | công tác, quản lý, văn thư | công tác, quản lý, văn thư | 347 | 0.034 | 96% | công tác, quản lý, văn thư, lưu trữ, nhà nước, thông tin, tổ chức, bộ | VT, LT, CN | bao_cao_kh (121), khoa_luan (100) |
| 6 | văn phòng, quản trị, hoạt động | văn phòng, quản trị, hoạt động | 334 | 0.082 | 93% | văn phòng, quản trị, hoạt động, bộ, tổ chức, thư ký, ubnd, doanh nghiệp | QT, QTVP | bao_cao_kh (137), khoa_luan (81) |
| 8 | việt nam, lưu trữ, tập đoàn | việt nam, lưu trữ, tập đoàn | 290 | 0.102 | 100% | việt nam, lưu trữ, tập đoàn, tài liệu, bưu chính, khoa học, công tác, tổng công ty | — | sach (97), bao_cao_kh (73) |
| 10 | văn bản, quản lý, hệ thống | văn bản, quản lý, hệ thống | 200 | 0.167 | 94% | văn bản, quản lý, hệ thống, nhà nước, soạn thảo, hình thành, công tác, hoạt động | VB, VT | bao_cao_kh (79), sach (48) |
| 9 | công ty, cổ phần, văn phòng | công ty, cổ phần, văn phòng | 157 | 0.239 | 100% | công ty, cổ phần, tnhh, văn phòng, công tác, thương mại, văn hóa, doanh nghiệp | — | khoa_luan (75), bao_cao_kh (67) |
| 3 | toàn tập, văn kiện, hồ chí minh | toàn tập, văn kiện, hồ chí minh | 155 | 0.565 | 99% | toàn tập, tập, văn kiện, đảng, lê, nin, hồ chí minh, công bố | CB | tu_sach_tang (126), sach (23) |
| 2 | sử dụng, khai thác, tài liệu | sử dụng, khai thác, tài liệu | 145 | 0.303 | 99% | sử dụng, khai thác, tài liệu, tổ chức, lưu trữ, phục vụ, tllt, trung tâm | KS | khoa_luan (60), bao_cao_kh (40) |
| 7 | lịch sử, việt nam, lưu trữ | lịch sử, việt nam, lưu trữ | 140 | 0.276 | 100% | lịch sử, việt nam, lưu trữ, phổ thông, thế giới, tập, hà nội, tài liệu | LS | sach (73), tu_sach_tang (19) |
| 12 | đại học, nhân văn, xã hội | đại học, nhân văn, xã hội | 129 | 0.335 | 94% | đại học, trường, nhân văn, xã hội, khoa học, sinh viên, hà nội, đhqghn | — | bao_cao_kh (68), sach (27) |
| 4 | hành chính, cải cách, thủ tục | hành chính, cải cách, thủ tục | 101 | 0.383 | 91% | hành chính, cải cách, thủ tục, cửa, ubnd, nhà nước, cơ chế, quận | CC | bao_cao_kh (50), khoa_luan (24) |

## Ví dụ tiêu đề mỗi chủ đề (ngẫu nhiên, seed 42)

### 11. Tổng hợp (nhiều chủ đề)
- Khung hoảng tài chính toàn cầu: tác động và đối sách của VN
- Hiện Đại hoá lưut rữ Liên Đoàn Lao Động thành phố HN
- Nghiệp vụ thư ký giúp cho lãnh đạo các cơ quan, doanh nghiệp
- Cách mạng Tháng Tám xây dựng và củng cố chính quyền 1945-1946

### 1. lưu trữ, tài liệu, trung tâm
- Mô tả mô hình lưu trữ tài liệu tại viện lưu trữ Phật Pháp BERZIN
- Quản lí và phát huy giá trị tài liệu đạo sắc phong trên địa bàn thành phố Hà Nội
- Nghiên cứu, đề xuất giải pháp nhằm tối ưu hóa phông lưu trữ ủy ban nhân dân thành phố Hà Nội
- Phát huy giá trị tài liệu lưu trữ về hợp tác Việt Nam - Lào trong lĩnh vực giáo dục tại Trung tâm Lưu trữ QG III

### 5. công tác, quản lý, văn thư
- Công tác bảo hiểm tài liệu lưu trữ tại TTLTQG I và TTLTQG III
- Một vài ý kiến về công tác công văn giấytờ và công tác LT ở Bộ Thương mại
- Luật tiếp cận thông tin với công tác lưu trữ
- Xây dựng mô hình tổ chức, quản lý hoạt động lưu trữ cấp xã (qua khảo sát thực tế tại một số xã trên địa bàn tỉnh Nam Định)

### 6. văn phòng, quản trị, hoạt động
- Xây dựng văn phòng điện tử tại Bộ Tài chính
- Những giải pháp nhằm nâng cao hiệu quả làm việc của nhân viên văn phòng doanh nghiệp trong bối cảnh COVID 19 hiện nay
- Tổ chức và Điều hành hoạt Động của Văn phòng Ban Tuyên giáo Trung ương - Thực trạng và giải pháp
- Administrative Office Management - Edition 13 (Quản trị hành chính văn phòng)

### 8. việt nam, lưu trữ, tập đoàn
- Nghiên cứu xây dựng danh mục hồ sơ văn phòng ; Tổng công ty Bưu chính Việt Nam
- Sử dụng dịch vụ "lưu trữ đám mây" trong công tác lưu trữ tài liệu điện tử tại Việt Nam
- Hoạt động sưu tầm, quản lý tài liệu lưu trữ về các nhà khoa học tại trung tâm di sản các nhà khoa học Việt Nam
- Tổng luận các nghiên cứu về tài liệu điện tử trên Tạp chí Văn thư Lưu trữ Việt Nam giai đoạn 2010 - 2018

### 10. văn bản, quản lý, hệ thống
- Hệ thống văn bản chuyên môn hình thành trong quá trình hoạt động của kho bạc nhà nước
- Kỹ năng soạn thảo văn bản và thư từ thương mại
- hoàn thiện hệ thống văn bản quả lý nhà nước về công tác lưu trữ
- Văn bản pháp luật về quản lý học sinh sinh viên

### 9. công ty, cổ phần, văn phòng
- Quy trình tổ chức sự kiện tại công ty cổ phần VIMECO
- Công tác quản lý cơ sở vật chất qua khảo sát tại ; Công ty trách nhiệm hữu hạn LEGE Việt Nam
- Tổ chức khoa học hoạt động văn phòng tại Công ty Cổ phần Công nghệ Lưu trữ - Số hóa HT
- Chuẩn hóa hoạt động văn phòng tại công ty TNHH Eo Vina

### 3. toàn tập, văn kiện, hồ chí minh
- Lê - Nin toàn tập (tập 1)
- Văn kiện Đảng toàn tập (tập 35)
- Lê - Nin toàn tập (tập28)
- Văn kiện Đảng toàn tập (tập 33)

### 2. sử dụng, khai thác, tài liệu
- Tổ chức khai thác, sử dụng tư liệu, tài liệu lưu trữ phục vụ cho các hoạt động trưng bày của các bảo tàng
- Tổ chức khai thác và sử dụng tài liệu lưu trữ tại chi cục văn thư - lưu trữ tỉnh Bắc Giang
- Khai thác sử dụng tài liệu phục vụ cho việc giải quyết chế Độ chính sách Đối với những người có công với CM
- Một số nhận xét về qĐ sử dụng TL LT ở TT LTQG III

### 7. lịch sử, việt nam, lưu trữ
- Chữ trên đá, chữ trên đồng, minh văn và lịch sử
- Lịch sử Phú Quốc qua tài liệu lưu trữ
- Tóm tắt niên biểu lịch sử Việt Nam
- Lịch sử thế giới hiện đại từ 1945- 1995 Quyển B

### 12. đại học, nhân văn, xã hội
- Mô hình tổ chức văn phòng của Trường Đại học Kinh tế - ĐHQGHN
- Xây dựng tiêu chí đánh giá nghiên cứu khoa học nhóm ngành khoa học xã hội và nhân văn
- Tổ chức quản lí công tác văn thư tại trường đại học Kinh Tế - ĐHQGHN
- Ý thức tham gia giao thông của sinh viên trường đại học khoa học Xã hội và Nhân văn

### 4. hành chính, cải cách, thủ tục
- So sánh hành chính công - hành chính tư: Qua đó làm rõ những hoạt động kém hiệu quả của Doanh nghiệp Nhà nước qua một số bài báo trên mạng
- Thủ tục hành chính - Lý luận và thực tiễn
- Cải cách thủ tục hành chính trong lĩnh vực Đầu tư trực tiếp nước ngoài ở tỉnh phú thọ
- Vấn đề đào tạo cán bộ công chức ở cấp phưòng trong quá trình cải cách hành chính
