// Kiểm thử thành phần chặng 5: ThemeRiver chủ đề, đồ thị mượn cùng nhau, popover lan tỏa.
// ECharts được thay bằng một thành phần giả để đọc `option` mà không cần vẽ thật trong jsdom.
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ChuDeTheoThoiGian, MuonCungNhau } from '../../api/types'
import { bangMauChuDe, MAU_CHU_DE, MAU_KHAC } from '../../lib/echarts'
import { renderVoi } from '../../test/tienIch'
import { BieuDoChuDe, gopChuDe } from './BieuDoChuDe'
import { chuGiaiDoThi, coNut, doDayCanh, DoThiMuon } from './DoThiMuon'
import { PopoverLanToa } from './PopoverLanToa'

const bat = vi.hoisted(() => ({ option: null as null | Record<string, unknown>, onEvents: null as null | Record<string, (p: unknown) => void> }))
vi.mock('echarts-for-react/esm/core', () => ({
  default: (props: { option: Record<string, unknown>; onEvents?: Record<string, (p: unknown) => void> }) => {
    bat.option = props.option
    bat.onEvents = props.onEvents ?? null
    return <div data-testid="echarts" />
  },
}))

// 10 chủ đề, chủ đề id 1..10 có số tư liệu giảm dần -> 8 chủ đề đầu có màu, 9 và 10 vào "Khác"
const DS_CHU_DE = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, so_tai_lieu: 1000 - i * 50 }))
const MAU = bangMauChuDe(DS_CHU_DE)
const KY = ['2026-10-01', '2026-10-02', '2026-10-03']
const TR: ChuDeTheoThoiGian = {
  don_vi: 'ngay',
  // API sắp chủ đề theo tổng lượt giảm dần; thứ tự này khác thứ tự màu
  chu_de: [
    { id: 9, nhan: 'Chín', so_luot: 30 },
    { id: 2, nhan: 'Hai', so_luot: 20 },
    { id: 10, nhan: 'Mười', so_luot: 6 },
    { id: 1, nhan: 'Một', so_luot: 3 },
  ],
  du_lieu: [
    ...KY.map((k) => [k, 10, 'Chín'] as [string, number, string]),
    ['2026-10-01', 5, 'Hai'], ['2026-10-02', 15, 'Hai'], ['2026-10-03', 0, 'Hai'],
    ...KY.map((k) => [k, 2, 'Mười'] as [string, number, string]),
    ['2026-10-01', 1, 'Một'], ['2026-10-02', 1, 'Một'], ['2026-10-03', 1, 'Một'],
  ],
}

describe('bảng màu chủ đề', () => {
  it('gán 8 màu theo số tư liệu, không phụ thuộc bộ lọc', () => {
    expect(MAU.size).toBe(8)
    expect(MAU.get(1)).toBe(MAU_CHU_DE[0])
    expect(MAU.get(8)).toBe(MAU_CHU_DE[7])
    expect(MAU.has(9)).toBe(false)
  })
})

