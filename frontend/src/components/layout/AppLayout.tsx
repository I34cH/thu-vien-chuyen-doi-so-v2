import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { BookMarked, ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, Search, Settings2, User, X } from 'lucide-react'
import { ServerStatus } from './ServerStatus'
import { RanhGioiLoi } from './RanhGioiLoi'
import { useAuth, useDangXuat, type NhomHienTai } from '../../hooks/useAuth'
import { useToast } from '../ui'
import { VAI_TRO } from '../../lib/format'

export const SU_KIEN_HET_PHIEN = 'thu-vien:het-phien'

interface MucMenu {
  to: string
  label: string
  end: boolean
  nhom: NhomHienTai[] | 'tat_ca'
}

export const MUC_MENU: MucMenu[] = [
  { to: '/', label: 'Trang chủ', end: true, nhom: 'tat_ca' },
  { to: '/tra-cuu', label: 'Tra cứu', end: false, nhom: 'tat_ca' },
  { to: '/quan-ly', label: 'Quản lý', end: false, nhom: ['thu_thu'] },
  { to: '/dashboard', label: 'Dashboard', end: false, nhom: ['thu_thu'] },
]

export function menuTheoNhom(nhom: NhomHienTai) {
  return MUC_MENU.filter((m) => m.nhom === 'tat_ca' || m.nhom.includes(nhom))
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#4d0b0b" stroke="#d4af37" strokeWidth="1.2" />
      <path d="M8 9.5c3-1 6-.6 8 1.2 2-1.8 5-2.2 8-1.2v13c-3-1-6-.6-8 1.2-2-1.8-5-2.2-8-1.2z" fill="none" stroke="#d4af37" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 10.7v13" stroke="#d4af37" strokeWidth="1.8" />
    </svg>
  )
}

function chuCaiDau(ten: string) {
  const p = ten.trim().split(/\s+/)
  return ((p.length > 1 ? p[p.length - 2][0] : '') + (p[p.length - 1]?.[0] ?? '')).toUpperCase()
}

const lienKet = ({ isActive }: { isActive: boolean }) =>
  clsx(
    'relative rounded-md px-3 py-2 text-sm font-semibold no-underline transition-colors',
    isActive
      ? 'bg-white/[0.14] text-white after:absolute after:inset-x-3 after:-bottom-[13px] after:h-[3px] after:rounded-t after:bg-gold-500'
      : 'text-brand-100 hover:bg-white/10 hover:text-white',
  )

