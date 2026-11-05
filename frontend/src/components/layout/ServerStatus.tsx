import clsx from 'clsx'
import { useHealth } from '../../hooks/useHealth'

// Trạng thái kết nối máy chủ, nhỏ gọn; backend chưa chạy vẫn hiển thị bình thường
export function ServerStatus() {
  const { data, isError, isPending } = useHealth()
  const ok = !isError && data?.status === 'ok'
  const nhan = isPending ? 'Đang kiểm tra máy chủ' : ok ? 'Máy chủ: hoạt động' : 'Máy chủ: không kết nối được'
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-muted">
      <span
        aria-hidden="true"
        className={clsx('h-2 w-2 rounded-full', isPending ? 'bg-gold-500' : ok ? 'bg-ok' : 'bg-danger')}
      />
      {nhan}
    </span>
  )
}
