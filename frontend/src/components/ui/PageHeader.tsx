import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** Phần nhỏ đặt cạnh tiêu đề (ví dụ nhãn "Số liệu mô phỏng"). */
  canhTieuDe?: ReactNode
  /** Breadcrumb hoặc liên kết quay lại, đặt trên tiêu đề. */
  tren?: ReactNode
}

export function PageHeader({ title, description, actions, canhTieuDe, tren }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {tren}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-3xl font-semibold text-brand-700 sm:text-[2.5rem]">{title}</h1>
          {canhTieuDe}
        </div>
        {description && <p className="mt-2 text-base text-ink-soft sm:text-lg">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </header>
  )
}
