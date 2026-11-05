import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface EmptyStateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  compact?: boolean
  className?: string
}

// Minh họa: chồng sách, vẽ bằng SVG nét đơn
function SachIcon({ nho }: { nho?: boolean }) {
  return (
    <svg viewBox="0 0 96 96" className={nho ? 'h-14 w-14' : 'h-24 w-24'} fill="none" aria-hidden="true">
      <rect x="14" y="58" width="68" height="14" rx="3" className="fill-brand-100 stroke-brand-600" strokeWidth="2.5" />
      <rect x="20" y="42" width="58" height="14" rx="3" className="fill-gold-100 stroke-gold-700" strokeWidth="2.5" />
      <rect x="26" y="26" width="46" height="14" rx="3" className="fill-brand-50 stroke-brand-600" strokeWidth="2.5" />
      <path d="M30 33h14M24 49h18M18 65h22" className="stroke-brand-600" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyState({ title, description, action, compact, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface/60 text-center',
        compact ? 'px-4 py-8' : 'px-6 py-14',
        className,
      )}
    >
      <SachIcon nho={compact} />
      <h2 className={clsx('mt-4 font-semibold text-brand-700', compact ? 'text-lg' : 'text-2xl')}>{title}</h2>
      {description && <div className="mt-2 max-w-md text-ink-soft">{description}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
