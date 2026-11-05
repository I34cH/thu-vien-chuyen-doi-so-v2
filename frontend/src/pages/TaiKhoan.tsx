import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { AlertTriangle, ArrowRight, Eye, EyeOff, LayoutDashboard, LogOut, Settings2, Sparkles } from 'lucide-react'
import { ApiError } from '../api/client'
import { muonApi } from '../api/endpoints'
import type { LuotMuon, NguoiDung, TrangThaiMuon } from '../api/types'
import { Badge, Button, EmptyState, ErrorState, Input, nutClass, Skeleton, Tabs, useToast } from '../components/ui'
import { useAuth, useDangNhap, useDangXuat } from '../hooks/useAuth'
import { useTieuDe } from '../hooks/useTienIch'
import { nhanLoaiHinh, ngay, soNgayDenHan, TRANG_THAI_MUON, VAI_TRO } from '../lib/format'

export const TAI_KHOAN_DEMO = [
  { ten: 'thuthu', mk: 'thuthu123', nhan: 'Thủ thư' },
  { ten: 'sv01', mk: 'sv123', nhan: 'Sinh viên' },
  { ten: 'gv01', mk: 'gv123', nhan: 'Giảng viên' },
]

/** Chỉ cho phép chuyển tiếp tới đường dẫn nội bộ. */
export function duongDanTiepAnToan(tiep: string | null): string | null {
  if (!tiep) return null
  return tiep.startsWith('/') && !tiep.startsWith('//') ? tiep : null
}

