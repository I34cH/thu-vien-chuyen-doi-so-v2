# Kế hoạch v2 — Web thư viện chuyển đổi số

Ngày lập: 05/11/2026. Bản v1 (thư mục `../CK`) là bản demo đã chạy được; v2 làm lại từ đầu với cấu trúc rõ hơn, công cụ hiện đại hơn và thêm tính năng.

## 1. Mục tiêu
Giữ ý tưởng của v1: **dữ liệu tìm kiếm và mượn giúp thủ thư quyết định số hóa tư liệu nào trước**, với vòng lặp tìm → ghi log → dashboard → số hóa → dữ liệu cho vòng sau.

v2 khác v1 ở 4 điểm:
1. **Cấu trúc mã nguồn tách rõ** backend, frontend, pipeline dữ liệu, tài liệu. Mọi đầu ra sinh ra nằm ở một chỗ (`outputs/`).
2. **Công cụ hiện đại**: FastAPI, SQLAlchemy 2, Alembic, React, TypeScript, Vite, Tailwind, ECharts.
3. **Khép kín vòng lặp và trực quan hóa mở rộng**: đếm lượt đọc bản mềm, biểu đồ chủ đề theo thời gian (ThemeRiver), đồ thị tư liệu được mượn cùng nhau, bộ lọc tương tác trên dashboard.
4. **Tìm kiếm nâng cao**: gợi ý từ khóa khi gõ, tư liệu tương tự (TF-IDF), tách từ tiếng Việt, giảm khớp nhầm (ví dụ "học máy" ra 11 kết quả ở v1).

Kèm bộ **sơ đồ thiết kế hệ thống**: kiến trúc, ERD, use case, sơ đồ tuần tự, trạng thái lượt mượn.

## 2. Công nghệ
| Lớp | Công cụ |
|---|---|
| CSDL | PostgreSQL 18 (đã cài trên máy), extension `unaccent`, `pg_trgm` |
| Backend | Python 3.13, FastAPI, SQLAlchemy 2 (ORM), Alembic (migration), Pydantic v2, JWT trong cookie httpOnly, pytest |
| Pipeline dữ liệu | pandas, openpyxl (ETL), numpy + Faker (dữ liệu mô phỏng), scikit-learn (TF-IDF), thư viện tách từ tiếng Việt (chọn ở chặng 4) |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, ECharts (biểu đồ, ThemeRiver, đồ thị mạng, word cloud) |
| Kiểm thử | pytest (API), Vitest (frontend), Playwright (đầu cuối, chụp ảnh) |
| Sơ đồ | Mermaid trong `docs/diagrams/`, xuất ảnh vào `outputs/diagrams/` |

## 3. Cấu trúc thư mục
```text
CK_v2/
├── backend/            # FastAPI: app/ (api, core, models, schemas, services), alembic/, tests/
├── frontend/           # React + Vite + TS: src/ (pages, components, api, hooks), tests/
├── pipeline/           # ETL Excel, sinh dữ liệu mô phỏng, tính TF-IDF; chạy độc lập với web
├── data/               # Dữ liệu gốc (Excel danh mục), chỉ đọc
├── docs/               # Kế hoạch, đặc tả, sơ đồ Mermaid (diagrams/), quyết định thiết kế
├── outputs/            # MỌI đầu ra sinh tự động: reports/, screenshots/, diagrams/, exports/ (không commit)
├── scripts/            # Lệnh tiện ích: dev, reset dữ liệu, kiểm thử toàn bộ
├── .env.example
└── README.md
```

## 4. Chặng triển khai
Mỗi chặng có lệnh kiểm chứng. Chặng chỉ xong khi lệnh đó chạy đạt. Sau mỗi chặng, báo kết quả rồi chờ người dùng duyệt.

| Chặng | Nội dung | Kiểm chứng |
|---|---|---|
| **0. Nền tảng** | Cấu trúc thư mục, backend chạy được (`/api/health`), frontend chạy được, cấu hình env, `.gitignore`, sơ đồ kiến trúc bản nháp | Backend trả 200 ở `/api/health`; frontend build không lỗi; pytest và vitest chạy được |
| **1. Dữ liệu** | Model SQLAlchemy + migration Alembic (6 bảng của v1 + bảng lượt đọc + bảng giải nghĩa mã vấn đề); ETL Excel; sinh dữ liệu mô phỏng | Migration chạy từ đầu; ETL nạp 3.400 tư liệu như v1; seed chạy 2 lần cho cùng số dòng |
| **2. API lõi** | Đăng nhập, phân quyền 3 vai trò; tìm kiếm, gợi ý, chi tiết; mượn trả; tải và đọc bản mềm (ghi lượt đọc); API thống kê | pytest đủ các ca của v1 (401/403/409, luồng mượn, log) |
| **3. Giao diện lõi** | Các trang: trang chủ, tra cứu, chi tiết, tài khoản, quản lý, dashboard cơ bản | Playwright mở từng trang với 3 vai trò, không lỗi console |
| **4. Tìm kiếm nâng cao** | Gợi ý từ khóa khi gõ (từ log); tư liệu tương tự bằng TF-IDF; tách từ tiếng Việt; tinh chỉnh ngưỡng trigram | Bộ ca đánh giá tìm kiếm: "luu tru", "lu tru" vẫn ra; "học máy" không còn khớp nhầm; độ chính xác ghi vào `outputs/reports/` |
| **5. Trực quan hóa mở rộng** | Dashboard v2: word cloud, top từ khóa, theo ngày, 0 kết quả, nên số hóa (điểm có thêm lượt đọc), ThemeRiver chủ đề, đồ thị mượn cùng nhau, bộ lọc tương tác | Playwright: lọc trên một biểu đồ thì biểu đồ khác đổi theo; số liệu khớp SQL |
| **6. Hoàn thiện** | Sơ đồ đầy đủ, chụp ảnh, xuất số liệu, README và kịch bản demo | Một lệnh chạy lại toàn bộ: reset → test → chụp ảnh → xuất báo cáo, không lỗi |

## 5. Giữ lại từ v1
- Dữ liệu thật: `data/[Bản chuẩn] DANH MỤC TƯ LIỆU KHOA.xlsx`. Quy tắc làm sạch giữ như v1, kể cả mở rộng "ko có", "chưa có tài liệu".
- Quy tắc dữ liệu mô phỏng giữ như v1: seed 42, cờ `du_lieu_mau`, Zipf s = 1,1, cụm 2–3 âm tiết. Thêm lượt đọc bản mềm.
- Giao diện: màu chủ đạo đỏ và vàng kim như v1, nhưng dựng lại bằng React + Tailwind.
- Quy tắc riêng tư: dashboard chỉ hiện số tổng hợp; ảnh chụp phải làm mờ họ tên thật.

## 6. Câu hỏi còn mở (quyết định ở chặng tương ứng)
1. **Chủ đề cho ThemeRiver** (chặng 5): danh mục không có cột chủ đề; mã vấn đề chưa có giải nghĩa. Phương án: nhóm từ khóa theo cụm TF-IDF, hoặc người dùng cung cấp bảng giải nghĩa mã vấn đề.
2. **Thư viện tách từ tiếng Việt** (chặng 4): chọn sau khi thử trên dữ liệu thật (cân nhắc độ chính xác và dung lượng cài đặt).
3. **Đẩy lên GitHub**: repo `thu-vien-chuyen-doi-so` hiện là v1. v2 có thể là một nhánh mới, hoặc ghi đè `main`; hỏi người dùng trước khi đẩy.
