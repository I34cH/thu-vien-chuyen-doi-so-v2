// Hàng đợi lượt mượn của thủ thư: tab theo trạng thái (có số đếm), tìm kiếm, thao tác có xác nhận tại chỗ.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Check, CornerDownLeft, Search, X } from 'lucide-react'
import { ApiError, thongDiepLoi } from '../../api/client'
import { quanLyApi, type TabMuon } from '../../api/endpoints'
import type { LuotMuon } from '../../api/types'
import { Badge, Button, EmptyState, ErrorState, Skeleton, Tabs, useToast } from '../../components/ui'
import { PhanTrang } from '../../components/ui/PhanTrang'
import { useDebounce } from '../../hooks/useTienIch'
import { nhanLoaiHinh, ngay, soNgayDenHan, VAI_TRO } from '../../lib/format'

const TAB: { khoa: TabMuon; nhan: string }[] = [
  { khoa: 'cho_duyet', nhan: 'Chờ duyệt' },
  { khoa: 'dang_muon', nhan: 'Đang mượn' },
  { khoa: 'qua_han', nhan: 'Quá hạn' },
  { khoa: 'da_tra', nhan: 'Đã trả' },
  { khoa: 'tu_choi', nhan: 'Từ chối' },
]

type HanhDong = 'duyet' | 'tu_choi' | 'tra'
const CAU_HINH: Record<HanhDong, { nhan: string; hoi: string; xong: string; variant: 'primary' | 'danger' | 'secondary' }> = {
  duyet: { nhan: 'Duyệt', hoi: 'Duyệt và gán bản sao?', xong: 'Đã duyệt lượt mượn', variant: 'primary' },
  tu_choi: { nhan: 'Từ chối', hoi: 'Từ chối lượt mượn này?', xong: 'Đã từ chối lượt mượn', variant: 'danger' },
  tra: { nhan: 'Ghi nhận trả', hoi: 'Xác nhận đã nhận lại sách?', xong: 'Đã ghi nhận trả', variant: 'primary' },
}

function NutXacNhan({ hd, onXacNhan, dangXuLy }: { hd: HanhDong; onXacNhan: () => void; dangXuLy: boolean }) {
  const [hoi, setHoi] = useState(false)
  const nutHuy = useRef<HTMLButtonElement>(null)
  const c = CAU_HINH[hd]
  useEffect(() => {
    if (hoi) nutHuy.current?.focus()
  }, [hoi])
  if (!hoi)
    return (
      <Button size="sm" variant={hd === 'tu_choi' ? 'quiet' : c.variant} onClick={() => setHoi(true)}>
        {hd === 'duyet' && <Check className="h-4 w-4" aria-hidden="true" />}
        {hd === 'tra' && <CornerDownLeft className="h-4 w-4" aria-hidden="true" />}
        {c.nhan}
      </Button>
    )
  return (
    <div
      role="group"
      aria-label={c.hoi}
      className="pop-vao flex items-center gap-2 rounded-lg bg-paper py-1 pl-3 pr-1 ring-1 ring-line-strong"
      onKeyDown={(e) => e.key === 'Escape' && setHoi(false)}
    >
      <span className="text-sm font-semibold text-ink">{c.hoi}</span>
      <button
        ref={nutHuy}
        type="button"
        onClick={() => setHoi(false)}
        disabled={dangXuLy}
        className="h-9 rounded-md px-3 text-sm font-semibold text-ink-soft hover:bg-ink/5 hover:text-ink disabled:opacity-50"
      >
        Hủy
      </button>
      <Button size="sm" variant={c.variant} onClick={onXacNhan} dangXuLy={dangXuLy}>
        {c.nhan}
      </Button>
    </div>
  )
}

