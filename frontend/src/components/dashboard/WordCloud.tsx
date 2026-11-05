// Word cloud tự dựng: bố cục bằng d3-cloud v2 (echarts-wordcloud chỉ hỗ trợ echarts ^5),
// vẽ bằng SVG để mỗi từ là một nút bấm được bằng chuột và bàn phím (lọc chéo dashboard).
import { useEffect, useMemo, useRef, useState } from 'react'
import CloudLayout from 'd3-cloud'
import type { TuKhoaThongKe } from '../../api/types'
import { so } from '../../lib/format'

interface TuDaDat {
  tu: TuKhoaThongKe
  x: number
  y: number
  size: number
}

/** Bộ sinh số giả ngẫu nhiên cố định (mulberry32) để bố cục lặp lại giữa các lần vẽ. */
function taoRandom(seed = 42) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Màu tuần tự một sắc độ: từ ít (đỏ xám, vẫn đạt tương phản 4,5:1) đến nhiều (đỏ chủ đạo đậm). */
function mauTheoTanSuat(t: number): string {
  const tu = [140, 104, 104] // #8c6868
  const den = [107, 16, 16] // #6b1010
  const c = tu.map((v, i) => Math.round(v + (den[i] - v) * t))
  return `rgb(${c[0]} ${c[1]} ${c[2]})`
}

const FONT = "'Be Vietnam Pro', system-ui, sans-serif"

export function WordCloud({
  du_lieu,
  dangChon,
  onChon,
  cao = 300,
}: {
  du_lieu: TuKhoaThongKe[]
  dangChon: string
  onChon: (tuKhoa: string) => void
  cao?: number
}) {
  const khung = useRef<HTMLDivElement>(null)
  const [rong, setRong] = useState(0)
  const [daDat, setDaDat] = useState<TuDaDat[]>([])
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    const el = khung.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setRong(Math.round(e.contentRect.width)))
    ro.observe(el)
    setRong(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const max = useMemo(() => Math.max(1, ...du_lieu.map((d) => d.so_lan)), [du_lieu])
  const min = useMemo(() => Math.min(max, ...du_lieu.map((d) => d.so_lan)), [du_lieu, max])

  useEffect(() => {
    if (!rong || !du_lieu.length) return
    let huy = false
    const ve = () => {
      const lon = Math.min(52, Math.max(28, rong / 11))
      const nho = rong < 420 ? 11 : 13
      const coChu = (n: number) => {
        // Thang căn bậc hai: diện tích chữ tỉ lệ với tần suất
        const t = max === min ? 1 : (Math.sqrt(n) - Math.sqrt(min)) / (Math.sqrt(max) - Math.sqrt(min))
        return Math.round(nho + t * (lon - nho))
      }
      const layout = new CloudLayout().size([rong, cao]).overflow(false).random(taoRandom(42))
      const ketQua: TuDaDat[] = []
      const ds = [...du_lieu].sort((a, b) => b.so_lan - a.so_lan)
      for (const tu of ds) {
        const size = coChu(tu.so_lan)
        const sprite = layout.getSprite(tu.hien_thi, { size, font: FONT, fontWeight: size > 24 ? 700 : 600, padding: 3, rotate: 0, datum: tu })
        if (!sprite) continue
        const p = layout.place(sprite)
        if (p) ketQua.push({ tu, x: p.x, y: p.y, size })
      }
      if (!huy) setDaDat(ketQua)
    }
    // Đợi font tải xong để đo kích thước chữ đúng
    if (document.fonts?.ready) void document.fonts.ready.then(ve)
    else ve()
    return () => {
      huy = true
    }
  }, [du_lieu, rong, cao, max, min])

  const dangHover = daDat.find((d) => d.tu.tu_khoa === hover)

  return (
    <div ref={khung} className="relative w-full" style={{ height: cao }}>
      {rong > 0 && (
        <svg width={rong} height={cao} viewBox={`${-rong / 2} ${-cao / 2} ${rong} ${cao}`} role="group" aria-label={`Word cloud ${daDat.length} từ khóa, cỡ chữ theo số lượt tìm`}>
          {daDat.map(({ tu, x, y, size }) => {
            const chon = tu.tu_khoa === dangChon
            const mo = !!dangChon && !chon
            const t = max === min ? 1 : (tu.so_lan - min) / (max - min)
            return (
              <text
                key={tu.tu_khoa}
                role="button"
                tabIndex={0}
                aria-pressed={chon}
                aria-label={`${tu.hien_thi}: ${so(tu.so_lan)} lượt tìm`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                onClick={() => onChon(chon ? '' : tu.tu_khoa)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onChon(chon ? '' : tu.tu_khoa)
                  }
                }}
                onPointerEnter={() => setHover(tu.tu_khoa)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(tu.tu_khoa)}
                onBlur={() => setHover(null)}
                className="wc-tu cursor-pointer outline-none"
                style={{
                  fontFamily: FONT,
                  fontSize: size,
                  fontWeight: size > 24 ? 700 : 600,
                  fill: chon ? '#6b1010' : mauTheoTanSuat(t),
                  opacity: mo ? 0.28 : hover && hover !== tu.tu_khoa ? 0.6 : 1,
                  textDecoration: chon ? 'underline' : undefined,
                  textDecorationColor: chon ? '#d4af37' : undefined,
                  transition: 'opacity 160ms ease-out',
                }}
              >
                {tu.hien_thi}
              </text>
            )
          })}
        </svg>
      )}
      {dangHover && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lift"
          style={{ left: Math.min(rong - 160, Math.max(0, dangHover.x + rong / 2 - 70)), top: Math.max(0, dangHover.y + cao / 2 - dangHover.size - 46) }}
          aria-hidden="true"
        >
          <p className="font-semibold text-ink">{dangHover.tu.hien_thi}</p>
          <p className="tabular-nums text-ink-soft">
            <b className="text-ink">{so(dangHover.tu.so_lan)}</b> lượt tìm
            {dangHover.tu.so_lan_khong_kq > 0 && ` · ${so(dangHover.tu.so_lan_khong_kq)} không có kết quả`}
          </p>
        </div>
      )}
    </div>
  )
}
