# Tiến độ v2 (cập nhật 06/11/2026, sau đợt sửa cuối)

| Chặng | Trạng thái | Kiểm chứng gần nhất |
|---|---|---|
| 0. Nền tảng | ✅ Xong | `/api/health` 200; sơ đồ: 7 file Mermaid → `outputs/diagrams/*.svg` |
| 1–2. Dữ liệu + API lõi | ✅ Xong | `python -m pipeline.reset` (~17 giây): 3.400 tư liệu, 8.000 log, 400 lượt mượn, 1.500 lượt đọc |
| 3. Giao diện hoàn chỉnh | ✅ Xong | Frontend 30/30 test, lint và build sạch; đã xem trên trình duyệt ở 1440px và 375px |
| 4. Tìm kiếm nâng cao | ✅ Xong | Bộ ca đánh giá 10/38 → 37/38; "học máy" 0 kết quả; backend 53/53 test |
| 5. Trực quan hóa mở rộng | ✅ Xong | ThemeRiver, đồ thị mượn cùng nhau, điểm lan tỏa, tab sửa nhãn chủ đề; backend 60 test, frontend 43 test |
| 6. Hoàn thiện | ✅ Xong | `scripts/kiem_tra_toan_bo.ps1` (và `.sh`) chạy hết, kết quả chung ĐẠT: pytest 60 pass, vitest 43 pass, build sạch, Playwright E2E 26 pass (1 bước đánh dấu lỗi đã biết), 44 ảnh, 7 sơ đồ SVG và PNG |
| 7. Đợt sửa cuối (quyết định của người dùng) | ✅ Xong | Migration 0004; `scripts/kiem_tra_toan_bo.ps1` ĐẠT: pytest 63, vitest 46, E2E 27 (không còn `test.fail`, không bỏ qua lỗi console nào), 45 ảnh, 7 sơ đồ; bộ ca tìm kiếm 41/41 |

## Kết quả kiểm chứng đợt sửa cuối (`scripts/kiem_tra_toan_bo.ps1`, chạy 05/11/2026 trên máy dev)
| Bước | Kết quả | Giây | Chi tiết |
|---|---|---:|---|
| 1_reset_dau | Đạt | 19 | migrate 0.5, etl 1.8, tach_tu 3.2, tuong_tu 3.2, seed 8.4, tổng 17.1 |
| 2_pytest | Đạt | 9 | 63 passed |
| 3_vitest | Đạt | 5 | 46 passed |
| 4_build | Đạt | 2 | `tsc -b` + `vite build` |
| 5_chup_anh | Đạt | 81 | 3 passed; 45 PNG (khach 18, nguoi_dung 4, thu_thu 12, dashboard 11) |
| 6_e2e | Đạt | 47 | 27 passed |
| 7_so_do | Đạt | 43 | 7 SVG + 7 PNG |
| 8_reset_cuoi | Đạt | 19 | CSDL sạch, revision 0004, 0 nhãn sửa tay |

Nhật ký từng bước: `outputs/reports/kiem_tra/*.log`. E2E ghi vào CSDL (mượn, duyệt, số hóa, sửa rồi khôi phục một nhãn chủ đề), nên script reset ở cuối.

