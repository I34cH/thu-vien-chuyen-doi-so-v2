import { screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout, menuTheoNhom } from './AppLayout'
import { giaLapFetch, renderVoi } from '../../test/tienIch'

function renderLayout() {
  return renderVoi(
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<p>Nội dung trang</p>} />
      </Route>
    </Routes>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('AppLayout', () => {
  it('không còn banner dữ liệu mẫu ở đầu trang', () => {
    giaLapFetch({ '/auth/toi': { nguoi_dung: null }, '/health': { status: 'ok' } })
    renderLayout()
    expect(screen.queryByText(/DỮ LIỆU MẪU/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  it('khách chỉ thấy Trang chủ, Tra cứu và nút Đăng nhập', async () => {
    giaLapFetch({ '/auth/toi': { nguoi_dung: null }, '/health': { status: 'ok' } })
    renderLayout()
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    expect(within(nav).getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('href', '/')
    expect(within(nav).getByRole('link', { name: 'Tra cứu' })).toHaveAttribute('href', '/tra-cuu')
    expect(within(nav).queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Đăng nhập' })).toBeInTheDocument()
  })

  it('thủ thư thấy thêm Quản lý và Dashboard', async () => {
    giaLapFetch({
      '/auth/toi': { nguoi_dung: { id: 1, ten_dang_nhap: 'thuthu', ho_ten: 'Lê Thu Thủy', vai_tro: 'thu_thu', nhom: 'thu_thu' } },
      '/health': { status: 'ok' },
    })
    renderLayout()
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    expect(await within(nav).findByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(within(nav).getByRole('link', { name: 'Quản lý' })).toHaveAttribute('href', '/quan-ly')
  })

  it('menuTheoNhom lọc đúng theo vai trò', () => {
    expect(menuTheoNhom('nguoi_dung').map((m) => m.to)).toEqual(['/', '/tra-cuu'])
    expect(menuTheoNhom('thu_thu').map((m) => m.to)).toEqual(['/', '/tra-cuu', '/quan-ly', '/dashboard'])
  })

  it('báo lỗi kết nối khi backend chưa chạy, nội dung vẫn hiển thị', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    renderLayout()
    expect(screen.getByText('Nội dung trang')).toBeInTheDocument()
    expect(await screen.findByText('Máy chủ: không kết nối được')).toBeInTheDocument()
  })
})
