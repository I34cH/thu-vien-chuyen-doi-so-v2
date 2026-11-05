// Thông báo nổi (toast): một vùng aria-live duy nhất, tự ẩn, có nút đóng.
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

type Loai = 'thanh_cong' | 'loi' | 'thong_tin'
interface Toast {
  id: number
  loai: Loai
  tieuDe: string
  moTa?: string
}
interface ToastApi {
  bao: (t: Omit<Toast, 'id'>) => void
  thanhCong: (tieuDe: string, moTa?: string) => void
  loi: (tieuDe: string, moTa?: string) => void
  thongTin: (tieuDe: string, moTa?: string) => void
}

const Ctx = createContext<ToastApi | null>(null)

const BIEU_TUONG = { thanh_cong: CheckCircle2, loi: TriangleAlert, thong_tin: Info }
const MAU = {
  thanh_cong: 'text-ok',
  loi: 'text-danger',
  thong_tin: 'text-info',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [ds, setDs] = useState<Toast[]>([])
  const dem = useRef(0)

  const dong = useCallback((id: number) => setDs((d) => d.filter((t) => t.id !== id)), [])
  const bao = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++dem.current
      setDs((d) => [...d.slice(-3), { ...t, id }])
      setTimeout(() => dong(id), t.loai === 'loi' ? 7000 : 4500)
    },
    [dong],
  )
  const api = useMemo<ToastApi>(
    () => ({
      bao,
      thanhCong: (tieuDe, moTa) => bao({ loai: 'thanh_cong', tieuDe, moTa }),
      loi: (tieuDe, moTa) => bao({ loai: 'loi', tieuDe, moTa }),
      thongTin: (tieuDe, moTa) => bao({ loai: 'thong_tin', tieuDe, moTa }),
    }),
    [bao],
  )

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {ds.map((t) => {
          const Icon = BIEU_TUONG[t.loai]
          return (
            <div
              key={t.id}
              role={t.loai === 'loi' ? 'alert' : 'status'}
              className="toast-vao pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-line bg-surface p-4 shadow-lift"
            >
              <Icon className={clsx('mt-0.5 h-5 w-5 shrink-0', MAU[t.loai])} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-ink">{t.tieuDe}</p>
                {t.moTa && <p className="mt-0.5 text-sm text-ink-soft">{t.moTa}</p>}
              </div>
              <button
                type="button"
                onClick={() => dong(t.id)}
                className="-m-1 rounded p-1 text-muted hover:bg-ink/5 hover:text-ink"
                aria-label="Đóng thông báo"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}

export function useToast(): ToastApi {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast phải nằm trong ToastProvider')
  return c
}
