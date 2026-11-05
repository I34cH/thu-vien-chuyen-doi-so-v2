// ThemeRiver: lượt quan tâm theo chủ đề theo thời gian (chặng 5).
// Một lượt tìm thuộc chủ đề của tư liệu bạn đọc chọn từ kết quả; lượt không chọn không tính.
import { useMemo } from 'react'
import clsx from 'clsx'
import type { ChuDeTheoThoiGian } from '../../api/types'
import { dongTooltip, MAU, MAU_CHU_DE, MAU_KHAC, NHAN_KHAC, PHONG_CHU, thoat, tooltipChung } from '../../lib/echarts'
import { ngay, ngayNgan, so } from '../../lib/format'
import { ChartEC, giamChuyenDong, type SuKien } from './BieuDo'

/** Màu làm mờ cho dòng không được chọn khi đang làm nổi một chủ đề. */
const MAU_MO = '#ebe4db'

export interface DongChuDe {
  /** Khóa ổn định: id chủ đề, hoặc 'khac' cho dòng gộp. */
  khoa: string
  ten: string
  mau: string
  tong: number
  /** Số lượt theo từng kỳ, cùng thứ tự với `ky`. */
  gia_tri: number[]
  /** Số chủ đề gộp trong dòng (chỉ > 1 với "Khác"). */
  so_chu_de: number
}

export interface DuLieuSong {
  ky: string[]
  dong: DongChuDe[]
}

/**
 * Gộp dữ liệu API thành các dòng của ThemeRiver.
 * Chủ đề có màu trong `mau` (8 chủ đề lớn nhất của kho) giữ dòng riêng, theo đúng thứ tự ô màu để thứ tự
 * xếp lớp và màu không đổi khi lọc; các chủ đề còn lại cộng vào một dòng "Khác" màu xám ở trên cùng.
 * Khi chưa có bảng màu (đang tải danh sách chủ đề), lấy 8 chủ đề nhiều lượt nhất theo thứ tự API.
 */
export function gopChuDe(d: ChuDeTheoThoiGian, mau: Map<number, string>): DuLieuSong {
  const ky = [...new Set(d.du_lieu.map((r) => r[0]))].sort()
  const viTri = new Map(ky.map((k, i) => [k, i]))
  const theoNhan = new Map<string, number[]>()
  for (const [k, n, nhan] of d.du_lieu) {
    let mang = theoNhan.get(nhan)
    if (!mang) theoNhan.set(nhan, (mang = new Array(ky.length).fill(0)))
    mang[viTri.get(k)!] += n
  }
  const bangMau = mau.size
    ? mau
    : new Map(d.chu_de.slice(0, MAU_CHU_DE.length).map((c, i) => [c.id, MAU_CHU_DE[i] as string]))
  const thuTuMau = (m: string) => (MAU_CHU_DE as readonly string[]).indexOf(m)

  const rieng: DongChuDe[] = []
  const khac: DongChuDe = { khoa: 'khac', ten: NHAN_KHAC, mau: MAU_KHAC, tong: 0, gia_tri: new Array(ky.length).fill(0), so_chu_de: 0 }
  for (const c of d.chu_de) {
    const gt = theoNhan.get(c.nhan) ?? new Array(ky.length).fill(0)
    const m = bangMau.get(c.id)
    if (m) {
      rieng.push({ khoa: String(c.id), ten: c.nhan, mau: m, tong: c.so_luot, gia_tri: gt, so_chu_de: 1 })
    } else {
      khac.tong += c.so_luot
      khac.so_chu_de += 1
      gt.forEach((v, i) => (khac.gia_tri[i] += v))
    }
  }
  rieng.sort((a, b) => thuTuMau(a.mau) - thuTuMau(b.mau))
  return { ky, dong: khac.so_chu_de ? [...rieng, khac] : rieng }
}

export function nhanKy(k: string, donVi: ChuDeTheoThoiGian['don_vi']): string {
  return donVi === 'tuan' ? `Tuần từ ${ngay(k)}` : ngay(k)
}

