// Các biểu đồ ECharts của dashboard. Màu theo MAU (đã kiểm tra bằng validator của skill dataviz).
import { useMemo } from 'react'
import EChartsReactCore from 'echarts-for-react/esm/core'
import type { DiemTheoNgay, TheoLoaiHinh, TuKhoaThongKe } from '../../api/types'
import { echarts, dongTooltip, MAU, PHONG_CHU, thoat, tooltipChung, trucChung } from '../../lib/echarts'
import { LOAI_HINH, ngay, ngayNgan, so } from '../../lib/format'

export type SuKien = Record<string, (p: { name?: string; data?: unknown; dataIndex?: number }) => void>

export function ChartEC({ option, onEvents, cao = 288, nhan }: { option: object; onEvents?: SuKien; cao?: number; nhan: string }) {
  return (
    <div role="img" aria-label={nhan}>
      <EChartsReactCore
        echarts={echarts}
        option={option}
        notMerge
        lazyUpdate
        onEvents={onEvents}
        opts={{ renderer: 'svg' }}
        style={{ height: cao, width: '100%' }}
      />
    </div>
  )
}

export const giamChuyenDong = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* ---------------- Lượt tìm theo ngày (đường; ngày đang cập nhật nét đứt) ---------------- */
export function BieuDoTheoNgay({ du_lieu }: { du_lieu: DiemTheoNgay[] }) {
  const option = useMemo(() => {
    const ngays = du_lieu.map((d) => d.ngay)
    const k = du_lieu.findIndex((d) => d.dang_cap_nhat)
    const coCapNhat = k >= 0
    const tach = (lay: (d: DiemTheoNgay) => number) => {
      const lien = du_lieu.map((d, i) => (!coCapNhat || i < k ? lay(d) : null))
      const dut = du_lieu.map((d, i) => (coCapNhat && i >= Math.max(0, k - 1) ? lay(d) : null))
      return { lien, dut }
    }
    const tim = tach((d) => d.so_luot)
    const khong = tach((d) => d.so_luot_khong_kq)
    // Nhãn trực tiếp chỉ ở điểm cuối của mỗi chuỗi
    const nhan = (laNhanCuoi: boolean) => ({
      show: laNhanCuoi,
      formatter: (p: { value: number }) => so(p.value),
      color: MAU.chu,
      fontFamily: PHONG_CHU,
      fontSize: 11,
      fontWeight: 600,
      distance: 6,
    })
    const chuoi = (ten: string, mau: string, du: (number | null)[], dut: boolean) => ({
      name: ten,
      type: 'line' as const,
      data: du,
      showSymbol: false,
      symbol: 'circle',
      symbolSize: 8,
      connectNulls: false,
      lineStyle: { width: 2, color: mau, type: dut ? ('dashed' as const) : ('solid' as const) },
      itemStyle: { color: mau, borderColor: '#fff', borderWidth: 2 },
      emphasis: { focus: 'none' as const, scale: true },
      endLabel: nhan(dut || !coCapNhat),
      // Chuỗi nét đứt (ngày đang cập nhật) có null ở mọi điểm trước k-1. Khi có hiệu ứng vẽ dần, ECharts dời
      // endLabel theo mép vùng cắt và nội suy y tại các điểm null -> <text transform="translate(x NaN)"> (lỗi console
      // trên Dashboard). Chuỗi này chỉ có 2 điểm nên tắt hiệu ứng riêng cho nó: nhãn đặt thẳng ở điểm cuối.
      ...(dut ? { animation: false } : {}),
      z: dut ? 2 : 3,
    })
    const nhanNgay = du_lieu.length > 45 ? 10 : du_lieu.length > 14 ? 4 : 0
    return {
      animation: !giamChuyenDong(),
      animationDuration: 500,
      grid: { left: 8, right: 44, top: 36, bottom: 4, containLabel: true },
      legend: {
        top: 0,
        left: 0,
        icon: 'path://M0,4 L14,4 L14,6 L0,6 Z',
        itemWidth: 14,
        itemHeight: 6,
        itemGap: 18,
        textStyle: { color: MAU.chu, fontFamily: PHONG_CHU, fontSize: 12 },
        data: ['Lượt tìm', 'Không có kết quả'],
      },
      tooltip: {
        ...tooltipChung,
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#cfc4b6', width: 1 } },
        formatter: (ps: { dataIndex: number }[]) => {
          const i = ps[0]?.dataIndex ?? 0
          const d = du_lieu[i]
          if (!d) return ''
          return (
            `<div style="font-weight:600;margin-bottom:4px">${thoat(ngay(d.ngay))}${d.dang_cap_nhat ? ' <span style="color:#a16207;font-weight:500">· đang cập nhật</span>' : ''}</div>` +
            dongTooltip(MAU.s1, so(d.so_luot), 'lượt tìm') +
            dongTooltip(MAU.s2, so(d.so_luot_khong_kq), 'không có kết quả')
          )
        },
      },
      xAxis: {
        type: 'category',
        data: ngays,
        boundaryGap: false,
        ...trucChung,
        axisLine: { show: true, lineStyle: { color: '#e7dfd5' } },
        splitLine: { show: false },
        axisLabel: { ...trucChung.axisLabel, interval: nhanNgay, formatter: (v: string) => ngayNgan(v) },
      },
      yAxis: { type: 'value', ...trucChung, minInterval: 1, splitNumber: 4 },
      series: [
        chuoi('Lượt tìm', MAU.s1, tim.lien, false),
        ...(coCapNhat ? [chuoi('Lượt tìm', MAU.s1, tim.dut, true)] : []),
        chuoi('Không có kết quả', MAU.s2, khong.lien, false),
        ...(coCapNhat ? [chuoi('Không có kết quả', MAU.s2, khong.dut, true)] : []),
      ],
    }
  }, [du_lieu])
  const tong = du_lieu.reduce((s, d) => s + d.so_luot, 0)
  return <ChartEC option={option} nhan={`Biểu đồ đường lượt tìm theo ngày, ${du_lieu.length} ngày, tổng ${so(tong)} lượt`} />
}

