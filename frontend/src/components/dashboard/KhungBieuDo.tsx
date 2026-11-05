// Khung chung cho mỗi biểu đồ: tiêu đề dạng câu hỏi, một dòng cách đọc, nút xem bảng số liệu.
import { useId, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { BarChart3, Table2 } from 'lucide-react'
import { ErrorState, Skeleton } from '../ui'

export interface KhungBieuDoProps {
  cauHoi: string
  cachDoc: ReactNode
  children: ReactNode
  /** Bảng số liệu thay thế (khả năng tiếp cận). */
  bang?: ReactNode
  dangTai?: boolean
  dangLamMoi?: boolean
  loi?: unknown
  onThuLai?: () => void
  rong?: boolean
  thongDiepRong?: string
  phai?: ReactNode
  className?: string
  chieuCao?: string
}

export function KhungBieuDo({
  cauHoi,
  cachDoc,
  children,
  bang,
  dangTai,
  dangLamMoi,
  loi,
  onThuLai,
  rong,
  thongDiepRong = 'Không có dữ liệu trong khoảng đã chọn.',
  phai,
  className,
  chieuCao = 'h-72',
}: KhungBieuDoProps) {
  const [xemBang, setXemBang] = useState(false)
  const id = useId()
  return (
    <section aria-labelledby={`${id}-t`} className={clsx('flex min-w-0 flex-col rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6', className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${id}-t`} className="font-sans text-base font-semibold leading-snug text-ink sm:text-[1.05rem]">
            {cauHoi}
          </h2>
          <p className="mt-1 text-sm text-muted">{cachDoc}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {phai}
          {bang && !rong && !dangTai && !loi && (
            <button
              type="button"
              onClick={() => setXemBang((v) => !v)}
              aria-pressed={xemBang}
              className="grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-ink/5 hover:text-ink"
              title={xemBang ? 'Xem biểu đồ' : 'Xem bảng số liệu'}
            >
              {xemBang ? <BarChart3 className="h-4 w-4" aria-hidden="true" /> : <Table2 className="h-4 w-4" aria-hidden="true" />}
              <span className="an-truc-quan">{xemBang ? 'Xem biểu đồ' : 'Xem bảng số liệu'}</span>
            </button>
          )}
        </div>
      </header>
      <div className={clsx('mt-4 flex-1', dangLamMoi && 'dang-lam-moi')} aria-busy={dangTai || dangLamMoi}>
        {dangTai ? (
          <Skeleton className={clsx('w-full', chieuCao)} />
        ) : loi ? (
          <ErrorState compact error={loi} onRetry={onThuLai} />
        ) : rong ? (
          <div className={clsx('grid place-items-center rounded-lg border border-dashed border-line-strong text-center text-sm text-muted', chieuCao)}>
            <p className="max-w-xs px-4">{thongDiepRong}</p>
          </div>
        ) : xemBang && bang ? (
          <div className="max-h-96 overflow-auto">{bang}</div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

/** Bảng số liệu gọn dùng trong chế độ "xem bảng". */
export function BangSoLieu({ cot, dong }: { cot: string[]; dong: (string | number)[][] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wider text-muted">
        <tr>
          {cot.map((c, i) => (
            <th key={c} scope="col" className={clsx('border-b border-line py-2 font-semibold', i === 0 ? 'text-left' : 'text-right')}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dong.map((d, i) => (
          <tr key={i} className="border-b border-line/70 last:border-b-0">
            {d.map((o, j) => (
              <td key={j} className={clsx('py-1.5', j === 0 ? 'pr-3 text-left text-ink' : 'pl-3 text-right tabular-nums text-ink-soft')}>
                {o}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
