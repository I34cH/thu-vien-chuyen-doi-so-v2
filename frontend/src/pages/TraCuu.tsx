import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { Check, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { traCuuApi } from '../api/endpoints'
import type { SapXep, TaiLieuTomTat } from '../api/types'
import { SearchBox } from '../components/search/SearchBox'
import { TheKetQua, TheKetQuaKhung } from '../components/tai-lieu/TheKetQua'
import { Button, EmptyState, ErrorState } from '../components/ui'
import { PhanTrang } from '../components/ui/PhanTrang'
import { useBoLocTraCuu } from '../hooks/useBoLocTraCuu'
import { useTieuDe } from '../hooks/useTienIch'
import { demBoLocDangBat, khoangThapNien, type BoLocTraCuu } from '../lib/boLoc'
import { nhanLoaiHinh, so } from '../lib/format'

const SAP_XEP: { gt: SapXep; nhan: string }[] = [
  { gt: 'lien_quan', nhan: 'Liên quan nhất' },
  { gt: 'moi_nhat', nhan: 'Mới nhất' },
  { gt: 'cu_nhat', nhan: 'Cũ nhất' },
]

function NhomLoc({ tieuDe, children }: { tieuDe: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-line pb-5 pt-5 first:pt-0 last:border-b-0">
      <legend className="float-left mb-2 w-full text-xs font-semibold uppercase tracking-wider text-muted">{tieuDe}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  )
}

function MucFacet({ chon, nhan, dem, onClick }: { chon: boolean; nhan: string; dem?: number; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={chon}
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        chon ? 'bg-brand-600 font-semibold text-white' : 'text-ink-soft hover:bg-brand-50 hover:text-ink',
      )}
    >
      <span className="flex-1 truncate">{nhan}</span>
      {dem !== undefined && <span className={clsx('tabular-nums text-xs', chon ? 'text-white/85' : 'text-muted')}>{so(dem)}</span>}
    </button>
  )
}

function CongTac({ bat, nhan, onDoi }: { bat: boolean; nhan: string; onDoi: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm text-ink-soft hover:bg-brand-50">
      {nhan}
      <span className="relative inline-flex">
        <input type="checkbox" role="switch" checked={bat} onChange={(e) => onDoi(e.target.checked)} className="peer an-truc-quan" />
        <span
          aria-hidden="true"
          className="h-5 w-9 rounded-full bg-line-strong transition-colors peer-checked:bg-brand-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600"
        />
        <span aria-hidden="true" className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  )
}

function KhoangNam({ boLoc, datBoLoc }: { boLoc: BoLocTraCuu; datBoLoc: (p: Partial<BoLocTraCuu>) => void }) {
  const [tu, setTu] = useState(boLoc.tu_nam?.toString() ?? '')
  const [den, setDen] = useState(boLoc.den_nam?.toString() ?? '')
  const id = useId()
  useEffect(() => {
    setTu(boLoc.tu_nam?.toString() ?? '')
    setDen(boLoc.den_nam?.toString() ?? '')
  }, [boLoc.tu_nam, boLoc.den_nam])
  const apDung = () => {
    const a = Number.parseInt(tu, 10)
    const b = Number.parseInt(den, 10)
    let tuNam = Number.isFinite(a) ? a : null
    let denNam = Number.isFinite(b) ? b : null
    if (tuNam && denNam && tuNam > denNam) [tuNam, denNam] = [denNam, tuNam]
    if (tuNam !== boLoc.tu_nam || denNam !== boLoc.den_nam) datBoLoc({ tu_nam: tuNam, den_nam: denNam })
  }
  const o = 'h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm tabular-nums focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20'
  return (
    <form
      className="mt-3 flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        apDung()
      }}
    >
      <label className="flex-1 text-xs text-muted" htmlFor={`${id}-tu`}>
        Từ năm
        <input id={`${id}-tu`} inputMode="numeric" maxLength={4} value={tu} onChange={(e) => setTu(e.target.value.replace(/\D/g, ''))} onBlur={apDung} className={o} placeholder="1975" />
      </label>
      <label className="flex-1 text-xs text-muted" htmlFor={`${id}-den`}>
        Đến năm
        <input id={`${id}-den`} inputMode="numeric" maxLength={4} value={den} onChange={(e) => setDen(e.target.value.replace(/\D/g, ''))} onBlur={apDung} className={o} placeholder="2025" />
      </label>
      <button type="submit" className="an-truc-quan">Áp dụng khoảng năm</button>
    </form>
  )
}