/* ---------------- Top từ khóa (cột ngang, bấm để lọc chéo) ---------------- */
export function BieuDoTopTuKhoa({
  du_lieu,
  dangChon,
  onChon,
}: {
  du_lieu: TuKhoaThongKe[]
  dangChon: string
  onChon: (tuKhoa: string) => void
}) {
  const top = useMemo(() => du_lieu.slice(0, 15), [du_lieu])
  const option = useMemo(() => {
    const dao = [...top].reverse() // ECharts vẽ trục y từ dưới lên
    return {
      animation: !giamChuyenDong(),
      animationDuration: 400,
      grid: { left: 4, right: 40, top: 4, bottom: 4, containLabel: true },
      tooltip: {
        ...tooltipChung,
        trigger: 'item',
        formatter: (p: { dataIndex: number }) => {
          const d = dao[p.dataIndex]
          return (
            `<div style="font-weight:600;margin-bottom:4px">${thoat(d.hien_thi)}</div>` +
            dongTooltip(MAU.s1, so(d.so_lan), 'lượt tìm', 'rect') +
            (d.so_lan_khong_kq ? dongTooltip(MAU.s2, so(d.so_lan_khong_kq), 'lượt không có kết quả', 'rect') : '') +
            `<div style="color:${MAU.chuPhu};margin-top:4px;font-size:11px">Bấm để lọc cả dashboard</div>`
          )
        },
      },
      xAxis: { type: 'value', ...trucChung, splitNumber: 3, minInterval: 1 },
      yAxis: {
        type: 'category',
        data: dao.map((d) => d.hien_thi),
        ...trucChung,
        axisLabel: {
          ...trucChung.axisLabel,
          color: MAU.chu,
          fontSize: 12,
          width: 132,
          overflow: 'truncate',
          fontWeight: (v: string) => (dao.find((d) => d.hien_thi === v)?.tu_khoa === dangChon ? 700 : 400),
        },
        triggerEvent: true,
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 14,
          barCategoryGap: '30%',
          cursor: 'pointer',
          data: dao.map((d) => ({
            value: d.so_lan,
            itemStyle: {
              color: dangChon && d.tu_khoa !== dangChon ? MAU.mo : MAU.s1,
              borderRadius: [0, 4, 4, 0],
            },
          })),
          label: {
            show: true,
            position: 'right',
            color: MAU.chuPhu,
            fontFamily: PHONG_CHU,
            fontSize: 11,
            formatter: (p: { dataIndex: number; value: number }) =>
              p.dataIndex === dao.length - 1 || dao[p.dataIndex].tu_khoa === dangChon ? so(p.value) : '',
          },
          emphasis: { itemStyle: { color: MAU.s1, opacity: 0.85 } },
        },
      ],
    }
  }, [top, dangChon])
  const onEvents: SuKien = {
    click: (p) => {
      const dao = [...top].reverse()
      const d = p.dataIndex !== undefined && p.data !== undefined ? dao[p.dataIndex] : dao.find((x) => x.hien_thi === (p as { value?: string }).value)
      if (d) onChon(d.tu_khoa === dangChon ? '' : d.tu_khoa)
    },
  }
  return <ChartEC option={option} onEvents={onEvents} cao={Math.max(240, top.length * 24 + 16)} nhan={`Biểu đồ cột ngang ${top.length} từ khóa tìm nhiều nhất`} />
}

