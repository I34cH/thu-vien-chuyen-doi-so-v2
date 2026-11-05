import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Dãy số trang có dấu lược: 1 … 4 5 6 … 20 */
export function daySoTrang(hienTai: number, tong: number): (number | '…')[] {
  if (tong <= 7) return Array.from({ length: tong }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  const a = Math.max(2, hienTai - 1)
  const b = Math.min(tong - 1, hienTai + 1)
  if (a > 2) out.push('…')
  for (let i = a; i <= b; i++) out.push(i)
  if (b < tong - 1) out.push('…')
  out.push(tong)
  return out
}

export function PhanTrang({ trang, tongTrang, onDoi }: { trang: number; tongTrang: number; onDoi: (t: number) => void }) {
  if (tongTrang <= 1) return null
  const nut = 'grid h-10 min-w-10 place-items-center rounded-md px-2 text-sm font-semibold transition-colors'
  return (
    <nav aria-label="Phân trang" className="flex items-center justify-center gap-1">
      <button
        type="button"
        className={clsx(nut, 'text-ink-soft hover:bg-brand-50 disabled:opacity-40')}
        onClick={() => onDoi(trang - 1)}
        disabled={trang <= 1}
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      {daySoTrang(trang, tongTrang).map((t, i) =>
        t === '…' ? (
          <span key={`l${i}`} className="px-1 text-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={t}
            type="button"
            onClick={() => onDoi(t)}
            aria-current={t === trang ? 'page' : undefined}
            aria-label={`Trang ${t}`}
            className={clsx(
              nut,
              'tabular-nums',
              t === trang ? 'bg-brand-600 text-white' : 'text-ink-soft hover:bg-brand-50',
              Math.abs(t - trang) > 1 && t !== 1 && t !== tongTrang && 'hidden sm:grid',
            )}
          >
            {t}
          </button>
        ),
      )}
      <button
        type="button"
        className={clsx(nut, 'text-ink-soft hover:bg-brand-50 disabled:opacity-40')}
        onClick={() => onDoi(trang + 1)}
        disabled={trang >= tongTrang}
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  )
}
