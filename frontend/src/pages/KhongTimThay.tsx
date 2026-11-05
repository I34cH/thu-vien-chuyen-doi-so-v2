import { Link } from 'react-router-dom'
import { useTieuDe } from '../hooks/useTienIch'
import { nutClass } from '../components/ui'

export default function KhongTimThay() {
  useTieuDe('Không tìm thấy trang')
  return (
    <section className="mx-auto max-w-2xl py-12 text-center sm:py-20">
      <p className="font-display text-[6rem] font-semibold leading-none text-brand-100 sm:text-[8rem]" aria-hidden="true">
        404
      </p>
      <h1 className="-mt-4 text-3xl font-semibold text-brand-700 sm:text-4xl">Trang này không có trên kệ</h1>
      <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">
        Đường dẫn có thể đã đổi hoặc gõ nhầm. Thử tìm tư liệu bạn cần, hoặc quay về trang chủ.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/tra-cuu" className={nutClass('primary', 'lg')}>
          Tra cứu tư liệu
        </Link>
        <Link to="/" className={nutClass('secondary', 'lg')}>
          Về trang chủ
        </Link>
      </div>
    </section>
  )
}