### Thay đổi của đợt sửa cuối
1. **Tìm kiếm** (migration `0004`): bỏ tầng 2 (khớp đủ các từ ghép); `tim_tai_lieu` = khớp cụm liền + sửa lỗi gõ; hàm mới `tim_tai_lieu_chinh_xac`; downgrade về hành vi 0003 (đã thử downgrade 0003 rồi upgrade lại). Bộ ca `pipeline/danh_gia_tim_kiem.py`: hai ca "lưu trữ hồ sơ"/"hồ sơ lưu trữ" đổi kỳ vọng sang chứa liền đúng cụm (chủ đích không khớp đảo thứ tự); kết quả 41/41 (`outputs/reports/danh_gia_tim_kiem_sau.md`), "bộ máy hành chính" nay đạt (2 kết quả, đều chứa liền cụm).
2. **Gõ sai**: `/tim-kiem` thêm `chinh_xac=1` và trường `da_sua`; trang tra cứu hiện "Đang hiện kết quả cho **lưu trữ**. Tìm chính xác “lu tru”", ở chế độ chính xác hỏi "Có phải bạn muốn tìm …?".
3. **Nhãn chủ đề**: cụm kém tập trung (silhouette TB < 0 hoặc < 50% tư liệu chứa một trong 3 từ nổi bật đầu) → "Tổng hợp (nhiều chủ đề)" (chỉ cụm 903 tư liệu: silhouette −0,055, phủ 19%). Nhãn tay lưu ở `chu_de_nhan_tay` theo chữ ký cụm, `pipeline.reset` sao lưu/nạp lại, `pipeline.tuong_tu` áp lại (đã thử: sửa nhãn → reset → nhãn còn, log "trùng chữ ký"). Cột `nhan_tu_dong`, `da_sua_tay`; API `POST /quan-ly/chu-de/{id}/khoi-phuc`; giao diện hiện nhãn gốc + nút khôi phục.
4. **Điểm lan tỏa** = Σ độ tương tự × ln(1 + lượt đọc). Top 10 "nên số hóa": trước có 3 tư liệu chỉ nhờ lan tỏa (lan tỏa lớn nhất 172,1), sau 0 (lan tỏa lớn nhất 4,9). Chi tiết `outputs/reports/lan_toa_truoc_sau.md`.
5. **Đồ thị mượn cùng nhau**: `nguong` ≥ 2 (400 nếu nhỏ hơn), thanh trượt từ 2.
6. **Hai lỗi đã biết đã sửa**: (a) `ChiTiet.tsx` mục tư liệu tương tự: `grid-cols-1` + `min-w-0` cho `li`, gỡ `test.fail` ở `e2e/tests/03_man_hinh.spec.ts`; (b) lỗi ECharts `translate(47.033 NaN)` do biểu đồ **lượt tìm theo ngày** (`BieuDoTheoNgay`): chuỗi nét đứt "đang cập nhật" có null ở đầu, hiệu ứng vẽ dần dời `endLabel` qua điểm null → y = NaN; tắt hiệu ứng riêng cho chuỗi này. Đã gỡ danh sách lỗi bỏ qua trong `e2e/tests/tro_giup.ts`; kiểm lại 7/30/90 ngày không còn lỗi console.

## Chạy
- Backend: `cd backend && .venv/Scripts/python -m uvicorn app.main:app --port 8000`
- Frontend: `cd frontend && npm run dev` → http://localhost:5173
- Dựng lại dữ liệu: `backend/.venv/Scripts/python -m pipeline.reset` (chạy từ thư mục gốc CK_v2)
- Test: `cd backend && .venv/Scripts/python -m pytest -q`; `cd frontend && npm run test`
- Tài khoản demo: `thuthu/thuthu123`, `sv01/sv123`, `gv01/gv123`

## Báo cáo kỹ thuật
Trong `outputs/reports/`:
- `chang4_tom_tat.md`
- `danh_gia_tim_kiem_*.md`
- `chu_de.md`
- `seed_tom_tat.md`
- `etl_*.csv`

## Quyết định của người dùng (06/11/2026)
1. **Tìm kiếm:** bỏ tầng 2 (khớp đủ các từ ghép); chỉ giữ khớp cụm liền và sửa lỗi gõ.
2. **Nhãn chủ đề** (chọn cách thông dụng):
   - Nhãn tự động lấy từ các từ nổi bật.
   - Cụm kém tập trung tự gán nhãn "Tổng hợp (nhiều chủ đề)".
   - Nhãn thủ thư sửa tay được lưu lại, không bị ghi đè khi chạy `pipeline.reset`.
3. **Khi gõ sai:** hiện kết quả của cụm đã sửa, kèm lối "Tìm chính xác …" để quay về cụm gốc (tham số `chinh_xac=1`).
4. **Chặng 5** (chọn cách hợp lý):
   - `diem_lan_toa` = Σ độ tương tự × ln(1 + lượt đọc).
   - Ngưỡng tối thiểu của đồ thị mượn cùng nhau là 2 bạn đọc chung.
5. **GitHub:** repo mới, public, lịch sử mới, chỉ đứng tên người dùng. Không đưa file Excel (có họ tên thật) và không đẩy lịch sử v1.

## Câu hỏi trước đây (đã trả lời bằng các quyết định trên)
1. Tầng 2 tìm kiếm → bỏ (quyết định 1, đã làm).
2. Nhóm tạp "hà nội, văn hóa, tổ chức" → nhãn "Tổng hợp (nhiều chủ đề)", nhãn tay được giữ (quyết định 2, đã làm).
3. Kết quả cụm đã sửa xếp trên → chấp nhận, kèm lối "Tìm chính xác" (quyết định 3, đã làm).
4. GitHub → quyết định 5 (chưa làm trong đợt này).

## Lưu ý kỹ thuật
- Không dùng `TRUNCATE ... CASCADE` trên bảng có khóa ngoại (chặng 4 từng xóa sạch CSDL vì lệnh này).
- Trên Git Bash, heredoc làm `\\` thành `\`: sửa file bằng Edit/Write.
- Dừng dev server bằng taskkill theo PID (TaskStop chỉ tắt shell, không tắt node).
