import { useEffect, useState } from 'react'

const TEN_SITE = 'Thư viện Khoa'

/** Đặt tiêu đề tab theo trang. */
export function useTieuDe(tieuDe?: string | null) {
  useEffect(() => {
    document.title = tieuDe ? `${tieuDe} · ${TEN_SITE}` : `${TEN_SITE} — Tra cứu và chuyển đổi số tư liệu`
  }, [tieuDe])
}

/** Trả về giá trị sau khi ngừng thay đổi `ms` mili giây. */
export function useDebounce<T>(value: T, ms = 200): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}