export default function TraCuu() {
  const { boLoc, datBoLoc, xoaBoLoc, chuoi } = useBoLocTraCuu()
  const [moLoc, setMoLoc] = useState(false)
  const dauTrang = useRef<HTMLDivElement>(null)
  // Nhớ log_id của trang 1 theo truy vấn: các trang sau không ghi log mới nhưng vẫn cần ghi tư liệu được chọn
  const logTheoTruyVan = useRef(new Map<string, number>())

  useTieuDe(boLoc.q ? `“${boLoc.q}”` : 'Tra cứu')

  const kq = useQuery({
    queryKey: ['tim-kiem', boLoc],
    queryFn: () => traCuuApi.timKiem(boLoc),
    placeholderData: keepPreviousData,
  })

  const khoaTruyVan = JSON.stringify({ ...boLoc, trang: 1 })
  useEffect(() => {
    if (kq.data?.log_id) logTheoTruyVan.current.set(khoaTruyVan, kq.data.log_id)
  }, [kq.data, khoaTruyVan])

  const onChon = (tl: TaiLieuTomTat) => {
    const logId = kq.data?.log_id ?? logTheoTruyVan.current.get(khoaTruyVan)
    if (logId) traCuuApi.chon(logId, tl.id)
  }

  const doiTrang = (t: number) => {
    datBoLoc({ trang: t })
    dauTrang.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const soLoc = demBoLocDangBat(boLoc)
  const data = kq.data
  const dangLamMoi = kq.isFetching && kq.isPlaceholderData

  const chips: { nhan: string; xoa: () => void }[] = []
  if (boLoc.loai) chips.push({ nhan: nhanLoaiHinh(boLoc.loai), xoa: () => datBoLoc({ loai: '' }) })
  if (boLoc.tu_nam || boLoc.den_nam)
    chips.push({
      nhan: `${boLoc.tu_nam ?? '…'}–${boLoc.den_nam ?? '…'}`,
      xoa: () => datBoLoc({ tu_nam: null, den_nam: null }),
    })
  if (boLoc.co_ban_mem) chips.push({ nhan: 'Có bản mềm', xoa: () => datBoLoc({ co_ban_mem: false }) })
  if (boLoc.con_ban) chips.push({ nhan: 'Còn bản để mượn', xoa: () => datBoLoc({ con_ban: false }) })

  const thapNienChon = boLoc.tu_nam && boLoc.den_nam && boLoc.den_nam - boLoc.tu_nam === 9 && boLoc.tu_nam % 10 === 0 ? String(boLoc.tu_nam) : null

  const panelLoc = (
    <div>
      <NhomLoc tieuDe="Loại hình">
        <div className="space-y-0.5">
          {(data?.facet.loai_hinh ?? []).map((f) => (
            <MucFacet
              key={f.gia_tri}
              chon={boLoc.loai === f.gia_tri}
              nhan={nhanLoaiHinh(f.gia_tri)}
              dem={f.so_luong}
              onClick={() => datBoLoc({ loai: boLoc.loai === f.gia_tri ? '' : f.gia_tri })}
            />
          ))}
          {!data && Array.from({ length: 6 }, (_, i) => <span key={i} className="skeleton my-1 block h-7 rounded-md" aria-hidden="true" />)}
        </div>
      </NhomLoc>
      <NhomLoc tieuDe="Thập niên">
        <div className="flex flex-wrap gap-1.5">
          {(data?.facet.thap_nien ?? []).map((f) => {
            const chon = thapNienChon === String(Math.floor(Number(f.gia_tri) / 10) * 10)
            return (
              <button
                key={f.gia_tri}
                type="button"
                aria-pressed={chon}
                onClick={() => {
                  const k = khoangThapNien(f.gia_tri)
                  if (!k) return
                  datBoLoc(chon ? { tu_nam: null, den_nam: null } : k)
                }}
                className={clsx(
                  'rounded-md border px-2 py-1 text-xs tabular-nums transition-colors',
                  chon ? 'border-brand-600 bg-brand-600 font-semibold text-white' : 'border-line-strong text-ink-soft hover:border-brand-600 hover:text-brand-700',
                )}
              >
                {f.gia_tri.slice(0, 3)}x <span className={chon ? 'text-white/80' : 'text-muted'}>{so(f.so_luong)}</span>
              </button>
            )
          })}
        </div>
        <KhoangNam boLoc={boLoc} datBoLoc={datBoLoc} />
      </NhomLoc>
      <NhomLoc tieuDe="Tình trạng">
        <CongTac bat={boLoc.co_ban_mem} nhan="Có bản mềm" onDoi={(v) => datBoLoc({ co_ban_mem: v })} />
        <CongTac bat={boLoc.con_ban} nhan="Còn bản để mượn" onDoi={(v) => datBoLoc({ con_ban: v })} />
      </NhomLoc>
    </div>
  )

  return (
    <div ref={dauTrang} className="scroll-mt-24">
      <h1 className="an-truc-quan">Tra cứu tư liệu</h1>
      <div className="mx-auto max-w-3xl lg:mx-0 lg:ml-[18rem] lg:max-w-none">
        <SearchBox giaTriBanDau={boLoc.q} onTimKiem={(q) => datBoLoc({ q })} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-10">
        {/* Bộ lọc: cột trái trên desktop, gập lại trên điện thoại */}
        <aside aria-label="Bộ lọc kết quả" className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between lg:hidden">
            <Button variant="secondary" size="sm" onClick={() => setMoLoc((v) => !v)} aria-expanded={moLoc} aria-controls="panel-loc">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Bộ lọc{soLoc > 0 && ` (${soLoc})`}
            </Button>
          </div>
          <div id="panel-loc" className={clsx('mt-3 rounded-xl border border-line bg-surface p-4 lg:mt-0 lg:block lg:border-0 lg:bg-transparent lg:p-0', moLoc ? 'block' : 'hidden')}>
            {panelLoc}
            {soLoc > 0 && (
              <button type="button" onClick={xoaBoLoc} className="mt-2 text-sm font-semibold text-brand-600 hover:underline">
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
        </aside>

        <section aria-labelledby="tieu-de-ket-qua" aria-busy={kq.isFetching}>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
            <h2 id="tieu-de-ket-qua" className="font-sans text-base font-normal text-ink-soft" aria-live="polite">
              {data ? (
                <>
                  <strong className="text-2xl font-semibold text-ink tabular-nums">{so(data.tong_so)}</strong> kết quả
                  {boLoc.q && (
                    <>
                      {' '}cho <strong className="font-semibold text-ink">“{boLoc.q}”</strong>
                    </>
                  )}
                </>
              ) : kq.isError ? (
                'Không tải được kết quả'
              ) : (
                'Đang tìm…'
              )}
            </h2>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              Sắp xếp
              <select
                value={boLoc.sap_xep}
                onChange={(e) => datBoLoc({ sap_xep: e.target.value as SapXep })}
                className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              >
                {SAP_XEP.map((s) => (
                  <option key={s.gt} value={s.gt}>
                    {s.nhan}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {chips.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Bộ lọc đang áp dụng">
              {chips.map((c) => (
                <li key={c.nhan}>
                  <button
                    type="button"
                    onClick={c.xoa}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1 pl-3 pr-2 text-sm text-brand-700 transition-colors hover:border-brand-600"
                    aria-label={`Bỏ lọc ${c.nhan}`}
                  >
                    {c.nhan}
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Gõ sai: như các công cụ tìm kiếm phổ biến, mặc định hiện kết quả của cụm đã sửa, kèm lối tìm chính xác cụm gốc */}
          {data?.da_sua ? (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-gold-100/70 px-4 py-3 text-ink" data-testid="da-sua">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-gold-700" aria-hidden="true" />
              <span className="min-w-0">
                Đang hiện kết quả cho <b className="font-semibold">{data.da_sua}</b>.{' '}
                <span className="text-ink-soft">Tìm chính xác</span>{' '}
                <button type="button" onClick={() => datBoLoc({ chinh_xac: true })} className="break-words font-semibold text-brand-700 underline decoration-brand-600/40 underline-offset-2 hover:decoration-brand-600">
                  “{boLoc.q}”
                </button>
              </span>
            </p>
          ) : (
            data?.goi_y_sua && (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-gold-100/70 px-4 py-3 text-ink" data-testid="goi-y-sua">
                <Sparkles className="mt-1 h-4 w-4 shrink-0 text-gold-700" aria-hidden="true" />
                <span className="min-w-0">
                  {boLoc.chinh_xac && <>Đang hiện kết quả chính xác cho “{boLoc.q}”. </>}
                  Có phải bạn muốn tìm{' '}
                  <button type="button" onClick={() => datBoLoc({ q: data.goi_y_sua!, chinh_xac: false })} className="font-semibold text-brand-700 underline decoration-brand-600/40 underline-offset-2 hover:decoration-brand-600">
                    {data.goi_y_sua}
                  </button>
                  ?
                </span>
              </p>
            )
          )}

          <div className={clsx('mt-2', dangLamMoi && 'dang-lam-moi')}>
            {kq.isPending && Array.from({ length: 6 }, (_, i) => <TheKetQuaKhung key={i} />)}
            {kq.isError && !data && <div className="mt-6"><ErrorState error={kq.error} onRetry={() => kq.refetch()} /></div>}
            {data && data.du_lieu.length === 0 && (
              <EmptyState
                className="mt-6"
                title={boLoc.q ? `Chưa tìm thấy “${boLoc.q}”` : 'Không có tư liệu phù hợp'}
                description={
                  <ul className="mx-auto mt-1 max-w-sm list-disc space-y-1 pl-5 text-left text-sm">
                    <li>Thử từ khóa ngắn hơn hoặc từ đồng nghĩa.</li>
                    <li>Gõ không dấu vẫn được: “luu tru”, “van ban”.</li>
                    {soLoc > 0 && <li>Bỏ bớt bộ lọc đang bật ({soLoc}).</li>}
                    <li>Lượt tìm này đã được ghi lại để thủ thư cân nhắc bổ sung tư liệu.</li>
                  </ul>
                }
                action={
                  <>
                    {soLoc > 0 && (
                      <Button variant="primary" size="sm" onClick={xoaBoLoc}>
                        Xóa bộ lọc
                      </Button>
                    )}
                    <Link to="/tra-cuu" className="inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold text-brand-700 no-underline hover:bg-brand-50">
                      Xem toàn bộ danh mục
                    </Link>
                  </>
                }
              />
            )}
            {data?.du_lieu.map((tl) => (
              <TheKetQua key={tl.id} tl={tl} q={data.da_sua ?? boLoc.q} onChon={onChon} tuTrang={`/tra-cuu${chuoi ? `?${chuoi}` : ''}`} />
            ))}
          </div>

          {data && data.tong_trang > 1 && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <PhanTrang trang={data.trang} tongTrang={data.tong_trang} onDoi={doiTrang} />
              <p className="text-xs text-muted tabular-nums">
                Trang {data.trang}/{data.tong_trang} · {so((data.trang - 1) * data.kich_thuoc + 1)}–{so(Math.min(data.tong_so, data.trang * data.kich_thuoc))} trong {so(data.tong_so)}
              </p>
            </div>
          )}
          {data && data.du_lieu.length > 0 && (
            <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Kết quả gồm cả cách viết không dấu và gõ sai nhẹ.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
