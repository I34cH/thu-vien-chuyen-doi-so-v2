// Tiện ích kiểm thử: fetch giả lập theo đường dẫn và bộ bọc Provider.
import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../components/ui'

type XuLy = (url: URL, init?: RequestInit) => unknown | Response

/** Thay fetch toàn cục: khóa là tiền tố đường dẫn (không gồm /api); trả JSON. Đường dẫn lạ → 404. */
export function giaLapFetch(bang: Record<string, XuLy | unknown>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const url = new URL(raw, 'http://localhost')
    const p = url.pathname.replace(/^\/api/, '')
    const khoa = Object.keys(bang)
      .filter((k) => p === k || p.startsWith(`${k}/`) || p.startsWith(`${k}?`))
      .sort((a, b) => b.length - a.length)[0]
    if (!khoa) return new Response(JSON.stringify({ detail: 'không có' }), { status: 404 })
    const v = bang[khoa]
    const kq = typeof v === 'function' ? (v as XuLy)(url, init) : v
    if (kq instanceof Response) return kq
    return new Response(JSON.stringify(kq), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

export function renderVoi(ui: ReactNode, { route = '/' }: { route?: string } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
}
