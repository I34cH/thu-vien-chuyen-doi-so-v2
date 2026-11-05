// Số hóa: chọn tư liệu (ô tìm /quan-ly/tai-lieu), kéo-thả PDF, chọn mức truy cập, xem tiến trình tải lên.
import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { CheckCircle2, FileUp, FileText, Globe2, Lock, Search, X } from 'lucide-react'
import { thongDiepLoi } from '../../api/client'
import { quanLyApi, traCuuApi } from '../../api/endpoints'
import type { MucTruyCap, TaiLieuChiTiet, TaiLieuTomTat } from '../../api/types'
import { Button, ErrorState, Skeleton, useToast } from '../../components/ui'
import { NhanBanMem } from '../../components/tai-lieu/NhanTaiLieu'
import { useDebounce } from '../../hooks/useTienIch'
import { nhanLoaiHinh, so } from '../../lib/format'
import { ToDam } from '../../lib/highlight'

const GIOI_HAN_MB = 20

export function kiemTraPdf(f: File): string | null {
  const laPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
  if (!laPdf) return 'Chỉ nhận tệp PDF.'
  if (f.size > GIOI_HAN_MB * 1024 * 1024) return `Tệp lớn hơn ${GIOI_HAN_MB} MB.`
  if (f.size === 0) return 'Tệp rỗng.'
  return null
}

function ChonTaiLieu({ onChon }: { onChon: (t: TaiLieuTomTat) => void }) {
  const [tim, setTim] = useState('')
  const q = useDebounce(tim.trim(), 250)
  const id = useId()
  const kq = useQuery({
    queryKey: ['quan-ly', 'tai-lieu', q],
    queryFn: () => quanLyApi.timTaiLieu(q),
    enabled: q.length >= 2,
    staleTime: 30_000,
  })
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-ink-soft">
        Tìm tư liệu cần số hóa
      </label>
      <div className="relative mt-1.5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={tim}
          onChange={(e) => setTim(e.target.value)}
          placeholder="Tiêu đề, tác giả hoặc ký hiệu"
          className="h-11 w-full rounded-md border border-line-strong bg-surface pl-10 pr-3 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
        />
      </div>
      <div className="mt-3" aria-live="polite">
        {q.length < 2 && <p className="text-sm text-muted">Gõ ít nhất 2 ký tự. Hoặc chọn từ bảng “Nên số hóa” ở Dashboard.</p>}
        {kq.isFetching && !kq.data && <Skeleton className="h-32 w-full" />}
        {kq.isError && <ErrorState compact error={kq.error} onRetry={() => kq.refetch()} />}
        {kq.data && kq.data.du_lieu.length === 0 && <p className="text-sm text-muted">Không có tư liệu khớp “{q}”.</p>}
        {kq.data && kq.data.du_lieu.length > 0 && (
          <ul className="max-h-80 divide-y divide-line overflow-y-auto rounded-lg border border-line">
            {kq.data.du_lieu.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => onChon(t)} className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-brand-50">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-snug text-ink">
                      <ToDam text={t.tieu_de} query={q} className="bg-transparent text-brand-700" />
                    </span>
                    <span className="text-xs text-muted">
                      {nhanLoaiHinh(t.loai_hinh)} · <span className="font-mono">{t.ky_hieu}</span>
                      {t.nam ? ` · ${t.nam}` : ''}
                    </span>
                  </span>
                  {t.co_ban_mem && <NhanBanMem tl={t} />}
                </button>
              </li>
            ))}
          </ul>
        )}
        {kq.data && kq.data.tong_so > kq.data.du_lieu.length && (
          <p className="mt-2 text-xs text-muted">Hiện {kq.data.du_lieu.length}/{so(kq.data.tong_so)} kết quả. Gõ cụ thể hơn để thu hẹp.</p>
        )}
      </div>
    </div>
  )
}

