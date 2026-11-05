// Popover "Vì sao?" cho điểm lan tỏa trong bảng Nên số hóa: liệt kê bản mềm tương tự đã góp điểm.
// Vẽ qua portal với vị trí cố định vì bảng nằm trong vùng cuộn ngang (overflow sẽ cắt popover).
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { HelpCircle, X } from 'lucide-react'
import type { NguonLanToa } from '../../api/types'
import { so } from '../../lib/format'

const RONG = 320

const thapPhan = (v: number, k = 1) => v.toLocaleString('vi-VN', { maximumFractionDigits: k, minimumFractionDigits: 0 })

export function PopoverLanToa({ diem, nguon, tieuDe }: { diem: number; nguon: NguonLanToa[]; tieuDe: string }) {
  const [mo, setMo] = useState(false)
  const [viTri, setViTri] = useState<{ top: number; left: number } | null>(null)
  const nut = useRef<HTMLButtonElement>(null)
  const hop = useRef<HTMLDivElement>(null)
  const id = useId()

  useLayoutEffect(() => {
    if (!mo || !nut.current) return
    const r = nut.current.getBoundingClientRect()
    const left = Math.min(Math.max(8, r.right - RONG), window.innerWidth - RONG - 8)
    setViTri({ top: r.bottom + 6, left: Math.max(8, left) })
  }, [mo])

  useEffect(() => {
    if (!mo) return
    const dong = () => setMo(false)
    const ngoai = (e: PointerEvent) => {
      if (!hop.current?.contains(e.target as Node) && !nut.current?.contains(e.target as Node)) setMo(false)
    }
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMo(false)
        nut.current?.focus()
      }
    }
    document.addEventListener('pointerdown', ngoai)
    document.addEventListener('keydown', phim)
    window.addEventListener('resize', dong)
    window.addEventListener('scroll', dong, true)
    return () => {
      document.removeEventListener('pointerdown', ngoai)
      document.removeEventListener('keydown', phim)
      window.removeEventListener('resize', dong)
      window.removeEventListener('scroll', dong, true)
    }
  }, [mo])

  if (!nguon.length) return null
  const conLai = Math.max(0, diem - nguon.reduce((s, n) => s + n.dong_gop, 0))

  return (
    <>
      <button
        ref={nut}
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-expanded={mo}
        aria-controls={mo ? id : undefined}
        aria-label={`Vì sao «${tieuDe}» có điểm lan tỏa ${thapPhan(diem)}?`}
        className="grid h-6 w-6 place-items-center rounded-full text-muted transition-colors hover:bg-brand-50 hover:text-brand-700 aria-expanded:bg-brand-50 aria-expanded:text-brand-700"
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {mo &&
        viTri &&
        createPortal(
          <div
            ref={hop}
            id={id}
            role="dialog"
            aria-label="Nguồn điểm lan tỏa"
            style={{ top: viTri.top, left: viTri.left, width: RONG }}
            className="pop-vao fixed z-50 rounded-lg border border-line bg-surface p-4 text-left text-sm shadow-lift"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="font-semibold leading-snug text-ink">Vì sao được cộng {thapPhan(diem)} điểm?</p>
              <button type="button" onClick={() => setMo(false)} className="-m-1 grid h-6 w-6 shrink-0 place-items-center rounded text-muted hover:bg-ink/5 hover:text-ink" aria-label="Đóng">
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <p className="mb-3 text-xs text-muted">Bản mềm tương tự đang được đọc: điểm = độ tương tự × ln(1 + lượt đọc).</p>
            <ol className="space-y-2.5">
              {nguon.map((n) => (
                <li key={n.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3">
                  <Link to={`/tai-lieu/${n.id}`} className="line-clamp-2 text-ink no-underline hover:text-brand-700 hover:underline">
                    {n.tieu_de}
                  </Link>
                  <b className="text-right tabular-nums text-ink">+{thapPhan(n.dong_gop)}</b>
                  <span className="col-span-2 text-xs tabular-nums text-muted">
                    {thapPhan(n.diem_tuong_tu, 2)} × ln(1 + {so(n.so_luot_doc)} lượt đọc)
                  </span>
                </li>
              ))}
            </ol>
            {conLai >= 0.05 && <p className="mt-3 border-t border-line pt-2 text-xs text-muted">Còn +{thapPhan(conLai)} từ các bản mềm tương tự khác.</p>}
          </div>,
          document.body,
        )}
    </>
  )
}
