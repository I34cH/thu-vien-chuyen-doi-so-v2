// Máy khách fetch JSON dùng chung. Luôn gửi cookie (JWT httpOnly) cùng yêu cầu.
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** status = 0: không kết nối được máy chủ (lỗi mạng). */
export const LOI_MANG = 'Không kết nối được máy chủ. Kiểm tra mạng hoặc thử lại sau ít phút.'

export function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === false) continue
    sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const laForm = typeof FormData !== 'undefined' && init.body instanceof FormData
  if (init.body && !laForm && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  headers.set('Accept', 'application/json')

  let res: Response
  try {
    res = await fetch(`/api${path}`, { ...init, headers, credentials: 'include' })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new ApiError(0, LOI_MANG)
  }
  if (!res.ok) {
    // Lỗi FastAPI có dạng {"detail": "..."}; lỗi kiểm tra dữ liệu (422) là mảng
    let detail = res.statusText || `Lỗi ${res.status}`
    try {
      const body = await res.json()
      if (typeof body?.detail === 'string') detail = body.detail
      else if (Array.isArray(body?.detail) && body.detail[0]?.msg) detail = String(body.detail[0].msg)
    } catch {
      /* thân phản hồi không phải JSON */
    }
    if (res.status >= 500) detail = 'Máy chủ gặp sự cố. Vui lòng thử lại.'
    throw new ApiError(res.status, detail)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function postJson<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
}

/** Thông điệp lỗi thân thiện cho người dùng. */
export function thongDiepLoi(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Bạn cần đăng nhập để tiếp tục.'
    if (err.status === 403) return 'Tài khoản của bạn không có quyền thực hiện thao tác này.'
    return err.message
  }
  if (err instanceof Error && err.message) return err.message
  return 'Đã có lỗi không mong muốn. Vui lòng thử lại.'
}