/* ---------------- Theo loại hình (cột ngang chồng: lượt chọn + lượt mượn) ---------------- */
export function BieuDoLoaiHinh({
  du_lieu,
  dangChon,
  onChon,
}: {
  du_lieu: TheoLoaiHinh[]
  dangChon: string
  onChon: (loai: string) => void
}) {
  const sap = useMemo(
    () => [...du_lieu].sort((a, b) => a.so_luot_chon + a.so_luot_muon - (b.so_luot_chon + b.so_luot_muon)),
    [du_lieu],
  )
  const option = useMemo(() => {
    const ten = (l: string) => (LOAI_HINH as Record<string, { ngan: string }>)[l]?.ngan ?? l
    const mau = (l: string, goc: string) => (dangChon && l !== dangChon ? MAU.mo : goc)
    return {
      animation: !giamChuyenDong(),
      grid: { left: 4, right: 56, top: 32, bottom: 4, containLabel: true },
      legend: {
        top: 0,
        left: 0,
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 16,
        icon: 'roundRect',
        textStyle: { color: MAU.chu, fontFamily: PHONG_CHU, fontSize: 12 },
      },
      tooltip: {
        ...tooltipChung,
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(155,28,28,0.05)' } },
        formatter: (ps: { dataIndex: number }[]) => {
          const d = sap[ps[0]?.dataIndex ?? 0]
          if (!d) return ''
          const tl = d.so_tai_lieu ? Math.round((d.da_so_hoa / d.so_tai_lieu) * 100) : 0
          return (
            `<div style="font-weight:600;margin-bottom:4px">${thoat(LOAI_HINH[d.loai_hinh]?.nhan ?? d.loai_hinh)}</div>` +
            dongTooltip(MAU.s1, so(d.so_luot_chon), 'lượt chọn từ kết quả', 'rect') +
            dongTooltip(MAU.s2, so(d.so_luot_muon), 'lượt mượn', 'rect') +
            `<div style="color:${MAU.chuPhu};margin-top:4px">${so(d.da_so_hoa)}/${so(d.so_tai_lieu)} tư liệu đã số hóa (${tl}%)</div>`
          )
        },
      },
      xAxis: { type: 'value', ...trucChung, splitNumber: 3, minInterval: 1 },
      yAxis: {
        type: 'category',
        data: sap.map((d) => d.loai_hinh),
        ...trucChung,
        axisLabel: {
          ...trucChung.axisLabel,
          color: MAU.chu,
          fontSize: 12,
          formatter: (v: string) => ten(v),
        },
      },
      series: [
        {
          name: 'Lượt chọn',
          type: 'bar',
          stack: 'tong',
          barMaxWidth: 16,
          cursor: 'pointer',
          itemStyle: { color: MAU.s1, borderColor: '#fff', borderWidth: 1 },
          data: sap.map((d) => ({ value: d.so_luot_chon, itemStyle: { color: mau(d.loai_hinh, MAU.s1) } })),
        },
        {
          name: 'Lượt mượn',
          type: 'bar',
          stack: 'tong',
          barMaxWidth: 16,
          cursor: 'pointer',
          itemStyle: { color: MAU.s2, borderColor: '#fff', borderWidth: 1, borderRadius: [0, 4, 4, 0] },
          data: sap.map((d) => ({ value: d.so_luot_muon, itemStyle: { color: mau(d.loai_hinh, MAU.s2), borderRadius: [0, 4, 4, 0] } })),
          label: {
            show: true,
            position: 'right',
            color: MAU.chuPhu,
            fontFamily: PHONG_CHU,
            fontSize: 11,
            formatter: (p: { dataIndex: number }) => {
              const d = sap[p.dataIndex]
              return d.so_tai_lieu ? `${Math.round((d.da_so_hoa / d.so_tai_lieu) * 100)}% số hóa` : ''
            },
          },
        },
      ],
    }
  }, [sap, dangChon])
  const onEvents: SuKien = {
    click: (p) => {
      const d = p.dataIndex !== undefined ? sap[p.dataIndex] : undefined
      if (d) onChon(d.loai_hinh === dangChon ? '' : d.loai_hinh)
    },
  }
  return <ChartEC option={option} onEvents={onEvents} cao={Math.max(220, sap.length * 30 + 40)} nhan="Biểu đồ cột chồng lượt chọn và lượt mượn theo loại hình" />
}

