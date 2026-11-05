// ECharts nạp theo phần (tree-shaking) + chủ đề dùng chung cho mọi biểu đồ dashboard.
import * as echarts from 'echarts/core'
import { BarChart, GraphChart, LineChart, ThemeRiverChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  SingleAxisComponent,
  TooltipComponent,
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  LineChart,
  ThemeRiverChart,
  GraphChart,
  GridComponent,
  SingleAxisComponent,
  LegendComponent,
  TooltipComponent,
  MarkAreaComponent,
  SVGRenderer,
])

export { echarts }

/**
 * Bảng màu phân loại (thứ tự cố định, đã chạy validate_palette.js của skill dataviz ở chế độ sáng, nền #ffffff:
 * đạt dải sáng, độ bão hòa, tách biệt khi mù màu ΔE ≥ 16, tương phản ≥ 3:1).
 * Vàng kim gốc #d4af37 quá nhạt trên nền trắng (2,3:1) nên dùng bậc đậm #a87b0f cho nét/biểu đồ.
 */
export const MAU = {
  s1: '#9b1c1c', // đỏ chủ đạo: chuỗi chính
  s2: '#a87b0f', // vàng kim đậm: chuỗi thứ hai
  s3: '#2f6db5', // xanh: chuỗi thứ ba (lượt đọc)
  mo: '#d9cfc4', // phần không được chọn (làm nổi một mục, làm mờ phần còn lại)
  luoi: '#efe8df',
  chu: '#4a4040',
  chuPhu: '#566274',
  nen: '#ffffff',
} as const

/**
 * Bảng màu chủ đề (chặng 5): 8 ô theo thứ tự cố định, 3 ô đầu trùng MAU.s1–s3.
 * validate_palette.js --mode light --surface #ffffff: dải sáng, độ bão hòa, sàn thị lực thường (ΔE ≥ 21,3),
 * tương phản ≥ 3:1 đều đạt; tách biệt mù màu cặp kề #1b8a6b↔#d0672a ΔE 7,8 (WARN, mức 6–8) nên luôn kèm mã
 * thứ cấp: chú giải có nhãn, tooltip ghi tên chủ đề và bảng số liệu.
 * Chủ đề thứ 9 trở đi không sinh màu mới mà gộp vào "Khác" (xám ấm).
 */
export const MAU_CHU_DE = ['#9b1c1c', '#a87b0f', '#2f6db5', '#d0672a', '#1b8a6b', '#7c4dbd', '#5b8c2a', '#c2457a'] as const
export const MAU_KHAC = '#b5aca1'
export const NHAN_KHAC = 'Khác'

/**
 * Gán màu cố định theo chủ đề (màu đi theo thực thể, không theo hạng trong bộ lọc hiện tại):
 * 8 chủ đề có nhiều tư liệu nhất trong kho nhận 8 màu, còn lại là "Khác". Đổi bộ lọc không đổi màu.
 */
export function bangMauChuDe(chuDe: { id: number; so_tai_lieu: number }[]): Map<number, string> {
  const sap = [...chuDe].sort((a, b) => b.so_tai_lieu - a.so_tai_lieu || a.id - b.id)
  return new Map(sap.slice(0, MAU_CHU_DE.length).map((c, i) => [c.id, MAU_CHU_DE[i]]))
}

export const PHONG_CHU = "'Be Vietnam Pro', system-ui, sans-serif"

export const tooltipChung = {
  backgroundColor: '#ffffff',
  borderColor: '#e7dfd5',
  borderWidth: 1,
  padding: [8, 12],
  textStyle: { color: MAU.chu, fontFamily: PHONG_CHU, fontSize: 12 },
  extraCssText: 'box-shadow: 0 2px 4px rgb(60 20 20 / .08), 0 12px 28px -10px rgb(60 20 20 / .18); border-radius: 8px;',
}

export const trucChung = {
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: { color: MAU.chuPhu, fontFamily: PHONG_CHU, fontSize: 11 },
  splitLine: { lineStyle: { color: MAU.luoi, width: 1, type: 'solid' as const } },
}

/** Chuỗi dùng trong tooltip — thoát ký tự HTML vì nhãn đến từ dữ liệu. */
export function thoat(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

/** Một dòng tooltip: nét màu ngắn + giá trị đậm + tên chuỗi. */
export function dongTooltip(mau: string, giaTri: string, ten: string, net: 'line' | 'rect' = 'line'): string {
  const key =
    net === 'line'
      ? `<span style="display:inline-block;width:12px;height:2px;background:${mau};vertical-align:middle;margin-right:8px;border-radius:1px"></span>`
      : `<span style="display:inline-block;width:8px;height:8px;background:${mau};vertical-align:middle;margin-right:8px;border-radius:2px"></span>`
  return `<div style="display:flex;align-items:center;gap:4px;line-height:1.7">${key}<b style="color:#231a1a;font-variant-numeric:tabular-nums">${thoat(giaTri)}</b><span style="color:${MAU.chuPhu};margin-left:4px">${thoat(ten)}</span></div>`
}