describe('gopChuDe (ThemeRiver)', () => {
  it('giữ màu theo chủ đề, xếp theo ô màu và gộp phần còn lại vào "Khác"', () => {
    const s = gopChuDe(TR, MAU)
    expect(s.ky).toEqual(KY)
    expect(s.dong.map((d) => d.ten)).toEqual(['Một', 'Hai', 'Khác'])
    expect(s.dong[0].mau).toBe(MAU_CHU_DE[0])
    const khac = s.dong[2]
    expect(khac.mau).toBe(MAU_KHAC)
    expect(khac.so_chu_de).toBe(2)
    expect(khac.gia_tri).toEqual([12, 12, 12])
    expect(khac.tong).toBe(36)
    expect(s.dong[1].gia_tri).toEqual([5, 15, 0])
  })

  it('không có "Khác" khi mọi chủ đề đều có màu', () => {
    const s = gopChuDe({ ...TR, chu_de: TR.chu_de.filter((c) => c.id <= 8), du_lieu: TR.du_lieu.filter((r) => r[2] === 'Hai' || r[2] === 'Một') }, MAU)
    expect(s.dong.map((d) => d.khoa)).toEqual(['1', '2'])
  })

  it('vẽ themeRiver đủ lưới, chú giải bấm được để làm nổi một chủ đề', async () => {
    const song = gopChuDe(TR, MAU)
    const onNoi = vi.fn()
    renderVoi(<BieuDoChuDe du_lieu={TR} song={song} dangNoi="" onNoi={onNoi} />)
    const series = (bat.option!.series as { type: string; data: unknown[] }[])[0]
    expect(series.type).toBe('themeRiver')
    expect(series.data).toHaveLength(3 * 3)
    expect(bat.option!.color).toEqual([MAU_CHU_DE[0], MAU_CHU_DE[1], MAU_KHAC])
    await userEvent.click(screen.getByRole('button', { name: /Hai/ }))
    expect(onNoi).toHaveBeenCalledWith('2')
    // bấm vào dòng trên biểu đồ cũng làm nổi
    bat.onEvents!.click({ data: ['2026-10-01', 10, 'Khác'] })
    expect(onNoi).toHaveBeenLastCalledWith('khac')
  })

  it('đang làm nổi: các dòng khác đổi sang màu mờ, tooltip ghi tổng theo kỳ', () => {
    const song = gopChuDe(TR, MAU)
    renderVoi(<BieuDoChuDe du_lieu={TR} song={song} dangNoi="2" onNoi={() => {}} />)
    const mau = bat.option!.color as string[]
    expect(mau[1]).toBe(MAU_CHU_DE[1])
    expect(mau[0]).not.toBe(MAU_CHU_DE[0])
    expect(screen.getByRole('button', { name: /Hai/ })).toHaveAttribute('aria-pressed', 'true')
    const fmt = (bat.option!.tooltip as { formatter: (p: unknown) => string }).formatter
    const html = fmt([{ value: ['2026-10-02', 15, 'Hai'] }])
    expect(html).toContain('02/10/2026')
    expect(html).toContain('<b style="color:#231a1a">28</b>') // 15 + 12 + 1
  })
})

const NUT = (id: number, chuDe: number | null, soLuot: number) => ({
  id, ten: `Tư liệu ${id}`, tieu_de: `Tư liệu số ${id} <b>đầy đủ</b>`, ky_hieu: `KL.${id}`, loai_hinh: 'khoa_luan' as const,
  chu_de: chuDe ? { id: chuDe, nhan: `Chủ đề ${chuDe}` } : null, so_luot_muon: soLuot,
})
const DT: MuonCungNhau = {
  nut: [NUT(11, 1, 20), NUT(12, 1, 5), NUT(13, 9, 2), NUT(14, null, 1)],
  canh: [
    { nguon: 11, dich: 12, trong_so: 5 },
    { nguon: 11, dich: 13, trong_so: 2 },
    { nguon: 13, dich: 14, trong_so: 2 },
  ],
  nguong: 2,
  trong_so_lon_nhat: 5,
  tong_so_nut: 9,
}

