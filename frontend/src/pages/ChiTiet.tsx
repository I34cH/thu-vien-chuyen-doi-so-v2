import type { ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { BookOpenCheck, ChevronRight, Clock, ExternalLink, FileLock2, FileText, Info, LogIn, PackageX } from 'lucide-react'
import { ApiError, thongDiepLoi } from '../api/client'
import { traCuuApi, muonApi } from '../api/endpoints'
import type { LuotMuon, TaiLieuChiTiet } from '../api/types'
import { NhanBanMem, TinhTrangBan } from '../components/tai-lieu/NhanTaiLieu'
import { Badge, Button, EmptyState, ErrorState, nutClass, Skeleton, useToast } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useTieuDe } from '../hooks/useTienIch'
import { nhanLoaiHinh, ngay, soNgayDenHan, TRANG_THAI_MUON } from '../lib/format'

function DongThongTin({ nhan, children }: { nhan: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '') return null
  return (
    <div className="grid gap-1 border-b border-line py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted">{nhan}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  )
}

const TRANG_THAI_BAN: Record<string, { nhan: string; tone: 'ok' | 'warn' | 'neutral' }> = {
  con: { nhan: 'Sẵn sàng', tone: 'ok' },
  dang_muon: { nhan: 'Đang được mượn', tone: 'warn' },
  mat: { nhan: 'Đã mất', tone: 'neutral' },
}

function TrangThaiLuotCuaToi({ lm }: { lm: LuotMuon }) {
  const conLai = soNgayDenHan(lm.han_tra)
  return (
    <div className={clsx('rounded-lg border p-4', lm.qua_han ? 'border-danger/30 bg-danger-bg' : 'border-info/20 bg-info-bg/60')}>
      <p className="flex items-center gap-2 font-semibold text-ink">
        <Clock className={clsx('h-4 w-4', lm.qua_han ? 'text-danger' : 'text-info')} aria-hidden="true" />
        Lượt mượn của bạn: {TRANG_THAI_MUON[lm.trang_thai]}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        {lm.trang_thai === 'cho_duyet' && `Đăng ký ngày ${ngay(lm.ngay_dang_ky)}. Thủ thư sẽ duyệt và giữ bản cho bạn.`}
        {lm.trang_thai === 'dang_muon' &&
          (lm.qua_han
            ? `Đã quá hạn trả ${Math.abs(conLai ?? 0)} ngày (hạn ${ngay(lm.han_tra)}). Vui lòng mang trả sớm.`
            : `Bản ${lm.ma_ban_sao ?? ''} · hạn trả ${ngay(lm.han_tra)}${conLai !== null ? ` (còn ${conLai} ngày)` : ''}.`)}
      </p>
      <Link to="/tai-khoan" className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline">
        Xem tất cả lượt mượn
      </Link>
    </div>
  )
}