/** Chú giải dạng nút: bấm để làm nổi một chủ đề, bấm lại để bỏ. */
export function ChuGiaiChuDe({
  dong,
  dangNoi,
  onNoi,
}: {
  dong: Pick<DongChuDe, 'khoa' | 'ten' | 'mau' | 'tong'>[]
  dangNoi?: string
  onNoi?: (khoa: string) => void
}) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Chú giải chủ đề">
      {dong.map((d) => {
        const noi = dangNoi === d.khoa
        const mo = !!dangNoi && !noi
        const noiDung = (
          <>
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: d.mau }} aria-hidden="true" />
            <span className="max-w-[14rem] truncate">{d.ten}</span>
            <span className="tabular-nums text-muted">{so(d.tong)}</span>
          </>
        )
        const lop = clsx(
          'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-[opacity,border-color,background-color]',
          noi ? 'border-ink/40 bg-ink/[0.04] font-semibold text-ink' : 'border-line text-ink-soft',
          mo && 'opacity-45',
        )
        return (
          <li key={d.khoa}>
            {onNoi ? (
              <button type="button" aria-pressed={noi} onClick={() => onNoi(noi ? '' : d.khoa)} className={clsx(lop, 'hover:border-line-strong hover:text-ink')} title={d.ten}>
                {noiDung}
              </button>
            ) : (
              <span className={lop} title={d.ten}>
                {noiDung}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function BieuDoChuDe({
  du_lieu,
  song,
  dangNoi,
  onNoi,
}: {
  du_lieu: ChuDeTheoThoiGian
  song: DuLieuSong
  dangNoi: string
  onNoi: (khoa: string) => void
}) {
  const option = useMemo(() => {
    const { ky, dong } = song
    const mauDong = (d: DongChuDe) => (dangNoi && d.khoa !== dangNoi ? MAU_MO : d.mau)
    // Mốc nhãn đặt đúng các kỳ có dữ liệu (đầu tuần hoặc ngày), cách đều, tối đa ~8 nhãn
    const buoc = Math.max(1, Math.ceil(ky.length / 8))
    const mocNhan = ky.filter((_, i) => i % buoc === 0).map((k) => new Date(`${k}T00:00:00`).getTime())
    return {
      animation: !giamChuyenDong(),
      animationDuration: 500,
      color: dong.map(mauDong),
      tooltip: {
        ...tooltipChung,
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: '#8c8072', width: 1 } },
        formatter: (ps: { value: [string, number, string] }[] | { value: [string, number, string] }) => {
          const ds = Array.isArray(ps) ? ps : [ps]
          const k = ds[0]?.value?.[0]
          const i = ky.indexOf(typeof k === 'string' ? k : '')
          if (i < 0) return ''
          const hang = dong.map((d) => ({ d, n: d.gia_tri[i] })).sort((a, b) => b.n - a.n)
          const tong = hang.reduce((s, h) => s + h.n, 0)
          return (
            `<div style="font-weight:600;margin-bottom:4px">${thoat(nhanKy(ky[i], du_lieu.don_vi))}</div>` +
            hang
              .filter((h) => h.n > 0 || h.d.khoa === dangNoi)
              .map((h) => dongTooltip(h.d.mau, so(h.n), h.d.so_chu_de > 1 ? `${h.d.ten} (${h.d.so_chu_de} chủ đề)` : h.d.ten))
              .join('') +
            `<div style="color:${MAU.chuPhu};margin-top:4px;border-top:1px solid #efe8df;padding-top:4px">Tổng <b style="color:#231a1a">${so(tong)}</b> lượt quan tâm</div>`
          )
        },
      },
      singleAxis: {
        type: 'time',
        top: 8,
        bottom: 28,
        left: 20,
        right: 20,
        axisLine: { lineStyle: { color: '#e7dfd5' } },
        axisTick: { show: false },
        axisPointer: { animation: true, label: { show: false } },
        splitLine: { show: false },
        axisLabel: {
          color: MAU.chuPhu,
          fontFamily: PHONG_CHU,
          fontSize: 11,
          hideOverlap: true,
          customValues: mocNhan,
          formatter: (v: number) => {
            const d = new Date(v)
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            return ngayNgan(iso)
          },
        },
      },
      series: [
        {
          type: 'themeRiver',
          cursor: 'pointer',
          boundaryGap: ['6%', '6%'],
          label: { show: false },
          itemStyle: { borderColor: '#ffffff', borderWidth: 1 },
          emphasis: { focus: 'none', itemStyle: { shadowBlur: 0 } },
          data: dong.flatMap((d) => ky.map((k, i) => [k, d.gia_tri[i], d.ten])),
        },
      ],
    }
  }, [song, dangNoi, du_lieu.don_vi])

  const onEvents: SuKien = {
    click: (p) => {
      const ten = Array.isArray(p.data) ? String(p.data[2]) : p.name
      const d = song.dong.find((x) => x.ten === ten)
      if (d) onNoi(d.khoa === dangNoi ? '' : d.khoa)
    },
  }
  const tong = song.dong.reduce((s, d) => s + d.tong, 0)
  return (
    <div className="space-y-3">
      <ChartEC
        option={option}
        onEvents={onEvents}
        cao={300}
        nhan={`Biểu đồ dòng chảy chủ đề ${du_lieu.don_vi === 'tuan' ? 'theo tuần' : 'theo ngày'}, ${song.dong.length} dòng, tổng ${so(tong)} lượt quan tâm`}
      />
      <ChuGiaiChuDe dong={song.dong} dangNoi={dangNoi} onNoi={onNoi} />
    </div>
  )
}