function MenuNguoiDung() {
  const { nguoiDung, nhom } = useAuth()
  const dangXuat = useDangXuat()
  const toast = useToast()
  const navigate = useNavigate()
  const [mo, setMo] = useState(false)
  const goc = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mo) return
    const onDown = (e: PointerEvent) => {
      if (goc.current && !goc.current.contains(e.target as Node)) setMo(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMo(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [mo])

  if (!nguoiDung) {
    return (
      <Link
        to="/tai-khoan"
        className="inline-flex h-9 items-center gap-2 rounded-md bg-gold-500 px-3.5 text-sm font-semibold text-brand-900 no-underline transition-colors hover:bg-gold-300"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Đăng nhập
      </Link>
    )
  }

  const thoat = () =>
    dangXuat.mutate(undefined, {
      onSettled: () => {
        setMo(false)
        toast.thongTin('Đã đăng xuất', 'Hẹn gặp lại bạn.')
        navigate('/')
      },
    })

  return (
    <div ref={goc} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={mo}
        onClick={() => setMo((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-white transition-colors hover:bg-white/10"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-500 text-xs font-bold text-brand-900">
          {chuCaiDau(nguoiDung.ho_ten)}
        </span>
        <span className="hidden max-w-36 truncate text-sm font-semibold lg:block">{nguoiDung.ho_ten}</span>
        <ChevronDown className={clsx('h-4 w-4 transition-transform', mo && 'rotate-180')} aria-hidden="true" />
        <span className="an-truc-quan">Mở menu tài khoản</span>
      </button>
      {mo && (
        <div role="menu" className="pop-vao absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-1.5 text-ink shadow-lift">
          <div className="px-3 py-2.5">
            <p className="truncate font-semibold">{nguoiDung.ho_ten}</p>
            <p className="text-sm text-muted">
              {VAI_TRO[nguoiDung.vai_tro] ?? nguoiDung.vai_tro} · {nguoiDung.ten_dang_nhap}
            </p>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link role="menuitem" to="/tai-khoan" onClick={() => setMo(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink no-underline hover:bg-brand-50">
            <User className="h-4 w-4 text-muted" aria-hidden="true" />
            {nhom === 'nguoi_dung' ? 'Tài khoản và lượt mượn' : 'Tài khoản'}
          </Link>
          {nhom === 'thu_thu' && (
            <>
              <Link role="menuitem" to="/quan-ly" onClick={() => setMo(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink no-underline hover:bg-brand-50">
                <Settings2 className="h-4 w-4 text-muted" aria-hidden="true" />
                Quản lý mượn và số hóa
              </Link>
              <Link role="menuitem" to="/dashboard" onClick={() => setMo(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink no-underline hover:bg-brand-50">
                <LayoutDashboard className="h-4 w-4 text-muted" aria-hidden="true" />
                Dashboard
              </Link>
            </>
          )}
          <div className="my-1 h-px bg-line" />
          <button
            role="menuitem"
            type="button"
            onClick={thoat}
            disabled={dangXuat.isPending}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-danger-bg"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}

export function AppLayout() {
  const [mo, setMo] = useState(false)
  const { nhom } = useAuth()
  const location = useLocation()
  const toast = useToast()
  const menu = menuTheoNhom(nhom)

  // Đóng menu điện thoại và đưa focus về nội dung khi đổi trang
  useEffect(() => {
    setMo(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  // Phiên hết hạn (401 ở bất kỳ API nào khi đang đăng nhập)
  useEffect(() => {
    const bao = () => toast.loi('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại để tiếp tục.')
    window.addEventListener(SU_KIEN_HET_PHIEN, bao)
    return () => window.removeEventListener(SU_KIEN_HET_PHIEN, bao)
  }, [toast])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#noi-dung"
        className="fixed left-4 top-2 z-[200] -translate-y-20 rounded-md bg-gold-500 px-4 py-2 font-semibold text-brand-900 transition-transform focus:translate-y-0"
      >
        Bỏ qua đến nội dung chính
      </a>

      <header className="bg-spines sticky top-0 z-50 bg-brand-700 text-white shadow-[0_1px_0_rgb(0_0_0/0.15),0_6px_16px_-10px_rgb(40_5_5/0.6)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5 no-underline" aria-label="Thư viện Khoa, về trang chủ">
            <Logo />
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold text-white">Thư viện Khoa</span>
              <span className="hidden text-[0.7rem] text-brand-200 sm:block">Tra cứu · chuyển đổi số tư liệu</span>
            </span>
          </NavLink>

          <nav aria-label="Điều hướng chính" className="ml-4 hidden items-center gap-1 md:flex">
            {menu.map((m) => (
              <NavLink key={m.to} to={m.to} end={m.end} className={lienKet}>
                {m.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {location.pathname !== '/' && location.pathname !== '/tra-cuu' && (
              <Link
                to="/tra-cuu"
                className="hidden h-9 items-center gap-2 rounded-md px-3 text-sm text-brand-100 no-underline hover:bg-white/10 hover:text-white lg:inline-flex"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Tìm tư liệu
              </Link>
            )}
            <MenuNguoiDung />
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-md text-white hover:bg-white/10 md:hidden"
              aria-expanded={mo}
              aria-controls="menu-dien-thoai"
              aria-label={mo ? 'Đóng menu' : 'Mở menu'}
              onClick={() => setMo((v) => !v)}
            >
              {mo ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
        {mo && (
          <nav id="menu-dien-thoai" aria-label="Điều hướng chính (điện thoại)" className="pop-vao border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
            {menu.map((m) => (
              <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => clsx(lienKet({ isActive }), 'block py-3 text-base')}>
                {m.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main id="noi-dung" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 outline-none sm:px-6 sm:py-10">
        <RanhGioiLoi khoa={location.pathname}>
          <Outlet />
        </RanhGioiLoi>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-brand-600" aria-hidden="true" />
            Thư viện Khoa · Đề tài Trực quan hóa dữ liệu
          </p>
          <ServerStatus />
        </div>
      </footer>
    </div>
  )
}