function KhoiHanhDong({ tl }: { tl: TaiLieuChiTiet }) {
  const { nhom } = useAuth()
  const location = useLocation()
  const toast = useToast()
  const qc = useQueryClient()
  const tiep = encodeURIComponent(location.pathname)

  const muon = useMutation({
    mutationFn: () => muonApi.dangKy(tl.id),
    onSuccess: (lm) => {
      qc.setQueryData<TaiLieuChiTiet>(['tai-lieu', tl.id], (cu) => (cu ? { ...cu, luot_muon_cua_toi: lm } : cu))
      void qc.invalidateQueries({ queryKey: ['muon-cua-toi'] })
      toast.thanhCong('Đã gửi đăng ký mượn', 'Thủ thư sẽ duyệt và báo hạn trả cho bạn.')
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 409) {
        toast.loi('Chưa đăng ký được', e.message || 'Tư liệu đã hết bản hoặc bạn đã có lượt mượn đang mở.')
        void qc.invalidateQueries({ queryKey: ['tai-lieu', tl.id] })
      } else toast.loi('Chưa đăng ký được', thongDiepLoi(e))
    },
  })

  const hetBan = tl.so_ban_con <= 0
  const khongCoBan = tl.khong_co_tl || tl.so_ban === 0
  const loi409 = muon.error instanceof ApiError && muon.error.status === 409 ? muon.error.message : null

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Bản giấy</p>
        <div className="mt-2">
          <TinhTrangBan tl={tl} lon />
        </div>
      </div>

      {/* Mượn */}
      {tl.luot_muon_cua_toi ? (
        <TrangThaiLuotCuaToi lm={tl.luot_muon_cua_toi} />
      ) : khongCoBan ? (
        <p className="flex gap-2 text-sm text-ink-soft">
          <PackageX className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          Thư viện không có bản giấy của tư liệu này nên chưa thể mượn.
        </p>
      ) : nhom === 'nguoi_dung' ? (
        <div>
          <Button size="lg" className="w-full" onClick={() => muon.mutate()} dangXuLy={muon.isPending} disabled={hetBan}>
            <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
            {hetBan ? 'Đã hết bản để mượn' : 'Đăng ký mượn'}
          </Button>
          <p className="mt-2 text-xs text-muted">
            {hetBan ? 'Quay lại sau khi có bạn đọc trả sách.' : 'Thời hạn mượn 14 ngày kể từ khi thủ thư duyệt.'}
          </p>
          {loi409 && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {loi409}
            </p>
          )}
        </div>
      ) : nhom === 'khach' ? (
        <Link to={`/tai-khoan?tiep=${tiep}`} className={nutClass('secondary', 'lg', 'w-full')}>
          <LogIn className="h-5 w-5" aria-hidden="true" />
          Đăng nhập để mượn
        </Link>
      ) : (
        <p className="flex gap-2 text-sm text-ink-soft">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden="true" />
          Tài khoản thủ thư không đăng ký mượn. Duyệt các lượt mượn ở trang Quản lý.
        </p>
      )}

      {/* Bản mềm */}
      <div className="border-t border-line pt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Bản mềm</p>
        {tl.co_ban_mem ? (
          tl.muc_truy_cap === 'noi_bo' && nhom === 'khach' ? (
            <div className="mt-2 space-y-2">
              <p className="flex items-center gap-2 text-sm text-ink-soft">
                <FileLock2 className="h-4 w-4 text-info" aria-hidden="true" />
                Bản mềm nội bộ, cần đăng nhập để đọc.
              </p>
              <Link to={`/tai-khoan?tiep=${tiep}`} className={nutClass('secondary', 'md', 'w-full')}>
                Đăng nhập để đọc
              </Link>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <a href={traCuuApi.banMemUrl(tl.id)} target="_blank" rel="noopener" className={nutClass('gold', 'lg', 'w-full')}>
                <FileText className="h-5 w-5" aria-hidden="true" />
                Đọc bản mềm
                <ExternalLink className="h-4 w-4 opacity-70" aria-hidden="true" />
                <span className="an-truc-quan">(mở tab mới)</span>
              </a>
              <p className="text-xs text-muted">{tl.muc_truy_cap === 'noi_bo' ? 'Bản nội bộ · PDF' : 'Công khai · PDF'}</p>
            </div>
          )
        ) : (
          <p className="mt-2 text-sm text-ink-soft">Chưa số hóa. Lượt xem và mượn của bạn giúp thư viện ưu tiên số hóa tư liệu này.</p>
        )}
      </div>
    </div>
  )
}

