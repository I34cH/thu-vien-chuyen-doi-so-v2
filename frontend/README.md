# Frontend — Thư viện Khoa

React 18 + TypeScript (strict) + Vite + Tailwind CSS v4 + React Router + TanStack Query + ECharts.

## Chạy
```bash
npm install
npm run dev      # http://localhost:5173, proxy /api -> http://localhost:8000
npm run build    # kiểm tra kiểu + build
npm run test     # Vitest
```

Xem giao diện khi backend chưa chạy: `VITE_MOCK=1 npm run dev` (dữ liệu giả lập trong `src/api/mock.ts`, tắt mặc định, không vào bản build thường).

## Cấu trúc
- `src/index.css`: token thiết kế (màu, chữ, bo góc, bóng) trong `@theme` của Tailwind.
- `src/components/ui/`: Button, Card, Badge, Input, PageHeader, EmptyState.
- `src/components/layout/`: AppLayout (đầu trang, menu theo vai trò, menu tài khoản, chân trang, trạng thái máy chủ), RanhGioiLoi.
- `src/pages/`: TrangChu, TraCuu, ChiTiet, TaiKhoan, QuanLy (+ `quan-ly/`), Dashboard, KhongTimThay.
- `src/api/`: `types.ts` (kiểu theo docs/API.md), `endpoints.ts` (hàm gọi), `client.ts` (fetch JSON, cookie), `mock.ts` (giả lập).
- `src/components/`: `search/SearchBox` (combobox gợi ý), `tai-lieu/`, `auth/YeuCauVaiTro`, `dashboard/` (ECharts, WordCloud bằng d3-cloud).
- `src/lib/echarts.ts`: ECharts nạp theo phần + bảng màu biểu đồ (đã kiểm tra bằng validator của skill dataviz).
