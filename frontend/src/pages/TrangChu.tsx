import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BarChart3, FileText, Search, Undo2 } from 'lucide-react'
import { traCuuApi } from '../api/endpoints'
import { SearchBox } from '../components/search/SearchBox'
import { ErrorState, Skeleton } from '../components/ui'
import { nhanLoaiHinh, phanTram, so } from '../lib/format'
import { useTieuDe } from '../hooks/useTienIch'

const VONG_LAP = [
  { icon: Search, b: 'Bạn đọc tìm', m: 'Mỗi lượt tìm được ghi lại dưới dạng số đếm, không lưu ai tìm gì.' },
  { icon: BarChart3, b: 'Thủ thư đọc số liệu', m: 'Từ khóa tìm nhiều, tìm không ra, tư liệu được chọn và mượn.' },
  { icon: FileText, b: 'Số hóa đúng chỗ', m: 'Tư liệu được quan tâm nhất có bản mềm trước.' },
  { icon: Undo2, b: 'Bản mềm được đọc', m: 'Lượt đọc quay lại thành dữ liệu cho vòng sau.' },
]

export default function TrangChu() {
  useTieuDe(null)
  const navigate = useNavigate()
  const gt = useQuery({ queryKey: ['gioi-thieu'], queryFn: traCuuApi.gioiThieu, staleTime: 5 * 60_000 })
  const tim = (q: string) => navigate(q ? `/tra-cuu?q=${encodeURIComponent(q)}` : '/tra-cuu')
  const max = Math.max(1, ...(gt.data?.theo_loai_hinh.map((l) => l.so_luong) ?? [1]))

  return (
    <div className="-mt-2 space-y-14 sm:space-y-20">
      {/* Khối tìm kiếm chính */}
      <section className="bg-spines relative rounded-2xl bg-brand-700 px-5 pb-10 pt-12 text-white shadow-lift sm:px-12 sm:pb-14 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-[2.1rem] font-semibold leading-[1.1] text-white sm:text-5xl">
            {gt.data ? (
              <>
                Tìm trong <span className="text-gold-300">{so(gt.data.tong_tai_lieu)}</span> tư liệu của Khoa
              </>
            ) : (
              'Tìm tư liệu của Khoa'
            )}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-brand-100 sm:text-lg">
            Luận án, luận văn, khóa luận, sách và kỷ yếu. Gõ không dấu hay sai một chút vẫn tìm ra.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-3xl text-left text-ink">
          <SearchBox kichThuoc="lon" onTimKiem={tim} autoFocus placeholder="Ví dụ: lưu trữ, văn bản hành chính, 1995…" />
        </div>
        <div className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-brand-200">Nhiều người tìm:</span>
          {gt.isPending &&
            Array.from({ length: 4 }, (_, i) => <span key={i} className="h-7 w-24 rounded-full bg-white/10" aria-hidden="true" />)}
          {gt.data?.tu_khoa_noi_bat.slice(0, 6).map((k) => (
            <Link
              key={k}
              to={`/tra-cuu?q=${encodeURIComponent(k)}`}
              className="rounded-full border border-white/25 px-3 py-1 text-sm text-white no-underline transition-colors hover:border-gold-300 hover:bg-white/10"
            >
              {k}
            </Link>
          ))}
        </div>
      </section>

      {/* Danh mục theo loại hình */}
      <section aria-labelledby="tieu-de-danh-muc" className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <h2 id="tieu-de-danh-muc" className="text-3xl font-semibold text-brand-700">
            Danh mục của Khoa
          </h2>
          {gt.isPending && (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </div>
          )}
          {gt.data && (
            <>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                <strong className="font-semibold text-ink">{so(gt.data.tong_tai_lieu)}</strong> tư liệu thuộc{' '}
                <strong className="font-semibold text-ink">{gt.data.so_loai_hinh}</strong> loại hình, trong đó{' '}
                <strong className="font-semibold text-ink">{so(gt.data.da_so_hoa)}</strong> tư liệu đã có bản mềm để đọc trực tuyến.
              </p>
              <div className="mt-6">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-ink">Tiến độ số hóa</span>
                  <span className="tabular-nums text-ink-soft">
                    {phanTram(gt.data.tong_tai_lieu ? gt.data.da_so_hoa / gt.data.tong_tai_lieu : 0)}
                  </span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-line"
                  role="progressbar"
                  aria-label="Tỉ lệ tư liệu đã số hóa"
                  aria-valuemin={0}
                  aria-valuemax={gt.data.tong_tai_lieu}
                  aria-valuenow={gt.data.da_so_hoa}
                >
                  <div
                    className="h-full rounded-full bg-gold-500"
                    style={{ width: `${Math.max(1, (gt.data.da_so_hoa / Math.max(1, gt.data.tong_tai_lieu)) * 100)}%` }}
                  />
                </div>
              </div>
            </>
          )}
          <Link to="/tra-cuu?co_ban_mem=1" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-brand-600 no-underline hover:underline">
            Xem tư liệu đọc được trực tuyến
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div>
          {gt.isError && <ErrorState error={gt.error} onRetry={() => gt.refetch()} compact />}
          {gt.isPending && (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}
          {gt.data && (
            <ul className="divide-y divide-line border-y border-line">
              {[...gt.data.theo_loai_hinh]
                .sort((a, b) => b.so_luong - a.so_luong)
                .map((l) => (
                  <li key={l.loai_hinh}>
                    <Link
                      to={`/tra-cuu?loai=${l.loai_hinh}`}
                      className="group grid grid-cols-[1fr_auto_auto] items-center gap-4 px-2 py-3.5 no-underline transition-colors hover:bg-brand-50/60"
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink group-hover:text-brand-700">{nhanLoaiHinh(l.loai_hinh)}</span>
                        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line/70" aria-hidden="true">
                          <span className="block h-full rounded-full bg-brand-600/80" style={{ width: `${(l.so_luong / max) * 100}%` }} />
                        </span>
                      </span>
                      <span className="text-right tabular-nums text-ink-soft">{so(l.so_luong)}</span>
                      <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>

      {/* Vòng lặp dữ liệu */}
      <section aria-labelledby="tieu-de-vong-lap" className="rounded-2xl border border-line bg-surface px-5 py-10 sm:px-10">
        <h2 id="tieu-de-vong-lap" className="max-w-2xl text-2xl font-semibold text-brand-700 sm:text-3xl">
          Tư liệu nào được số hóa trước? Chính bạn đọc quyết định.
        </h2>
        <ol className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {VONG_LAP.map((v, i) => (
            <li key={v.b} className="relative">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <v.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {i < VONG_LAP.length - 1 && <span className="hidden h-px flex-1 bg-line-strong lg:block" aria-hidden="true" />}
              </div>
              <h3 className="mt-3 font-sans text-base font-semibold text-ink">{v.b}</h3>
              <p className="mt-1 text-sm text-ink-soft">{v.m}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
