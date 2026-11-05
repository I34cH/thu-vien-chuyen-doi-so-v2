# Sơ đồ thiết kế hệ thống v2 (đã cập nhật theo bản cài đặt, chặng 6)

Các file `.mmd` là nguồn (Mermaid). Ảnh SVG và PNG xuất ra `outputs/diagrams/` (không commit). Xuất lại bằng:

```
npx -y @mermaid-js/mermaid-cli@11 -i docs/diagrams/<tên>.mmd -o outputs/diagrams/<tên>.svg -b white -s 2
npx -y @mermaid-js/mermaid-cli@11 -i docs/diagrams/<tên>.mmd -o outputs/diagrams/<tên>.png -b white -s 2
```
(`scripts/kiem_tra_toan_bo.*` xuất cả 7 sơ đồ). Lưu ý khi sửa sơ đồ tuần tự: dấu `;` trong chữ của mũi tên làm Mermaid lỗi cú pháp.

| File | Loại sơ đồ | Mục đích |
|---|---|---|
| `01_kien_truc.mmd` | flowchart | Kiến trúc v2: React SPA (ECharts, d3-cloud), FastAPI (auth, tra cứu, mượn, quản lý, thống kê), PostgreSQL (unaccent, pg_trgm, hàm `tim_tai_lieu`, `goi_y_sua_cum`), pipeline (ETL Excel, tách từ pyvi, TF-IDF + KMeans bằng scikit-learn, sinh dữ liệu mô phỏng, `pipeline.reset`) và thư mục bản mềm PDF. |
| `02_erd.mmd` | erDiagram | CSDL v2: 6 bảng của v1, thêm `luot_doc`, `tai_lieu_tuong_tu`, `chu_de` (12 chủ đề KMeans), `cum_tu` (từ vựng sửa lỗi gõ); cột mới `tai_lieu.chu_de_id`, `log_tim_kiem.tu_khoa_quy_ve`. `ma_van_de.ten` cho phép NULL. |
| `03_use_case.mmd` | flowchart | Use case: tác nhân Khách, Người dùng, Thủ thư và các chức năng, gồm gợi ý sửa lỗi gõ, lọc chéo, ThemeRiver, đồ thị mượn cùng nhau, bảng nên số hóa và điểm lan tỏa, sửa nhãn chủ đề. |
| `04_tuan_tu_tim_kiem.mmd` | sequenceDiagram | Luồng gõ, gợi ý, tìm 3 tầng (`tim_tai_lieu`), gợi ý sửa lỗi (`goi_y_sua_cum`), ghi `log_tim_kiem` (trigger điền `tu_khoa_quy_ve`), rồi ghi tư liệu được chọn qua `log_id`. |
| `05_tuan_tu_muon.mmd` | sequenceDiagram | Luồng mượn: đăng ký, chờ duyệt, thủ thư duyệt trong transaction có khóa bản sao (409 khi hết), đang mượn, trả. |
| `06_tuan_tu_so_hoa.mmd` | sequenceDiagram | Vòng lặp số hóa: bảng nên số hóa (điểm có thêm điểm lan tỏa), tải PDF, tư liệu rời bảng, bạn đọc đọc bản mềm (ghi `luot_doc`), lượt đọc cộng điểm lan tỏa cho tư liệu tương tự ở vòng sau. |
| `07_trang_thai_luot_muon.mmd` | stateDiagram-v2 | Trạng thái lượt mượn: cho_duyet, dang_muon, da_tra, tu_choi. Quá hạn là cờ `qua_han` tính khi đọc, không phải trạng thái lưu. |

Câu hỏi mở của chặng 0 (lượt đọc có vào điểm "nên số hóa" hay không) đã chốt ở chặng 5: lượt đọc của bản mềm cộng **điểm lan tỏa** cho các tư liệu tương tự chưa số hóa; tư liệu đã số hóa vẫn không quay lại bảng (xem `06_tuan_tu_so_hoa.mmd`).