function DongMuon({ lm, tab }: { lm: LuotMuon; tab: TabMuon }) {
  const qc = useQueryClient()
  const toast = useToast()
  const m = useMutation({
    mutationFn: (hd: HanhDong) => (hd === 'duyet' ? quanLyApi.duyet(lm.id) : hd === 'tu_choi' ? quanLyApi.tuChoi(lm.id) : quanLyApi.tra(lm.id)),
    onSuccess: (kq, hd) => {
      toast.thanhCong(CAU_HINH[hd].xong, hd === 'duyet' ? `Bản ${kq.ma_ban_sao ?? ''} · hạn trả ${ngay(kq.han_tra)}` : lm.tai_lieu.tieu_de)
      void qc.invalidateQueries({ queryKey: ['quan-ly', 'muon'] })
      void qc.invalidateQueries({ queryKey: ['tai-lieu', lm.tai_lieu.id] })
    },
    onError: (e) => {
      toast.loi('Thao tác chưa thực hiện được', e instanceof ApiError && e.status === 409 ? e.message || 'Tư liệu đã hết bản sao rảnh.' : thongDiepLoi(e))
      void qc.invalidateQueries({ queryKey: ['quan-ly', 'muon'] })
    },
  })
  const conLai = soNgayDenHan(lm.han_tra)
  return (
    <li className="grid gap-x-6 gap-y-3 px-4 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_auto] md:items-center sm:px-5">
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">{lm.nguoi_dung?.ho_ten ?? 'Bạn đọc'}</p>
        <p className="text-sm text-muted">
          {lm.nguoi_dung ? `${VAI_TRO[lm.nguoi_dung.vai_tro] ?? lm.nguoi_dung.vai_tro} · ` : ''}
          <span className="font-mono text-xs">{lm.nguoi_dung?.ten_dang_nhap}</span>
        </p>
      </div>
      <div className="min-w-0">
        <Link to={`/tai-lieu/${lm.tai_lieu.id}`} className="line-clamp-2 font-display font-semibold leading-snug text-ink no-underline hover:text-brand-700 hover:underline">
          {lm.tai_lieu.tieu_de}
        </Link>
        <p className="mt-0.5 text-xs text-muted">
          {nhanLoaiHinh(lm.tai_lieu.loai_hinh)} · <span className="font-mono">{lm.tai_lieu.ky_hieu}</span>
          {lm.ma_ban_sao && ` · Bản ${lm.ma_ban_sao}`}
          {' · '}Đăng ký {ngay(lm.ngay_dang_ky)}
          {lm.han_tra && lm.trang_thai === 'dang_muon' && ` · Hạn ${ngay(lm.han_tra)}`}
          {lm.ngay_tra && ` · Trả ${ngay(lm.ngay_tra)}`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        {lm.qua_han && lm.trang_thai === 'dang_muon' && <Badge tone="danger">Quá hạn {Math.abs(conLai ?? 0)} ngày</Badge>}
        {lm.trang_thai === 'cho_duyet' && (
          <>
            <NutXacNhan hd="tu_choi" onXacNhan={() => m.mutate('tu_choi')} dangXuLy={m.isPending && m.variables === 'tu_choi'} />
            <NutXacNhan hd="duyet" onXacNhan={() => m.mutate('duyet')} dangXuLy={m.isPending && m.variables === 'duyet'} />
          </>
        )}
        {lm.trang_thai === 'dang_muon' && <NutXacNhan hd="tra" onXacNhan={() => m.mutate('tra')} dangXuLy={m.isPending} />}
        {(tab === 'da_tra' || tab === 'tu_choi') && <Badge tone={lm.trang_thai === 'da_tra' ? 'ok' : 'neutral'}>{lm.trang_thai === 'da_tra' ? 'Đã trả' : 'Từ chối'}</Badge>}
      </div>
    </li>
  )
}

export function HangDoiMuon() {
  const [tab, setTab] = useState<TabMuon>('cho_duyet')
  const [tim, setTim] = useState('')
  const [trang, setTrang] = useState(1)
  const q = useDebounce(tim.trim(), 300)
  useEffect(() => setTrang(1), [tab, q])

  const hd = useQuery({
    queryKey: ['quan-ly', 'muon', tab, q, trang],
    queryFn: () => quanLyApi.hangDoi({ trang_thai: tab, q, trang }),
    placeholderData: keepPreviousData,
  })
  const dem = hd.data?.dem

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <Tabs
          className="flex-1 lg:border-b-0"
          nhanNhom="Trạng thái lượt mượn"
          muc={TAB.map((t) => ({ khoa: t.khoa, nhan: t.nhan, dem: dem?.[t.khoa], canhBao: t.khoa === 'qua_han' }))}
          dangChon={tab}
          onChon={setTab}
          idPanel="panel-hang-doi"
        />
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={tim}
            onChange={(e) => setTim(e.target.value)}
            placeholder="Tìm bạn đọc hoặc tư liệu"
            aria-label="Tìm trong hàng đợi"
            className="h-10 w-full rounded-md border border-line-strong bg-surface pl-9 pr-8 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
          {tim && (
            <button type="button" onClick={() => setTim('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink" aria-label="Xóa tìm kiếm">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <div className="border-b border-line lg:-mt-px" />

      <div id="panel-hang-doi" role="tabpanel" aria-labelledby={`tab-${tab}`} aria-busy={hd.isFetching} className="mt-4">
        {hd.isPending && (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-[4.5rem] w-full" />
            ))}
          </div>
        )}
        {hd.isError && !hd.data && <ErrorState error={hd.error} onRetry={() => hd.refetch()} />}
        {hd.data && hd.data.du_lieu.length === 0 && (
          <EmptyState
            compact
            title={q ? `Không có kết quả cho “${q}”` : tab === 'cho_duyet' ? 'Không còn lượt nào chờ duyệt' : 'Danh sách trống'}
            description={tab === 'cho_duyet' && !q ? 'Bạn đã xử lý hết hàng đợi. Lượt đăng ký mới sẽ xuất hiện ở đây.' : undefined}
          />
        )}
        {hd.data && hd.data.du_lieu.length > 0 && (
          <>
            <ul className={clsx('divide-y divide-line rounded-xl border border-line bg-surface', hd.isPlaceholderData && 'dang-lam-moi')}>
              {hd.data.du_lieu.map((lm) => (
                <DongMuon key={lm.id} lm={lm} tab={tab} />
              ))}
            </ul>
            <div className="mt-6">
              <PhanTrang trang={hd.data.trang} tongTrang={hd.data.tong_trang} onDoi={setTrang} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
