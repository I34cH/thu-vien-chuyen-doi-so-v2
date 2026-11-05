// Bảo vệ route theo nhóm vai trò. Khách thấy màn hình mời đăng nhập; sai vai trò thấy thông báo rõ ràng.
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { KeyRound, ShieldAlert } from 'lucide-react'
import { useAuth, type NhomHienTai } from '../../hooks/useAuth'
import { nutClass, Skeleton } from '../ui'

const TEN_NHOM: Record<NhomHienTai, string> = { khach: 'khách', nguoi_dung: 'bạn đọc', thu_thu: 'thủ thư' }

export function YeuCauVaiTro({
  nhom,
  children,
  tenTrang,
}: {
  nhom: Exclude<NhomHienTai, 'khach'>[]
  children: ReactNode
  tenTrang: string
}) {
  const { nhom: hienTai, dangTai } = useAuth()
  const location = useLocation()

  if (dangTai) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Đang kiểm tra đăng nhập">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (hienTai === 'khach') {
    const tiep = encodeURIComponent(location.pathname + location.search)
    return (
      <section className="mx-auto grid max-w-3xl items-center gap-8 py-8 sm:grid-cols-[auto_1fr] sm:py-16">
        <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-brand-50 ring-8 ring-brand-50/50">
          <KeyRound className="h-12 w-12 text-brand-600" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-semibold text-brand-700">{tenTrang} dành cho {nhom.map((n) => TEN_NHOM[n]).join(', ')}</h1>
          <p className="mt-3 text-lg text-ink-soft">
            Đăng nhập bằng tài khoản {nhom.map((n) => TEN_NHOM[n]).join(' hoặc ')} để tiếp tục. Sau khi đăng nhập, bạn sẽ quay lại đúng trang này.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
            <Link to={`/tai-khoan?tiep=${tiep}`} className={nutClass('primary', 'lg')}>
              Đăng nhập
            </Link>
            <Link to="/tra-cuu" className={nutClass('secondary', 'lg')}>
              Tra cứu tư liệu
            </Link>
          </div>
        </div>
      </section>
    )
  }

  if (!nhom.includes(hienTai as Exclude<NhomHienTai, 'khach'>)) {
    return (
      <section role="alert" className="mx-auto max-w-xl py-16 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-warn" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-4 text-3xl font-semibold text-brand-700">Bạn chưa có quyền xem {tenTrang.toLowerCase()}</h1>
        <p className="mt-3 text-ink-soft">
          Trang này chỉ dành cho {nhom.map((n) => TEN_NHOM[n]).join(', ')}. Tài khoản hiện tại là {TEN_NHOM[hienTai]}.
        </p>
        <Link to="/" className={nutClass('secondary', 'md', 'mt-6')}>
          Về trang chủ
        </Link>
      </section>
    )
  }

  return <>{children}</>
}