export function TaiBanMem({ taiLieuId, onDoiTaiLieu }: { taiLieuId: number | null; onDoiTaiLieu: (id: number | null) => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [loiFile, setLoiFile] = useState<string | null>(null)
  const [muc, setMuc] = useState<MucTruyCap>('cong_khai')
  const [keo, setKeo] = useState(false)
  const [tienTrinh, setTienTrinh] = useState(0)
  const [xong, setXong] = useState<TaiLieuChiTiet | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const tl = useQuery({
    queryKey: ['tai-lieu', taiLieuId],
    queryFn: () => traCuuApi.chiTiet(taiLieuId!),
    enabled: !!taiLieuId,
  })

  useEffect(() => {
    setXong(null)
    setFile(null)
    setTienTrinh(0)
  }, [taiLieuId])

  const tai = useMutation({
    mutationFn: () => quanLyApi.taiBanMem(taiLieuId!, file!, muc, setTienTrinh),
    onSuccess: (kq) => {
      setXong(kq)
      setFile(null)
      qc.setQueryData(['tai-lieu', taiLieuId], kq)
      void qc.invalidateQueries({ queryKey: ['thong-ke'] })
      void qc.invalidateQueries({ queryKey: ['gioi-thieu'] })
      toast.thanhCong('Đã tải bản mềm lên', kq.tieu_de)
    },
    onError: (e) => {
      setTienTrinh(0)
      toast.loi('Tải lên thất bại', thongDiepLoi(e))
    },
  })

  const nhanFile = (f: File | undefined) => {
    if (!f) return
    const loi = kiemTraPdf(f)
    setLoiFile(loi)
    setFile(loi ? null : f)
    setXong(null)
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setKeo(false)
    nhanFile(e.dataTransfer.files?.[0])
  }

  if (!taiLieuId) return <ChonTaiLieu onChon={(t) => onDoiTaiLieu(t.id)} />

  const t = tl.data
  return (
    <div className="space-y-6">
      {/* Tư liệu đã chọn */}
      <div className="rounded-xl border border-line bg-paper/60 p-4">
        {tl.isPending && <Skeleton className="h-14 w-full" />}
        {tl.isError && <ErrorState compact error={tl.error} onRetry={() => tl.refetch()} />}
        {t && (
          <div className="flex items-start gap-3">
            <FileText className="mt-1 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">
                {nhanLoaiHinh(t.loai_hinh)} · <span className="font-mono">{t.ky_hieu}</span>
                {t.nam ? ` · ${t.nam}` : ''}
              </p>
              <Link to={`/tai-lieu/${t.id}`} className="font-display font-semibold leading-snug text-ink no-underline hover:text-brand-700 hover:underline">
                {t.tieu_de}
              </Link>
              <div className="mt-1.5">
                {t.co_ban_mem ? <NhanBanMem tl={t} /> : <span className="text-xs text-muted">Chưa có bản mềm</span>}
              </div>
            </div>
            <Button variant="quiet" size="sm" onClick={() => onDoiTaiLieu(null)}>
              Đổi tư liệu
            </Button>
          </div>
        )}
      </div>

      {t?.co_ban_mem && !xong && (
        <p className="rounded-lg bg-warn-bg px-4 py-3 text-sm text-ink">Tư liệu đã có bản mềm. Tải tệp mới sẽ thay thế bản hiện có.</p>
      )}

      {xong ? (
        <div role="status" className="flex flex-col items-center gap-3 rounded-xl border border-ok/25 bg-ok-bg px-6 py-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-ok" aria-hidden="true" />
          <p className="text-lg font-semibold text-ink">Đã số hóa xong</p>
          <p className="max-w-md text-sm text-ink-soft">Bạn đọc có thể mở bản mềm ngay ở trang chi tiết. Lượt đọc sẽ được tính vào dashboard.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link to={`/tai-lieu/${xong.id}`} className="inline-flex h-9 items-center rounded-md bg-brand-600 px-3 text-sm font-semibold text-white no-underline hover:bg-brand-700">
              Xem trang tư liệu
            </Link>
            <Button variant="secondary" size="sm" onClick={() => onDoiTaiLieu(null)}>
              Số hóa tư liệu khác
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Vùng kéo-thả */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setKeo(true)
            }}
            onDragLeave={() => setKeo(false)}
            onDrop={onDrop}
            className={clsx(
              'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
              keo ? 'border-brand-600 bg-brand-50' : loiFile ? 'border-danger/50 bg-danger-bg/40' : 'border-line-strong bg-surface',
            )}
          >
            <FileUp className={clsx('h-9 w-9', keo ? 'text-brand-600' : 'text-muted')} aria-hidden="true" />
            {file ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">{file.name}</span>
                <span className="text-sm text-muted">{(file.size / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB</span>
                <button type="button" onClick={() => setFile(null)} className="rounded p-1 text-muted hover:text-ink" aria-label="Bỏ tệp đã chọn" disabled={tai.isPending}>
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <>
                <p className="font-semibold text-ink">Kéo thả tệp PDF vào đây</p>
                <p className="text-sm text-muted">hoặc</p>
              </>
            )}
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={tai.isPending}>
              {file ? 'Chọn tệp khác' : 'Chọn tệp từ máy'}
            </Button>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="an-truc-quan" tabIndex={-1} aria-label="Chọn tệp PDF" onChange={(e) => nhanFile(e.target.files?.[0] ?? undefined)} />
            <p className="text-xs text-muted">PDF, tối đa {GIOI_HAN_MB} MB.</p>
            {loiFile && (
              <p role="alert" className="text-sm font-semibold text-danger">
                {loiFile}
              </p>
            )}
          </div>

          {/* Mức truy cập */}
          <fieldset>
            <legend className="text-sm font-semibold text-ink-soft">Ai được đọc bản mềm?</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {(
                [
                  { gt: 'cong_khai', icon: Globe2, t: 'Công khai', m: 'Mọi người, kể cả khách không đăng nhập.' },
                  { gt: 'noi_bo', icon: Lock, t: 'Nội bộ', m: 'Chỉ bạn đọc đã đăng nhập.' },
                ] as const
              ).map((o) => (
                <label
                  key={o.gt}
                  className={clsx(
                    'flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600',
                    muc === o.gt ? 'border-brand-600 bg-brand-50/60' : 'border-line-strong hover:border-brand-200',
                  )}
                >
                  <input type="radio" name="muc_truy_cap" value={o.gt} checked={muc === o.gt} onChange={() => setMuc(o.gt)} className="an-truc-quan" />
                  <o.icon className={clsx('mt-0.5 h-5 w-5 shrink-0', muc === o.gt ? 'text-brand-600' : 'text-muted')} aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-ink">{o.t}</span>
                    <span className="text-sm text-ink-soft">{o.m}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {tai.isPending && (
            <div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-ink">Đang tải lên…</span>
                <span className="tabular-nums text-ink-soft">{tienTrinh}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Tiến trình tải lên" aria-valuemin={0} aria-valuemax={100} aria-valuenow={tienTrinh}>
                <div className="h-full rounded-full bg-brand-600 transition-[width] duration-200" style={{ width: `${tienTrinh}%` }} />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button size="lg" onClick={() => tai.mutate()} disabled={!file || !t} dangXuLy={tai.isPending}>
              <FileUp className="h-5 w-5" aria-hidden="true" />
              Tải bản mềm lên
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