function FormDangNhap() {
  const [ten, setTen] = useState('')
  const [mk, setMk] = useState('')
  const [hienMk, setHienMk] = useState(false)
  const [loiTruong, setLoiTruong] = useState<{ ten?: string; mk?: string }>({})
  const dangNhap = useDangNhap()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const gui = (e: FormEvent) => {
    e.preventDefault()
    const loi: typeof loiTruong = {}
    if (!ten.trim()) loi.ten = 'Nhập tên đăng nhập.'
    if (!mk) loi.mk = 'Nhập mật khẩu.'
    setLoiTruong(loi)
    if (loi.ten || loi.mk) return
    dangNhap.mutate(
      { ten_dang_nhap: ten.trim(), mat_khau: mk },
      {
        onSuccess: ({ nguoi_dung }) => {
          toast.thanhCong(`Xin chào, ${nguoi_dung.ho_ten}`)
          const tiep = duongDanTiepAnToan(sp.get('tiep'))
          if (tiep) navigate(tiep, { replace: true })
          else if (nguoi_dung.nhom === 'thu_thu') navigate('/dashboard', { replace: true })
        },
      },
    )
  }

  const loiChung =
    dangNhap.error instanceof ApiError
      ? dangNhap.error.status === 401 || dangNhap.error.status === 400
        ? 'Tên đăng nhập hoặc mật khẩu chưa đúng.'
        : dangNhap.error.message
      : dangNhap.error
        ? 'Không đăng nhập được. Vui lòng thử lại.'
        : null

  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-line bg-surface shadow-card lg:grid-cols-[1fr_1.1fr]">
      <div className="bg-spines hidden flex-col justify-between bg-brand-700 p-10 text-white lg:flex">
        <div>
          <h2 className="text-3xl font-semibold text-white">Một tài khoản cho cả bạn đọc và thủ thư</h2>
          <p className="mt-4 text-brand-100">
            Bạn đọc đăng ký mượn và theo dõi hạn trả. Thủ thư duyệt mượn, tải bản mềm và xem số liệu để quyết định số hóa.
          </p>
        </div>
        <p className="text-sm text-brand-200">Không cần đăng nhập để tra cứu và đọc bản mềm công khai.</p>
      </div>

      <div className="p-6 sm:p-10">
        <h1 className="text-3xl font-semibold text-brand-700">Đăng nhập</h1>
        <p className="mt-2 text-ink-soft">Dùng tài khoản thư viện được cấp.</p>

        <form onSubmit={gui} noValidate className="mt-8 space-y-5">
          {loiChung && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {loiChung}
            </p>
          )}
          <Input
            label="Tên đăng nhập"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            error={loiTruong.ten}
          />
          <div className="relative">
            <Input
              label="Mật khẩu"
              name="password"
              type={hienMk ? 'text' : 'password'}
              autoComplete="current-password"
              value={mk}
              onChange={(e) => setMk(e.target.value)}
              error={loiTruong.mk}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setHienMk((v) => !v)}
              className="absolute right-1.5 top-[1.9rem] grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink"
              aria-label={hienMk ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={hienMk}
            >
              {hienMk ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          <Button type="submit" size="lg" className="w-full" dangXuLy={dangNhap.isPending}>
            Đăng nhập
          </Button>
        </form>

        <div className="mt-8 rounded-xl border border-dashed border-gold-300 bg-gold-100/40 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Sparkles className="h-4 w-4 text-gold-700" aria-hidden="true" />
            Điền nhanh tài khoản demo
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TAI_KHOAN_DEMO.map((t) => (
              <button
                key={t.ten}
                type="button"
                onClick={() => {
                  setTen(t.ten)
                  setMk(t.mk)
                  setLoiTruong({})
                  dangNhap.reset()
                }}
                className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm transition-colors hover:border-brand-600 hover:text-brand-700"
              >
                <span className="font-semibold">{t.nhan}</span> <span className="font-mono text-xs text-muted">{t.ten}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type TabLuot = TrangThaiMuon
const TAB_LUOT: TabLuot[] = ['dang_muon', 'cho_duyet', 'da_tra', 'tu_choi']

function DongLuotMuon({ lm }: { lm: LuotMuon }) {
  const conLai = soNgayDenHan(lm.han_tra)
  return (
    <li className="grid gap-x-6 gap-y-2 px-4 py-4 sm:grid-cols-[1fr_auto] sm:px-5">
      <div className="min-w-0">
        <p className="text-xs text-muted">
          <span className="font-semibold uppercase tracking-wide text-brand-600">{nhanLoaiHinh(lm.tai_lieu.loai_hinh)}</span>
          <span className="mx-1.5" aria-hidden="true">·</span>
          <span className="font-mono">{lm.tai_lieu.ky_hieu}</span>
          {lm.ma_ban_sao && (
            <>
              <span className="mx-1.5" aria-hidden="true">·</span>Bản {lm.ma_ban_sao}
            </>
          )}
        </p>
        <Link to={`/tai-lieu/${lm.tai_lieu.id}`} className="mt-0.5 block font-display font-semibold leading-snug text-ink no-underline hover:text-brand-700 hover:underline">
          {lm.tai_lieu.tieu_de}
        </Link>
        <p className="mt-1 text-sm text-muted">
          Đăng ký {ngay(lm.ngay_dang_ky)}
          {lm.ngay_muon && ` · Mượn ${ngay(lm.ngay_muon)}`}
          {lm.ngay_tra && ` · Trả ${ngay(lm.ngay_tra)}`}
        </p>
      </div>
      <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:justify-center">
        {lm.trang_thai === 'dang_muon' ? (
          lm.qua_han ? (
            <Badge tone="danger">Quá hạn {Math.abs(conLai ?? 0)} ngày</Badge>
          ) : (
            <Badge tone={conLai !== null && conLai <= 3 ? 'warn' : 'info'}>Còn {conLai} ngày</Badge>
          )
        ) : (
          <Badge tone={lm.trang_thai === 'tu_choi' ? 'neutral' : lm.trang_thai === 'da_tra' ? 'ok' : 'gold'}>{TRANG_THAI_MUON[lm.trang_thai]}</Badge>
        )}
        {lm.han_tra && lm.trang_thai === 'dang_muon' && <span className="text-xs text-muted">Hạn {ngay(lm.han_tra)}</span>}
      </div>
    </li>
  )
}

function LuotMuonCuaToi() {
  const q = useQuery({ queryKey: ['muon-cua-toi'], queryFn: muonApi.cuaToi })
  const [tab, setTab] = useState<TabLuot>('dang_muon')
  if (q.isPending)
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const ds = q.data
  const quaHan = ds.filter((l) => l.qua_han && l.trang_thai === 'dang_muon')
  const loc = ds.filter((l) => l.trang_thai === tab)

  return (
    <div>
      {quaHan.length > 0 && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-danger/25 bg-danger-bg p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p className="font-semibold text-ink">Bạn có {quaHan.length} tư liệu đã quá hạn trả</p>
            <p className="mt-0.5 text-sm text-ink-soft">
              {quaHan.map((l) => l.tai_lieu.tieu_de).slice(0, 2).join('; ')}
              {quaHan.length > 2 && ` và ${quaHan.length - 2} tư liệu khác`}. Vui lòng mang trả thư viện sớm.
            </p>
          </div>
        </div>
      )}
      <Tabs
        nhanNhom="Lượt mượn theo trạng thái"
        muc={TAB_LUOT.map((k) => ({
          khoa: k,
          nhan: TRANG_THAI_MUON[k],
          dem: ds.filter((l) => l.trang_thai === k).length,
          canhBao: k === 'dang_muon' && quaHan.length > 0,
        }))}
        dangChon={tab}
        onChon={setTab}
        idPanel="panel-luot-muon"
      />
      <div id="panel-luot-muon" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-4">
        {loc.length === 0 ? (
          <EmptyState
            compact
            title={tab === 'dang_muon' ? 'Bạn chưa mượn tư liệu nào' : `Không có lượt mượn “${TRANG_THAI_MUON[tab].toLowerCase()}”`}
            description={tab === 'dang_muon' ? 'Tìm tư liệu và bấm “Đăng ký mượn” ở trang chi tiết.' : undefined}
            action={
              tab === 'dang_muon' ? (
                <Link to="/tra-cuu" className={nutClass('primary', 'sm')}>
                  Tra cứu tư liệu
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {loc.map((lm) => (
              <DongLuotMuon key={lm.id} lm={lm} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function HoSo({ nd }: { nd: NguoiDung }) {
  const dangXuat = useDangXuat()
  const toast = useToast()
  const p = nd.ho_ten.trim().split(/\s+/)
  const chuCai = ((p.length > 1 ? p[p.length - 2][0] : '') + (p[p.length - 1]?.[0] ?? '')).toUpperCase()
  return (
    <div className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-center">
      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-600 font-display text-2xl font-semibold text-gold-300">{chuCai}</span>
      <div className="flex-1">
        <h1 className="text-3xl font-semibold text-brand-700">{nd.ho_ten}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-ink-soft">
          <Badge tone={nd.nhom === 'thu_thu' ? 'brand' : 'gold'}>{VAI_TRO[nd.vai_tro] ?? nd.vai_tro}</Badge>
          <span className="font-mono text-sm">{nd.ten_dang_nhap}</span>
        </p>
      </div>
      <Button
        variant="secondary"
        onClick={() => dangXuat.mutate(undefined, { onSettled: () => toast.thongTin('Đã đăng xuất') })}
        dangXuLy={dangXuat.isPending}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Đăng xuất
      </Button>
    </div>
  )
}

export default function TaiKhoan() {
  const { nguoiDung, dangTai } = useAuth()
  useTieuDe(nguoiDung ? 'Tài khoản' : 'Đăng nhập')

  if (dangTai)
    return (
      <div className="mx-auto max-w-5xl space-y-4" aria-busy="true">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  if (!nguoiDung) return <FormDangNhap />

  return (
    <div className="mx-auto max-w-4xl">
      <HoSo nd={nguoiDung} />
      {nguoiDung.nhom === 'nguoi_dung' ? (
        <section aria-labelledby="tieu-de-luot-muon" className="mt-8">
          <h2 id="tieu-de-luot-muon" className="mb-4 text-2xl font-semibold text-brand-700">
            Lượt mượn của tôi
          </h2>
          <LuotMuonCuaToi />
        </section>
      ) : (
        <section aria-label="Lối tắt thủ thư" className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            { to: '/quan-ly', icon: Settings2, t: 'Quản lý', m: 'Duyệt mượn, ghi nhận trả, tải bản mềm và giải nghĩa mã vấn đề.' },
            { to: '/dashboard', icon: LayoutDashboard, t: 'Dashboard', m: 'Từ khóa, lượt tìm, tư liệu nên số hóa và lượt đọc bản mềm.' },
          ].map((l) => (
            <Link key={l.to} to={l.to} className={clsx('group flex gap-4 rounded-xl border border-line bg-surface p-5 no-underline transition-[border-color,box-shadow] hover:border-brand-200 hover:shadow-card')}>
              <l.icon className="h-6 w-6 shrink-0 text-brand-600" aria-hidden="true" />
              <span className="flex-1">
                <span className="flex items-center gap-1 font-semibold text-ink group-hover:text-brand-700">
                  {l.t}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
                <span className="mt-1 block text-sm text-ink-soft">{l.m}</span>
              </span>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
