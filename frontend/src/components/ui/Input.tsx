import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, ...rest },
  ref,
) {
  const auto = useId()
  const inputId = id ?? auto
  const moTaId = `${inputId}-mo-ta`
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-ink-soft">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? moTaId : undefined}
        className={clsx(
          'h-11 w-full rounded-md border bg-surface px-3.5 text-base text-ink placeholder:text-muted',
          'transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/25',
          error ? 'border-danger' : 'border-line-strong',
          className,
        )}
        {...rest}
      />
      {(error || hint) && (
        <p id={moTaId} className={clsx('text-sm', error ? 'text-danger' : 'text-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
})