describe('DoThiMuon', () => {
  it('hàm thang đo: kích thước theo căn bậc hai, độ dày cạnh 1–6px', () => {
    expect(coNut(20, 20)).toBe(34)
    expect(coNut(0, 20)).toBe(10)
    expect(coNut(5, 20)).toBe(22) // 10 + 24 × 0,5
    expect(doDayCanh(2, 2, 5)).toBe(1)
    expect(doDayCanh(5, 2, 5)).toBe(6)
    expect(doDayCanh(3, 3, 3)).toBe(2)
  })

  it('màu theo chủ đề (tối đa 8) + xám, chú giải gộp "Khác"', () => {
    const cg = chuGiaiDoThi(DT.nut, MAU)
    expect(cg.map((c) => [c.ten, c.tong])).toEqual([['Chủ đề 1', 2], ['Khác', 2]])
  })

  it('vẽ graph lực, kéo/zoom được, bấm nút mở chi tiết, thanh trượt đổi ngưỡng', () => {
    const onMo = vi.fn()
    const onDoi = vi.fn()
    renderVoi(<DoThiMuon du_lieu={DT} mau={MAU} nguong={2} onDoiNguong={onDoi} onMo={onMo} />)
    const s = (bat.option!.series as Record<string, unknown>[])[0]
    expect(s.type).toBe('graph')
    expect(s.layout).toBe('force')
    expect(s.roam).toBe(true)
    expect(s.draggable).toBe(true)
    expect((s.emphasis as { focus: string }).focus).toBe('adjacency')
    const data = s.data as { id: string; symbolSize: number; itemStyle: { color: string } }[]
    expect(data.map((d) => d.itemStyle.color)).toEqual([MAU_CHU_DE[0], MAU_CHU_DE[0], MAU_KHAC, MAU_KHAC])
    expect(data[0].symbolSize).toBeGreaterThan(data[1].symbolSize)
    const links = s.links as { lineStyle: { width: number } }[]
    expect(links[0].lineStyle.width).toBe(6)
    expect(links[1].lineStyle.width).toBe(1)
    // tooltip thoát HTML của tiêu đề
    const fmt = (bat.option!.tooltip as { formatter: (p: unknown) => string }).formatter
    expect(fmt({ dataType: 'node', data: { id: '11' } })).toContain('&lt;b&gt;đầy đủ&lt;/b&gt;')
    expect(fmt({ dataType: 'edge', data: { source: '11', target: '12', value: 5 } })).toContain('bạn đọc mượn cả hai')
    bat.onEvents!.click({ dataType: 'node', data: { id: '12' } })
    expect(onMo).toHaveBeenCalledWith(12)
    bat.onEvents!.click({ dataType: 'edge', data: { source: '11', target: '12' } })
    expect(onMo).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/hiện 4\/9 tư liệu nối nhiều nhất/)).toBeInTheDocument()
    const truot = screen.getByRole('slider')
    expect(truot).toHaveAttribute('max', '5')
    expect(truot).toHaveAttribute('min', '2') // tối thiểu 2 bạn đọc chung
    fireEvent.change(truot, { target: { value: '4' } })
    expect(onDoi).toHaveBeenCalledWith(4)
  })

  it('trạng thái rỗng vẫn giữ thanh trượt và gợi ý hạ ngưỡng', () => {
    bat.option = null
    renderVoi(<DoThiMuon du_lieu={{ ...DT, nut: [], canh: [], nguong: 5, tong_so_nut: 0 }} mau={MAU} nguong={5} onDoiNguong={() => {}} onMo={() => {}} />)
    expect(screen.getByText(/Không có cặp tư liệu nào được từ 5 bạn đọc/)).toHaveTextContent('Thử hạ ngưỡng')
    expect(screen.getByRole('slider')).toBeInTheDocument()
    expect(bat.option).toBeNull()
  })
})

describe('PopoverLanToa', () => {
  const NGUON = [
    { id: 5, tieu_de: 'Bản mềm A', so_luot_doc: 100, diem_tuong_tu: 0.5, dong_gop: 2.3 },
    { id: 6, tieu_de: 'Bản mềm B', so_luot_doc: 20, diem_tuong_tu: 0.25, dong_gop: 0.8 },
  ]
  it('mở bằng nút, liệt kê nguồn và phần còn lại, đóng bằng Esc', async () => {
    renderVoi(<PopoverLanToa diem={4} nguon={NGUON} tieuDe="Tư liệu X" />)
    const nut = screen.getByRole('button', { name: /Vì sao «Tư liệu X»/ })
    await userEvent.click(nut)
    const hop = screen.getByRole('dialog', { name: 'Nguồn điểm lan tỏa' })
    expect(hop).toHaveTextContent('Vì sao được cộng 4 điểm?')
    expect(hop).toHaveTextContent('+2,3')
    expect(hop).toHaveTextContent('0,25 × ln(1 + 20 lượt đọc)') // độ tương tự × ln(1 + lượt đọc)
    expect(hop).toHaveTextContent('Còn +0,9 từ các bản mềm tương tự khác.')
    expect(screen.getByRole('link', { name: 'Bản mềm A' })).toHaveAttribute('href', '/tai-lieu/5')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(nut).toHaveFocus()
  })
  it('không hiện gì khi không có nguồn', () => {
    renderVoi(<PopoverLanToa diem={0} nguon={[]} tieuDe="Y" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
