import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import TraCuu from './TraCuu'
import { giaLapFetch, renderVoi } from '../test/tienIch'

const TL = {
  id: 7, ky_hieu: 'KL.007', tieu_de: 'Công tác lưu trữ tại Nam Định', tac_gia: 'Nguyễn Văn A', loai_hinh: 'khoa_luan', nam: 2015,
  so_ban: 3, so_ban_con: 2, co_ban_mem: true, muc_truy_cap: 'noi_bo', khong_co_tl: false,
}
const KQ = {
  du_lieu: [TL], tong_so: 1, trang: 1, kich_thuoc: 20, tong_trang: 1, log_id: 55, goi_y_sua: null, da_sua: null,
  facet: { loai_hinh: [{ gia_tri: 'khoa_luan', so_luong: 1 }, { gia_tri: 'sach', so_luong: 4 }], thap_nien: [{ gia_tri: '2010', so_luong: 1 }] },
}

function UrlHienTai() {
  const l = useLocation()
  return <p data-testid="url">{l.pathname + l.search}</p>
}

afterEach(() => vi.unstubAllGlobals())

function dung(route: string, kq: unknown = KQ) {
  const f = giaLapFetch({ '/tim-kiem': kq, '/goi-y': { tai_lieu: [], tu_khoa: [] } })
  renderVoi(
    <Routes>
      <Route path="/tra-cuu" element={<><TraCuu /><UrlHienTai /></>} />
      <Route path="/tai-lieu/:id" element={<UrlHienTai />} />
    </Routes>,
    { route },
  )
  return f
}

describe('Trang tra cứu', () => {
  it('đọc bộ lọc từ URL và gửi đúng tham số lên API', async () => {
    const f = dung('/tra-cuu?q=luu%20tru&loai=khoa_luan&con_ban=1&trang=2')
    await screen.findByText('Nguyễn Văn A')
    const url = new URL(String(f.mock.calls.find((c) => String(c[0]).includes('/tim-kiem'))![0]), 'http://x')
    expect(url.searchParams.get('q')).toBe('luu tru')
    expect(url.searchParams.get('loai')).toBe('khoa_luan')
    expect(url.searchParams.get('con_ban')).toBe('true')
    expect(url.searchParams.get('trang')).toBe('2')
  })

  it('bấm facet ghi lên URL và về trang 1; hiện "còn x/y bản" và nhãn bản mềm', async () => {
    dung('/tra-cuu?q=luu&trang=3')
    expect(await screen.findByText('Bản mềm · nội bộ')).toBeInTheDocument()
    expect(screen.getByRole('article').textContent).toContain('Còn 2/3 bản')
    const panel = screen.getByRole('complementary', { name: 'Bộ lọc kết quả' })
    await userEvent.click(within(panel).getByRole('button', { name: /Sách/ }))
    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('/tra-cuu?q=luu&loai=sach'))
  })

  it('bấm kết quả ghi tư liệu được chọn (keepalive) rồi mở chi tiết', async () => {
    const f = dung('/tra-cuu?q=luu')
    await userEvent.click(await screen.findByRole('link', { name: /Công tác lưu trữ/ }))
    const goi = f.mock.calls.find((c) => String(c[0]).includes('/tim-kiem/55/chon'))
    expect(goi).toBeTruthy()
    expect((goi![1] as RequestInit).keepalive).toBe(true)
    expect(JSON.parse(String((goi![1] as RequestInit).body))).toEqual({ tai_lieu_id: 7 })
    expect(screen.getByTestId('url')).toHaveTextContent('/tai-lieu/7')
  })

  it('gõ sai: hiện kết quả cụm đã sửa kèm "Tìm chính xác"; bấm thì gọi lại với chinh_xac=1', async () => {
    const f = dung('/tra-cuu?q=lu%20tru', (url: URL) =>
      url.searchParams.get('chinh_xac') === '1'
        ? { ...KQ, goi_y_sua: 'lưu trữ', da_sua: null }
        : { ...KQ, goi_y_sua: 'lưu trữ', da_sua: 'lưu trữ' },
    )
    const dong = await screen.findByTestId('da-sua')
    expect(dong).toHaveTextContent('Đang hiện kết quả cho lưu trữ. Tìm chính xác “lu tru”')
    await userEvent.click(within(dong).getByRole('button', { name: '“lu tru”' }))
    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent('/tra-cuu?q=lu+tru&chinh_xac=1'))
    const goi = f.mock.calls.map((c) => new URL(String(c[0]), 'http://x')).filter((u) => u.pathname.endsWith('/tim-kiem'))
    expect(goi.at(-1)!.searchParams.get('chinh_xac')).toBe('1')
    // chế độ chính xác: hỏi "Có phải bạn muốn tìm …?"; bấm thì đổi từ khóa và bỏ chính xác
    const hoi = await screen.findByTestId('goi-y-sua')
    expect(hoi).toHaveTextContent('Đang hiện kết quả chính xác cho “lu tru”. Có phải bạn muốn tìm lưu trữ?')
    await userEvent.click(within(hoi).getByRole('button', { name: 'lưu trữ' }))
    await waitFor(() => expect(screen.getByTestId('url')).toHaveTextContent(/^\/tra-cuu\?q=l%C6%B0u\+tr%E1%BB%AF$/))
  })
})
