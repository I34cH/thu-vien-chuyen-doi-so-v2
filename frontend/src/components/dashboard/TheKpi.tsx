// Thẻ KPI: con số chính, nhãn, so sánh kỳ trước (mũi tên + chữ, không chỉ dựa vào màu).
import type { ReactNode } from 'react'
import clsx from 'clsx'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

export interface SoSanh {
  /** Chênh lệch đã định dạng, ví dụ "+12%" hoặc "−1,2 điểm %". */
  nhan: string
  huong: 'tang' | 'giam' | 'ngang'
  /** Tăng là tốt hay xấu (quyết định màu trạng thái). */
  tangLaTot: boolean
}

export function TheKpi({
  nhan,
  giaTri,
  phu,
  soSanh,
  kyTruoc,
  nhan_tooltip,
}: {
  nhan: string
  giaTri: ReactNode
  phu?: ReactNode
  soSanh?: SoSanh | null
  kyTruoc?: string
  nhan_tooltip?: string
}) {
  const tot = soSanh && soSanh.huong !== 'ngang' ? (soSanh.huong === 'tang') === soSanh.tangLaTot : null
  const Icon = soSanh?.huong === 'tang' ? ArrowUpRight : soSanh?.huong === 'giam' ? ArrowDownRight : Minus
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-line bg-surface px-5 py-4 shadow-card" title={nhan_tooltip}>
      <p className="text-sm font-medium text-ink-soft">{nhan}</p>
      <p className="mt-1.5 font-display text-[2rem] font-semibold leading-none tracking-tight text-ink tabular-nums">{giaTri}</p>
      <div className="mt-auto pt-3 text-xs">
        {soSanh ? (
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span
              className={clsx(
                'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-semibold tabular-nums',
                tot === null ? 'bg-ink/5 text-ink-soft' : tot ? 'bg-ok-bg text-ok' : 'bg-danger-bg text-danger',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {soSanh.nhan}
            </span>
            <span className="text-muted">{kyTruoc ?? 'so với kỳ trước'}</span>
          </p>
        ) : (
          <p className="text-muted">{phu}</p>
        )}
      </div>
    </div>
  )
}

/** So sánh dạng phần trăm thay đổi tương đối. */
export function soSanhTuongDoi(hienTai: number, truoc: number, tangLaTot: boolean): SoSanh | null {
  if (!Number.isFinite(truoc)) return null
  if (truoc === 0) return hienTai === 0 ? { nhan: '0%', huong: 'ngang', tangLaTot } : { nhan: 'mới', huong: 'tang', tangLaTot }
  const d = ((hienTai - truoc) / truoc) * 100
  const huong = Math.abs(d) < 0.5 ? 'ngang' : d > 0 ? 'tang' : 'giam'
  const so = Math.abs(d).toLocaleString('vi-VN', { maximumFractionDigits: Math.abs(d) < 10 ? 1 : 0 })
  return { nhan: `${d > 0 ? '+' : d < 0 ? '−' : ''}${so}%`, huong, tangLaTot }
}

/** So sánh tỉ lệ bằng điểm phần trăm (đầu vào là phần trăm 0..100). */
export function soSanhDiem(hienTai: number, truoc: number, tangLaTot: boolean): SoSanh | null {
  if (!Number.isFinite(truoc)) return null
  const d = hienTai - truoc
  const huong = Math.abs(d) < 0.05 ? 'ngang' : d > 0 ? 'tang' : 'giam'
  return {
    nhan: `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} điểm`,
    huong,
    tangLaTot,
  }
}
