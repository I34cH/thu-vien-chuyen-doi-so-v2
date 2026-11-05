// Đồ thị tư liệu được mượn cùng nhau (chặng 5): ECharts graph, bố cục lực, kéo/zoom được.
// Nút = tư liệu (kích thước theo lượt mượn, màu theo chủ đề), cạnh = số bạn đọc mượn cả hai (độ dày theo trọng số).
import { useId, useMemo } from 'react'
import type { MuonCungNhau, NutMuon } from '../../api/types'
import { MAU, MAU_KHAC, NHAN_KHAC, PHONG_CHU, thoat, tooltipChung } from '../../lib/echarts'
import { nhanLoaiHinh, so } from '../../lib/format'
import { ChartEC, giamChuyenDong, type SuKien } from './BieuDo'
import { ChuGiaiChuDe } from './BieuDoChuDe'

/** Ngưỡng tối thiểu: một cặp chỉ nối khi có ít nhất 2 bạn đọc chung (1 bạn đọc dễ là trùng hợp; API trả 400 nếu < 2). */
export const NGUONG_TOI_THIEU = 2

const SO_NHAN_TRUC_TIEP = 6
const CO_NHO = 10
const CO_LON = 34

export function mauNut(n: NutMuon, mau: Map<number, string>): string {
  return (n.chu_de && mau.get(n.chu_de.id)) || MAU_KHAC
}

/** Kích thước nút theo căn bậc hai lượt mượn (diện tích tỉ lệ với giá trị). */
export function coNut(soLuot: number, lonNhat: number): number {
  if (lonNhat <= 0) return CO_NHO
  return Math.round(CO_NHO + (CO_LON - CO_NHO) * Math.sqrt(Math.max(0, soLuot) / lonNhat))
}

/** Độ dày cạnh 1–6px theo trọng số trong khoảng đang hiển thị. */
export function doDayCanh(w: number, nho: number, lon: number): number {
  if (lon <= nho) return 2
  return Math.round((1 + ((w - nho) / (lon - nho)) * 5) * 10) / 10
}

/** Chú giải: các chủ đề có mặt trong đồ thị, theo thứ tự ô màu; chủ đề không có màu gộp "Khác". */
export function chuGiaiDoThi(nut: NutMuon[], mau: Map<number, string>) {
  const theoMau = new Map<string, { khoa: string; ten: string; mau: string; tong: number }>()
  for (const n of nut) {
    const m = mauNut(n, mau)
    const khoa = m === MAU_KHAC ? 'khac' : String(n.chu_de!.id)
    const ten = m === MAU_KHAC ? NHAN_KHAC : n.chu_de!.nhan
    const cu = theoMau.get(khoa) ?? { khoa, ten, mau: m, tong: 0 }
    cu.tong += 1
    theoMau.set(khoa, cu)
  }
  const thuTu = [...mau.values()]
  return [...theoMau.values()].sort((a, b) => {
    const ia = a.mau === MAU_KHAC ? 99 : thuTu.indexOf(a.mau)
    const ib = b.mau === MAU_KHAC ? 99 : thuTu.indexOf(b.mau)
    return ia - ib
  })
}

