import type { HTMLAttributes } from 'react'
import clsx from 'clsx'

type Tone = 'neutral' | 'brand' | 'gold' | 'ok' | 'warn' | 'info' | 'danger'

const mauSac: Record<Tone, string> = {
  neutral: 'bg-paper text-ink-soft border-line-strong',
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  gold: 'bg-gold-100 text-gold-700 border-gold-300',
  ok: 'bg-ok-bg text-ok border-ok/15',
  warn: 'bg-warn-bg text-warn border-warn/15',
  info: 'bg-info-bg text-info border-info/15',
  danger: 'bg-danger-bg text-danger border-danger/15',
}

export function Badge({
  tone = 'neutral',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold leading-5',
        mauSac[tone],
        className,
      )}
      {...rest}
    />
  )
}
