import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger' | 'quiet'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  dangXuLy?: boolean
}

const bienThe: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-card',
  secondary: 'bg-surface text-brand-700 border border-line-strong hover:border-brand-600 hover:bg-brand-50',
  ghost: 'text-brand-700 hover:bg-brand-100/70',
  gold: 'bg-gold-500 text-brand-900 hover:bg-gold-300 shadow-card',
  danger: 'bg-surface text-danger border border-danger/40 hover:bg-danger-bg hover:border-danger',
  quiet: 'text-ink-soft hover:bg-ink/5 hover:text-ink',
}
const kichCo: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
}

/** Lớp CSS của nút, dùng lại cho thẻ Link/a trông như nút. */
export function nutClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return clsx(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold no-underline',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    bienThe[variant],
    kichCo[size],
    className,
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  dangXuLy,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={nutClass(variant, size, className)}
      disabled={disabled || dangXuLy}
      aria-busy={dangXuLy || undefined}
      {...rest}
    >
      {dangXuLy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