function TuongTu({ id }: { id: number }) {
  const q = useQuery({ queryKey: ['tuong-tu', id], queryFn: () => traCuuApi.tuongTu(id), staleTime: 5 * 60_000 })
  // Rỗng hoặc lỗi thì ẩn gọn: đây là phần phụ
  if (!q.data || q.data.length === 0) return null
  return (
    <section aria-labelledby="tieu-de-tuong-tu" className="mt-14">
      <h2 id="tieu-de-tuong-tu" className="text-2xl font-semibold text-brand-700">
        Tư liệu tương tự
      </h2>
      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {q.data.map(({ tai_lieu: t }) => (
          <li key={t.id} className="min-w-0">
            <Link to={`/tai-lieu/${t.id}`} className="group block h-full rounded-lg border border-line bg-surface p-4 no-underline transition-[border-color,box-shadow] hover:border-brand-200 hover:shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                {nhanLoaiHinh(t.loai_hinh)}
                {t.nam ? ` · ${t.nam}` : ''}
              </p>
              <p className="mt-1 line-clamp-3 font-display font-semibold leading-snug text-ink group-hover:text-brand-700">{t.tieu_de}</p>
              {t.tac_gia && <p className="mt-1 truncate text-sm text-muted">{t.tac_gia}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function ChiTiet() {
  const { id: idStr } = useParams()
  const id = Number(idStr)
  const location = useLocation()
  const tu = (location.state as { tu?: string } | null)?.tu
  const hopLe = Number.isInteger(id) && id > 0

  const q = useQuery({
    queryKey: ['tai-lieu', id],
    queryFn: () => traCuuApi.chiTiet(id),
    enabled: hopLe,
  })
  useTieuDe(q.data?.tieu_de ?? 'Chi tiết tư liệu')

  if (!hopLe || (q.error instanceof ApiError && q.error.status === 404)) {
    return (
      <EmptyState
        title="Không tìm thấy tư liệu"
        description="Tư liệu này không tồn tại hoặc đã bị gỡ khỏi danh mục."
        action={
          <Link to="/tra-cuu" className={nutClass('primary', 'md')}>
            Quay lại tra cứu
          </Link>
        }
      />
    )
  }

  const tl = q.data
  return (
    <article>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <li>
            <Link to="/" className="hover:text-brand-700">Trang chủ</Link>
          </li>
          <li className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <Link to={tu ?? '/tra-cuu'} className="hover:text-brand-700">
              {tu ? 'Kết quả tìm kiếm' : 'Tra cứu'}
            </Link>
          </li>
          {tl && (
            <>
              <li className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                <Link to={`/tra-cuu?loai=${tl.loai_hinh}`} className="hover:text-brand-700">{nhanLoaiHinh(tl.loai_hinh)}</Link>
              </li>
              <li aria-current="page" className="hidden min-w-0 items-center gap-1 text-ink-soft sm:flex">
                <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="max-w-[32ch] truncate">{tl.tieu_de}</span>
              </li>
            </>
          )}
        </ol>
      </nav>

      {q.isError && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      {q.isPending && (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]" aria-busy="true">
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="mt-6 h-64 w-full" />
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      )}

      {tl && (
        <>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-semibold uppercase tracking-wide text-brand-600">{nhanLoaiHinh(tl.loai_hinh)}</span>
                <span className="text-muted" aria-hidden="true">·</span>
                <span className="font-mono text-muted">{tl.ky_hieu}</span>
              </p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-ink sm:text-[2.6rem]">{tl.tieu_de}</h1>
              {tl.tac_gia && <p className="mt-3 text-lg text-ink-soft">{tl.tac_gia}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <NhanBanMem tl={tl} />
                {tl.ma_van_de && (
                  <Badge tone="gold" title={tl.ma_van_de.ten ?? 'Mã vấn đề chưa có giải nghĩa'}>
                    {tl.ma_van_de.ten ? `${tl.ma_van_de.ma} · ${tl.ma_van_de.ten}` : `Mã vấn đề ${tl.ma_van_de.ma}`}
                  </Badge>
                )}
              </div>

              <h2 className="mt-10 text-xl font-semibold text-brand-700">Thông tin tư liệu</h2>
              <dl className="mt-2 border-t border-line">
                <DongThongTin nhan="Tác giả">{tl.tac_gia}</DongThongTin>
                <DongThongTin nhan="Năm">{tl.nam_goc && tl.nam_goc !== String(tl.nam) ? `${tl.nam ?? ''} (ghi gốc: ${tl.nam_goc})` : tl.nam}</DongThongTin>
                <DongThongTin nhan="Người hướng dẫn">{tl.gvhd}</DongThongTin>
                <DongThongTin nhan="Cơ quan, đơn vị">{tl.co_quan}</DongThongTin>
                <DongThongTin nhan="Nhà xuất bản">{tl.nxb}</DongThongTin>
                <DongThongTin nhan="Hệ đào tạo">{tl.he}</DongThongTin>
                <DongThongTin nhan="Khóa">{tl.khoa_hoc}</DongThongTin>
                <DongThongTin nhan="Ký hiệu">
                  <span className="font-mono text-sm">{tl.ky_hieu}</span>
                </DongThongTin>
                <DongThongTin nhan="Ghi chú">{tl.ghi_chu}</DongThongTin>
              </dl>

              <h2 className="mt-10 text-xl font-semibold text-brand-700">
                Bản sao <span className="font-sans text-base font-normal text-muted">({tl.ban_sao.length})</span>
              </h2>
              {tl.ban_sao.length === 0 ? (
                <p className="mt-3 text-ink-soft">Thư viện chưa có bản sao giấy nào.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
                  {tl.ban_sao.map((b) => {
                    const t = TRANG_THAI_BAN[b.trang_thai] ?? { nhan: b.trang_thai, tone: 'neutral' as const }
                    return (
                      <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="font-mono text-sm text-ink">{b.ma_ban_sao}</span>
                        <Badge tone={t.tone}>{t.nhan}</Badge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <aside aria-label="Mượn và đọc" className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-line bg-surface p-5 shadow-card sm:p-6">
                <KhoiHanhDong tl={tl} />
              </div>
            </aside>
          </div>
          <TuongTu id={tl.id} />
        </>
      )}
    </article>
  )
}
