// Các trạng thái dùng chung: khung xương (skeleton), lỗi, đang tải nhỏ.
import clsx from 'clsx'
import { RefreshCw, WifiOff } from 'lucide-react'
import { ApiError, thongDiepLoi } from '../../api/client'
import { Button } from './Button'

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={clsx('skeleton block rounded-md', className)} />
}

/** Khối báo lỗi có nút thử lại; phân biệt lỗi mạng với lỗi khác. */
export function ErrorState({
  error,
  onRetry,
  tieuDe,
  compact,
}: {
  error: unknown
  onRetry?: () => void
  tieuDe?: string
  compact?: boolean
}) {
  const mang = error instanceof ApiError && error.status === 0
  return (
    <div
      role="alert"
      className={clsx(
        'flex flex-col items-center rounded-lg border border-danger/20 bg-danger-bg/50 text-center',
        compact ? 'gap-2 px-4 py-6' : 'gap-3 px-6 py-12',
      )}
    >
      <WifiOff className={clsx('text-danger', compact ? 'h-5 w-5' : 'h-8 w-8')} aria-hidden="true" />
      <div>
        <p className="font-semibold text-ink">{tieuDe ?? (mang ? 'Mất kết nối với máy chủ' : 'Không tải được dữ liệu')}</p>
        <p className="mt-1 max-w-md text-sm text-ink-soft">{thongDiepLoi(error)}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Thử lại
        </Button>
      )}
    </div>
  )
}
