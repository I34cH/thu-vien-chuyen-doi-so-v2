// Cấu hình Playwright: bật cả backend (8000) và frontend (5173), dùng lại server nếu đã chạy.
// Hai dự án: "e2e" (kiểm thử đầu cuối) và "chup_anh" (chụp ảnh cho báo cáo). Chạy tuần tự vì dùng chung CSDL.
// Dữ liệu: các kịch bản ghi vào CSDL (đăng ký mượn, duyệt, số hóa). Chạy `pipeline.reset` trước mỗi lượt
// để kết quả lặp lại được (scripts/kiem_tra_toan_bo.* làm việc này).
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  outputDir: './test-results',
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'e2e', testMatch: /\d+_.*\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'chup_anh', testMatch: /chup_anh\.spec\.ts/, timeout: 240_000, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: [
    {
      command: '..\\backend\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --port 8000',
      cwd: '../backend',
      url: 'http://localhost:8000/api/health',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -- --port 5173',
      cwd: '../frontend',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
})
