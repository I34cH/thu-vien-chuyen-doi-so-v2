// Nhãn trạng thái tư liệu dùng chung: số bản còn, bản mềm, không có tài liệu.
import clsx from 'clsx'
import { FileLock2, FileText, PackageX } from 'lucide-react'
import type { TaiLieuTomTat } from '../../api/types'
import { Badge } from '../ui'

export function TinhTrangBan({ tl, lon }: { tl: Pick<TaiLieuTomTat, 'so_ban' | 'so_ban_con' | 'khong_co_tl'>; lon?: boolean }) {
  if (tl.khong_co_tl || tl.so_ban === 0) {
    return (
      <span className={clsx('inline-flex items-center gap-1.5 text-muted', lon ? 'text-base' : 'text-sm')}>
        <PackageX className="h-4 w-4" aria-hidden="true" />
        Không có bản giấy
      </span>
    )
  }
  const con = tl.so_ban_con > 0
  return (
    <span className={clsx('inline-flex items-center gap-2 tabular-nums', lon ? 'text-base' : 'text-sm')}>
      <span aria-hidden="true" className={clsx('h-2 w-2 rounded-full', con ? 'bg-ok' : 'bg-warn')} />
      <span className={con ? 'text-ink' : 'text-warn'}>
        {con ? (
          <>
            Còn <strong className="font-semibold">{tl.so_ban_con}</strong>/{tl.so_ban} bản
          </>
        ) : (
          <>Đã mượn hết {tl.so_ban} bản</>
        )}
      </span>
    </span>
  )
}

export function NhanBanMem({ tl }: { tl: Pick<TaiLieuTomTat, 'co_ban_mem' | 'muc_truy_cap' | 'khong_co_tl'> }) {
  if (tl.khong_co_tl && !tl.co_ban_mem) {
    return <Badge tone="neutral">Không có tài liệu</Badge>
  }
  if (!tl.co_ban_mem) return null
  return tl.muc_truy_cap === 'noi_bo' ? (
    <Badge tone="info" title="Cần đăng nhập để đọc">
      <FileLock2 className="h-3.5 w-3.5" aria-hidden="true" />
      Bản mềm · nội bộ
    </Badge>
  ) : (
    <Badge tone="ok">
      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
      Bản mềm · công khai
    </Badge>
  )
}
