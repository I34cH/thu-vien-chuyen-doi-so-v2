import { screen } from '@testing-library/react'
import { YeuCauVaiTro } from './YeuCauVaiTro'
import { giaLapFetch, renderVoi } from '../../test/tienIch'

const ND = {
  thu_thu: { id: 1, ten_dang_nhap: 'thuthu', ho_ten: 'Lê Thu Thủy', vai_tro: 'thu_thu', nhom: 'thu_thu' },
  sv: { id: 2, ten_dang_nhap: 'sv01', ho_ten: 'Nguyễn Minh Anh', vai_tro: 'sinh_vien', nhom: 'nguoi_dung' },
}

function dung(nguoiDung: unknown) {
  giaLapFetch({ '/auth/toi': { nguoi_dung: nguoiDung } })
  renderVoi(
    <YeuCauVaiTro nhom={['thu_thu']} tenTrang="Dashboard">
      <p>Nội dung bí mật</p>
    </YeuCauVaiTro>,
    { route: '/dashboard?khoang=7' },
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('Bảo vệ route theo vai trò', () => {
  it('khách thấy màn hình mời đăng nhập, liên kết giữ đường dẫn quay lại', async () => {
    dung(null)
    const link = await screen.findByRole('link', { name: 'Đăng nhập' })
    expect(link).toHaveAttribute('href', `/tai-khoan?tiep=${encodeURIComponent('/dashboard?khoang=7')}`)
    expect(screen.queryByText('Nội dung bí mật')).not.toBeInTheDocument()
  })

  it('người dùng sai vai trò thấy thông báo không có quyền', async () => {
    dung(ND.sv)
    expect(await screen.findByRole('alert')).toHaveTextContent('chưa có quyền')
    expect(screen.queryByText('Nội dung bí mật')).not.toBeInTheDocument()
  })

  it('thủ thư xem được nội dung', async () => {
    dung(ND.thu_thu)
    expect(await screen.findByText('Nội dung bí mật')).toBeInTheDocument()
  })
})
