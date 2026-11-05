import type { HTMLAttributes } from 'react'
import clsx from 'clsx'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-line bg-surface p-5 shadow-card',
        interactive && 'transition-shadow duration-200 hover:shadow-lift',
        className,
      )}
      {...rest}
    />
  )
}