export function DoThiMuon({
  du_lieu,
  mau,
  nguong,
  onDoiNguong,
  onMo,
}: {
  du_lieu: MuonCungNhau
  mau: Map<number, string>
  nguong: number
  onDoiNguong: (n: number) => void
  onMo: (id: number) => void
}) {
  const id = useId()
  const { nut, canh } = du_lieu
  const lonNhatThanhTruot = Math.max(NGUONG_TOI_THIEU, du_lieu.trong_so_lon_nhat)

  const option = useMemo(() => {
    const maxMuon = Math.max(1, ...nut.map((n) => n.so_luot_muon))
    const ws = canh.map((c) => c.trong_so)
    const wMin = Math.min(...ws, nguong)
    const wMax = Math.max(...ws, nguong)
    const coNhan = new Set([...nut].sort((a, b) => b.so_luot_muon - a.so_luot_muon).slice(0, SO_NHAN_TRUC_TIEP).map((n) => n.id))
    const theoId = new Map(nut.map((n) => [n.id, n]))
    // Màn hẹp (điện thoại): thu nhỏ khung nhìn và lực đẩy để cả đồ thị lọt vào khung
    const hep = typeof window !== 'undefined' && window.innerWidth < 640
    const ngan = (s: string, k = 26) => (s.length > k ? `${s.slice(0, k - 1).trimEnd()}…` : s)
    return {
      animation: !giamChuyenDong(),
      tooltip: {
        ...tooltipChung,
        trigger: 'item',
        confine: true,
        formatter: (p: { dataType: string; data: { id?: string; source?: string; target?: string; value?: number } }) => {
          if (p.dataType === 'edge') {
            const a = theoId.get(Number(p.data.source))
            const b = theoId.get(Number(p.data.target))
            return (
              `<div style="max-width:280px;white-space:normal"><b style="color:#231a1a;font-variant-numeric:tabular-nums">${so(p.data.value ?? 0)}</b> bạn đọc mượn cả hai` +
              `<div style="color:${MAU.chuPhu};margin-top:4px">${thoat(a?.ten ?? '')}<br/>${thoat(b?.ten ?? '')}</div></div>`
            )
          }
          const n = theoId.get(Number(p.data.id))
          if (!n) return ''
          const m = mauNut(n, mau)
          return (
            `<div style="max-width:300px;white-space:normal">` +
            `<div style="font-weight:600;line-height:1.4;margin-bottom:4px">${thoat(n.tieu_de)}</div>` +
            `<div style="color:${MAU.chuPhu}">${thoat(n.ky_hieu)} · ${thoat(nhanLoaiHinh(n.loai_hinh))}</div>` +
            `<div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${m}"></span>${thoat(n.chu_de?.nhan ?? 'Chưa có chủ đề')}</div>` +
            `<div style="margin-top:4px"><b style="color:#231a1a;font-variant-numeric:tabular-nums">${so(n.so_luot_muon)}</b> lượt mượn</div>` +
            `<div style="color:${MAU.chuPhu};margin-top:4px;font-size:11px">Bấm để mở trang tư liệu</div></div>`
          )
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          roam: true,
          draggable: true,
          cursor: 'pointer',
          zoom: hep ? 0.62 : 1,
          scaleLimit: { min: 0.3, max: 4 },
          force: {
            repulsion: hep ? 110 : 160,
            gravity: hep ? 0.14 : 0.09,
            edgeLength: hep ? [28, 80] : [36, 110],
            friction: 0.15,
            layoutAnimation: !giamChuyenDong(),
          },
          label: { position: 'right', color: MAU.chu, fontFamily: PHONG_CHU, fontSize: 11, distance: 4 },
          labelLayout: { hideOverlap: true },
          lineStyle: { color: '#a99c8d', opacity: 0.5, curveness: 0.06 },
          emphasis: {
            focus: 'adjacency',
            label: { show: true, fontWeight: 600 },
            lineStyle: { opacity: 0.95, color: '#6f6357' },
          },
          blur: { itemStyle: { opacity: 0.18 }, lineStyle: { opacity: 0.06 }, label: { show: false } },
          data: nut.map((n) => ({
            id: String(n.id),
            name: ngan(n.ten),
            value: n.so_luot_muon,
            symbolSize: coNut(n.so_luot_muon, maxMuon),
            itemStyle: { color: mauNut(n, mau), borderColor: '#ffffff', borderWidth: 1.5 },
            label: { show: coNhan.has(n.id) },
          })),
          links: canh.map((c) => ({
            source: String(c.nguon),
            target: String(c.dich),
            value: c.trong_so,
            lineStyle: { width: doDayCanh(c.trong_so, wMin, wMax) },
          })),
        },
      ],
    }
  }, [nut, canh, mau, nguong])

  const onEvents: SuKien = {
    click: (p) => {
      const q = p as { dataType?: string; data?: { id?: string } }
      if (q.dataType === 'node' && q.data?.id) onMo(Number(q.data.id))
    },
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <label htmlFor={`${id}-nguong`} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ink-soft sm:w-auto">
          <span className="whitespace-nowrap">
            Nối khi có ≥ <b className="tabular-nums text-ink">{nguong}</b> bạn đọc chung
          </span>
          <input
            id={`${id}-nguong`}
            type="range"
            min={NGUONG_TOI_THIEU}
            max={lonNhatThanhTruot}
            step={1}
            value={Math.max(NGUONG_TOI_THIEU, Math.min(nguong, lonNhatThanhTruot))}
            onChange={(e) => onDoiNguong(Number(e.target.value))}
            className="h-1.5 w-full max-w-[14rem] cursor-pointer accent-brand-600 sm:w-40"
            aria-valuetext={`ít nhất ${nguong} bạn đọc mượn chung`}
          />
        </label>
        {nut.length > 0 && (
          <p className="text-xs tabular-nums text-muted" aria-live="polite">
            {so(nut.length)} tư liệu · {so(canh.length)} cặp
            {du_lieu.tong_so_nut > nut.length && ` · hiện ${so(nut.length)}/${so(du_lieu.tong_so_nut)} tư liệu nối nhiều nhất`}
          </p>
        )}
      </div>

      {nut.length === 0 ? (
        <div className="grid h-[340px] place-items-center rounded-lg border border-dashed border-line-strong text-center text-sm text-muted">
          <p className="max-w-xs px-4">
            Không có cặp tư liệu nào được từ {nguong} bạn đọc trở lên cùng mượn trong khoảng và bộ lọc này.
            {du_lieu.trong_so_lon_nhat >= NGUONG_TOI_THIEU && nguong > NGUONG_TOI_THIEU && ' Thử hạ ngưỡng hoặc mở rộng khoảng ngày.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg bg-paper/50">
            <ChartEC
              option={option}
              onEvents={onEvents}
              cao={360}
              nhan={`Đồ thị mạng ${nut.length} tư liệu và ${canh.length} cặp được mượn cùng nhau, ngưỡng ${nguong} bạn đọc`}
            />
          </div>
          <ChuGiaiChuDe dong={chuGiaiDoThi(nut, mau)} />
        </>
      )}
    </div>
  )
}
