// Ô tìm kiếm có gợi ý khi gõ (mẫu ARIA combobox + listbox có nhóm).
// Bàn phím: ↑/↓ di chuyển, Enter chọn (hoặc tìm), Esc đóng gợi ý rồi xóa ô.
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { ArrowUpRight, BookOpen, CornerDownLeft, Loader2, Search, TrendingUp, X } from 'lucide-react'
import { traCuuApi } from '../../api/endpoints'
import { nhanLoaiHinh, so } from '../../lib/format'
import { ToDam } from '../../lib/highlight'
import { useDebounce } from '../../hooks/useTienIch'

type LuaChon =
  | { loai: 'tai_lieu'; id: number; nhan: string; phu: string }
  | { loai: 'tu_khoa'; nhan: string; phu: string }
  | { loai: 'tim'; nhan: string }

export interface SearchBoxProps {
  giaTriBanDau?: string
  onTimKiem: (q: string) => void
  kichThuoc?: 'lon' | 'vua'
  autoFocus?: boolean
  placeholder?: string
  nhan?: string
  /** Độ trễ gọi gợi ý (ms). */
  doTre?: number
}

export function SearchBox({
  giaTriBanDau = '',
  onTimKiem,
  kichThuoc = 'vua',
  autoFocus,
  placeholder = 'Tên tư liệu, tác giả, ký hiệu… (gõ không dấu cũng được)',
  nhan = 'Tìm tư liệu',
  doTre = 200,
}: SearchBoxProps) {
  const [giaTri, setGiaTri] = useState(giaTriBanDau)
  const [mo, setMo] = useState(false)
  const [chiSo, setChiSo] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const goc = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const id = useId()
  const idListbox = `${id}-goi-y`

  // Đồng bộ khi URL đổi (ví dụ bấm từ khóa nổi bật)
  useEffect(() => setGiaTri(giaTriBanDau), [giaTriBanDau])

  const q = useDebounce(giaTri.trim(), doTre)
  const duDai = q.length >= 2
  const goiY = useQuery({
    queryKey: ['goi-y', q],
    queryFn: ({ signal }) => traCuuApi.goiY(q, signal),
    enabled: duDai && mo,
    staleTime: 60_000,
    placeholderData: (truoc) => truoc,
  })

  const luaChon: LuaChon[] = useMemo(() => {
    if (!duDai || !goiY.data) return []
    const tl: LuaChon[] = goiY.data.tai_lieu.map((t) => ({
      loai: 'tai_lieu',
      id: t.id,
      nhan: t.tieu_de,
      phu: [nhanLoaiHinh(t.loai_hinh), t.nam].filter(Boolean).join(' · '),
    }))
    const tk: LuaChon[] = goiY.data.tu_khoa.map((k) => ({
      loai: 'tu_khoa',
      nhan: k.tu_khoa,
      phu: `${so(k.so_lan)} lượt tìm`,
    }))
    return [...tl, ...tk, { loai: 'tim', nhan: q }]
  }, [goiY.data, duDai, q])

  const hienDanhSach = mo && duDai && luaChon.length > 0
  const nhomTaiLieu = luaChon.filter((l) => l.loai === 'tai_lieu')
  const nhomTuKhoa = luaChon.filter((l) => l.loai === 'tu_khoa')

  useEffect(() => setChiSo(-1), [q])

  // Giữ mục đang chọn trong vùng nhìn thấy khi danh sách cuộn
  useEffect(() => {
    if (chiSo < 0) return
    document.getElementById(`${id}-lc-${chiSo}`)?.scrollIntoView({ block: 'nearest' })
  }, [chiSo, id])

  // Đóng khi bấm ra ngoài
  useEffect(() => {
    if (!mo) return
    const onDown = (e: PointerEvent) => {
      if (goc.current && !goc.current.contains(e.target as Node)) setMo(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [mo])

  const chon = (l: LuaChon) => {
    setMo(false)
    setChiSo(-1)
    if (l.loai === 'tai_lieu') {
      navigate(`/tai-lieu/${l.id}`)
      return
    }
    setGiaTri(l.nhan)
    onTimKiem(l.nhan)
  }

  const gui = (e?: FormEvent) => {
    e?.preventDefault()
    setMo(false)
    onTimKiem(giaTri.trim())
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = luaChon.length
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!mo) setMo(true)
        if (n) setChiSo((i) => (i + 1) % n)
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!mo) setMo(true)
        if (n) setChiSo((i) => (i <= 0 ? n - 1 : i - 1))
        break
      case 'Enter':
        if (hienDanhSach && chiSo >= 0 && chiSo < n) {
          e.preventDefault()
          chon(luaChon[chiSo])
        }
        break
      case 'Escape':
        if (hienDanhSach) {
          e.preventDefault()
          setMo(false)
          setChiSo(-1)
        } else if (giaTri) {
          e.preventDefault()
          setGiaTri('')
        }
        break
      case 'Tab':
        setMo(false)
        break
    }
  }

  const idLuaChon = (i: number) => `${id}-lc-${i}`
  const lon = kichThuoc === 'lon'
  const dangTai = goiY.isFetching && duDai && mo

  const renderLuaChon = (l: LuaChon) => {
    const i = luaChon.indexOf(l)
    const active = i === chiSo
    return (
      <li
        key={idLuaChon(i)}
        id={idLuaChon(i)}
        role="option"
        aria-selected={active}
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => chon(l)}
        onPointerMove={() => setChiSo(i)}
        className={clsx(
          'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2',
          active ? 'bg-brand-50 text-ink' : 'text-ink-soft',
        )}
      >
        {l.loai === 'tai_lieu' && <BookOpen className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />}
        {l.loai === 'tu_khoa' && <TrendingUp className="h-4 w-4 shrink-0 text-gold-700" aria-hidden="true" />}
        {l.loai === 'tim' && <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
        <span className="min-w-0 flex-1">
          {l.loai === 'tim' ? (
            <span className="text-sm">
              Tìm tất cả kết quả cho <strong className="font-semibold text-ink">“{l.nhan}”</strong>
            </span>
          ) : (
            <>
              <span className="block truncate text-sm text-ink">
                <ToDam text={l.nhan} query={q} className="bg-transparent font-bold text-brand-700" />
              </span>
              <span className="block text-xs text-muted">{l.phu}</span>
            </>
          )}
        </span>
        {active &&
          (l.loai === 'tai_lieu' ? (
            <ArrowUpRight className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          ) : (
            <CornerDownLeft className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          ))}
      </li>
    )
  }

  return (
    <div ref={goc} className="relative w-full">
      <form role="search" onSubmit={gui} className="relative">
        <label htmlFor={`${id}-o`} className="an-truc-quan">
          {nhan}
        </label>
        <Search
          className={clsx('pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted', lon ? 'left-4 h-5 w-5 sm:left-5 sm:h-6 sm:w-6' : 'left-3.5 h-5 w-5')}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={`${id}-o`}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          aria-autocomplete="list"
          aria-expanded={hienDanhSach}
          aria-controls={idListbox}
          aria-activedescendant={hienDanhSach && chiSo >= 0 ? idLuaChon(chiSo) : undefined}
          value={giaTri}
          placeholder={placeholder}
          onChange={(e) => {
            setGiaTri(e.target.value)
            setMo(true)
          }}
          onFocus={() => setMo(true)}
          onKeyDown={onKeyDown}
          className={clsx(
            'w-full appearance-none rounded-xl border bg-surface text-ink placeholder:text-muted',
            'border-line-strong shadow-card transition-[border-color,box-shadow] duration-150',
            'focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15',
            '[&::-webkit-search-cancel-button]:hidden',
            lon ? 'h-14 pl-12 pr-[5.5rem] text-base sm:h-16 sm:pl-14 sm:pr-36 sm:text-lg' : 'h-12 pl-11 pr-28 text-base',
          )}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {dangTai && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden="true" />}
          {giaTri && (
            <button
              type="button"
              onClick={() => {
                setGiaTri('')
                inputRef.current?.focus()
              }}
              className="rounded-md p-1.5 text-muted hover:bg-ink/5 hover:text-ink"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="submit"
            className={clsx(
              'rounded-lg bg-brand-600 font-semibold text-white transition-colors hover:bg-brand-700',
              lon ? 'h-10 px-4 text-base sm:h-12 sm:px-6' : 'h-9 px-4 text-sm',
            )}
          >
            Tìm
          </button>
        </div>
      </form>

      <div
        className={clsx(
          'absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-lift',
          hienDanhSach ? 'pop-vao block' : 'hidden',
        )}
      >
        <ul id={idListbox} role="listbox" aria-label="Gợi ý tìm kiếm" className="max-h-[min(26rem,60vh)] overflow-y-auto p-2">
          {nhomTaiLieu.length > 0 && (
            <li role="presentation">
              <p id={`${id}-nhom-tl`} className="px-3 pb-1 pt-1.5 text-xs font-semibold text-muted">
                Tư liệu
              </p>
              <ul role="group" aria-labelledby={`${id}-nhom-tl`}>
                {nhomTaiLieu.map(renderLuaChon)}
              </ul>
            </li>
          )}
          {nhomTuKhoa.length > 0 && (
            <li role="presentation" className={nhomTaiLieu.length ? 'mt-1 border-t border-line pt-1' : ''}>
              <p id={`${id}-nhom-tk`} className="px-3 pb-1 pt-1.5 text-xs font-semibold text-muted">
                Từ khóa phổ biến
              </p>
              <ul role="group" aria-labelledby={`${id}-nhom-tk`}>
                {nhomTuKhoa.map(renderLuaChon)}
              </ul>
            </li>
          )}
          <li role="presentation" className="mt-1 border-t border-line pt-1">
            <ul role="group" aria-label="Tìm kiếm">
              {luaChon.filter((l) => l.loai === 'tim').map(renderLuaChon)}
            </ul>
          </li>
        </ul>
        <p className="hidden items-center gap-3 border-t border-line bg-paper px-4 py-2 text-xs text-muted sm:flex" aria-hidden="true">
          <span><kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> di chuyển</span>
          <span><kbd className="kbd">Enter</kbd> chọn</span>
          <span><kbd className="kbd">Esc</kbd> đóng</span>
        </p>
      </div>
      <p className="an-truc-quan" aria-live="polite">
        {hienDanhSach ? `${luaChon.length - 1} gợi ý. Dùng phím mũi tên để chọn.` : ''}
      </p>
    </div>
  )
}
