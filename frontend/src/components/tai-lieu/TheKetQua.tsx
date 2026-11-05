// Một dòng kết quả tìm kiếm. Bấm tiêu đề: ghi tư liệu được chọn (keepalive) rồi mở chi tiết.
import { Link } from 'react-router-dom'
import type { TaiLieuTomTat } from '../../api/types'
import { nhanLoaiHinh } from '../../lib/format'
import { ToDam } from '../../lib/highlight'
import { NhanBanMem, TinhTrangBan } from './NhanTaiLieu'

export function TheKetQua({
  tl,
  q,
  onChon,
  tuTrang,
}: {
  tl: TaiLieuTomTat
  q: string
  onChon?: (tl: TaiLieuTomTat) => void
  /** Đường dẫn trang kết quả, để breadcrumb ở chi tiết quay lại đúng chỗ. */
  tuTrang?: string
}) {
  return (
    <article className="group relative grid gap-x-6 gap-y-2 border-b border-line px-1 py-5 transition-colors first:pt-2 sm:grid-cols-[1fr_auto] sm:px-3 hover:bg-brand-50/40">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className="font-semibold uppercase tracking-wide text-brand-600">{nhanLoaiHinh(tl.loai_hinh)}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[0.75rem]">{tl.ky_hieu}</span>
          {tl.nam && (
            <>
              <span aria-hidden="true">·</span>
              <span>{tl.nam}</span>
            </>
          )}
        </p>
        <h3 className="mt-1 font-display text-lg [text-wrap:pretty] font-semibold leading-snug text-ink sm:text-xl">
          <Link
            to={`/tai-lieu/${tl.id}`}
            state={tuTrang ? { tu: tuTrang } : undefined}
            onClick={() => onChon?.(tl)}
            className="no-underline decoration-brand-600/40 decoration-2 after:absolute after:inset-0 group-hover:underline"
          >
            <ToDam text={tl.tieu_de} query={q} />
          </Link>
        </h3>
        {tl.tac_gia && (
          <p className="mt-1 text-sm text-ink-soft">
            <ToDam text={tl.tac_gia} query={q} />
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-col sm:items-end sm:justify-center">
        <TinhTrangBan tl={tl} />
        <NhanBanMem tl={tl} />
      </div>
    </article>
  )
}

export function TheKetQuaKhung() {
  return (
    <div className="grid gap-2 border-b border-line px-1 py-5 sm:px-3" aria-hidden="true">
      <span className="skeleton block h-3 w-40 rounded" />
      <span className="skeleton block h-5 w-4/5 rounded" />
      <span className="skeleton block h-4 w-1/3 rounded" />
    </div>
  )
}
