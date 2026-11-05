import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { ApiError } from './api/client'
import { KHOA_AUTH } from './hooks/useAuth'
import { SU_KIEN_HET_PHIEN } from './components/layout/AppLayout'
import { ToastProvider } from './components/ui'
import './index.css'

// 401 ở bất kỳ API nào khi đang có người đăng nhập: phiên đã hết hạn → về trạng thái khách
function xuLyLoi(err: unknown) {
  if (err instanceof ApiError && err.status === 401 && queryClient.getQueryData(KHOA_AUTH)) {
    queryClient.setQueryData(KHOA_AUTH, null)
    window.dispatchEvent(new Event(SU_KIEN_HET_PHIEN))
  }
}

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: xuLyLoi }),
  mutationCache: new MutationCache({ onError: xuLyLoi }),
  defaultOptions: {
    // Không thử lại lỗi 4xx; lỗi mạng thử lại 1 lần
    queries: {
      retry: (n, err) => n < 1 && err instanceof ApiError && err.status === 0,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

async function khoiDong() {
  // Chế độ dữ liệu giả lập: chỉ bật khi VITE_MOCK=1 (mã giả lập bị loại khỏi bản build thường)
  if (import.meta.env.VITE_MOCK === '1') {
    const { batGiaLap } = await import('./api/mock')
    batGiaLap()
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
}

void khoiDong()
