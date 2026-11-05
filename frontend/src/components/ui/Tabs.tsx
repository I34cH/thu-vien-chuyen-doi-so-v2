// Thanh tab theo mẫu ARIA (role=tablist), điều hướng bằng phím mũi tên, Home, End.
import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import clsx from 'clsx'

export interface MucTab<K extends string> {
  khoa: K
  nhan: ReactNode
  dem?: number
  canhBao?: boolean
}

export function Tabs<K extends string>({
  muc,
  dangChon,
  onChon,
  nhanNhom,
  idPanel,
  className,
}: {
  muc: MucTab<K>[]
  dangChon: K
  onChon: (k: K) => void
  nhanNhom: string
  idPanel?: string
  className?: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent, i: number) => {
    let j = i
    if (e.key === 'ArrowRight') j = (i + 1) % muc.length
    else if (e.key === 'ArrowLeft') j = (i - 1 + muc.length) % muc.length
    else if (e.key === 'Home') j = 0
    else if (e.key === 'End') j = muc.length - 1
    else return
    e.preventDefault()
    refs.current[j]?.focus()
    onChon(muc[j].khoa)
  }
  return (
    <div
      role="tablist"
      aria-label={nhanNhom}
      className={clsx('-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1', className)}
    >
      {muc.map((m, i) => {
        const chon = m.khoa === dangChon
        return (
          <button
            key={m.khoa}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`tab-${m.khoa}`}
            aria-selected={chon}
            aria-controls={idPanel}
            tabIndex={chon ? 0 : -1}
            onClick={() => onChon(m.khoa)}
            onKeyDown={(e) => onKey(e, i)}
            className={clsx(
              'relative -mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors',
              chon ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-soft hover:border-line-strong hover:text-ink',
            )}
          >
            {m.nhan}
            {m.dem !== undefined && (
              <span
                className={clsx(
                  'min-w-6 rounded-full px-1.5 py-px text-center text-xs tabular-nums',
                  m.canhBao && m.dem > 0
                    ? 'bg-danger text-white'
                    : chon
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink/[0.06] text-ink-soft',
                )}
              >
                {m.dem}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