/* ---------------- Lượt đọc theo ngày (một chuỗi) ---------------- */
export function BieuDoLuotDocNgay({ du_lieu }: { du_lieu: { ngay: string; so_luot: number }[] }) {
  const option = useMemo(
    () => ({
      animation: !giamChuyenDong(),
      grid: { left: 4, right: 12, top: 8, bottom: 4, containLabel: true },
      tooltip: {
        ...tooltipChung,
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#cfc4b6', width: 1 } },
        formatter: (ps: { dataIndex: number }[]) => {
          const d = du_lieu[ps[0]?.dataIndex ?? 0]
          return d ? `<div style="font-weight:600;margin-bottom:4px">${thoat(ngay(d.ngay))}</div>${dongTooltip(MAU.s3, so(d.so_luot), 'lượt đọc')}` : ''
        },
      },
      xAxis: {
        type: 'category',
        data: du_lieu.map((d) => d.ngay),
        boundaryGap: false,
        ...trucChung,
        axisLine: { show: true, lineStyle: { color: '#e7dfd5' } },
        splitLine: { show: false },
        axisLabel: { ...trucChung.axisLabel, interval: du_lieu.length > 45 ? 14 : 6, formatter: (v: string) => ngayNgan(v) },
      },
      yAxis: { type: 'value', ...trucChung, minInterval: 1, splitNumber: 3 },
      series: [
        {
          name: 'Lượt đọc',
          type: 'line',
          data: du_lieu.map((d) => d.so_luot),
          showSymbol: false,
          symbolSize: 8,
          lineStyle: { width: 2, color: MAU.s3 },
          itemStyle: { color: MAU.s3, borderColor: '#fff', borderWidth: 2 },
          areaStyle: { color: 'rgba(47,109,181,0.08)' },
        },
      ],
    }),
    [du_lieu],
  )
  return <ChartEC option={option} cao={200} nhan={`Biểu đồ đường lượt đọc bản mềm theo ngày, ${du_lieu.length} ngày`} />
}
