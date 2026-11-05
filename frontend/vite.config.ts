/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cấu hình Vite: cổng 5173, chuyển tiếp /api sang backend FastAPI (cổng 8000)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Trang Dashboard (ECharts) được tải lười riêng, ~630 kB; không ảnh hưởng trang tra cứu
  build: { chunkSizeWarningLimit: 700 },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
