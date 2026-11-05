import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import { SearchBox } from './SearchBox'
import { giaLapFetch, renderVoi } from '../../test/tienIch'

const GOI_Y = {
  tai_lieu: [
    { id: 11, tieu_de: 'Công tác lưu trữ tại Nam Định', loai_hinh: 'khoa_luan', nam: 2015 },
    { id: 12, tieu_de: 'Lưu trữ điện tử', loai_hinh: 'sach', nam: 2020 },
  ],
  tu_khoa: [{ tu_khoa: 'lưu trữ', so_lan: 120 }],
}

function ViTri() {
  const l = useLocation()
  return <p data-testid="vi-tri">{l.pathname}</p>
}

function dung(onTimKiem = vi.fn()) {
  giaLapFetch({ '/goi-y': GOI_Y })
  renderVoi(
    <Routes>
      <Route
        path="*"
        element={
          <>
            <SearchBox onTimKiem={onTimKiem} doTre={0} />
            <ViTri />
          </>
        }
      />
    </Routes>,
  )
  return onTimKiem
}

afterEach(() => vi.unstubAllGlobals())

describe('SearchBox (combobox gợi ý)', () => {
  it('hiện 2 nhóm Tư liệu và Từ khóa phổ biến, tô đậm phần khớp (không dấu)', async () => {
    dung()
    const o = screen.getByRole('combobox')
    await userEvent.type(o, 'luu tru')
    expect(await screen.findByText('Tư liệu')).toBeInTheDocument()
    expect(screen.getByText('Từ khóa phổ biến')).toBeInTheDocument()
    expect(o).toHaveAttribute('aria-expanded', 'true')
    // "lưu trữ" được bọc <mark> dù truy vấn không dấu
    const marks = document.querySelectorAll('mark')
    expect([...marks].some((m) => m.textContent?.toLowerCase() === 'lưu')).toBe(true)
  })

  it('↓ ↓ di chuyển lựa chọn, aria-activedescendant theo đúng mục; ↑ quay lại', async () => {
    dung()
    const o = screen.getByRole('combobox')
    await userEvent.type(o, 'luu')
    await screen.findByText('Tư liệu')
    await userEvent.keyboard('{ArrowDown}')
    const opts = screen.getAllByRole('option')
    expect(opts[0]).toHaveAttribute('aria-selected', 'true')
    expect(o).toHaveAttribute('aria-activedescendant', opts[0].id)
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('↑ từ đầu danh sách vòng xuống mục cuối', async () => {
    dung()
    const o = screen.getByRole('combobox')
    await userEvent.type(o, 'luu')
    await screen.findByText('Tư liệu')
    await userEvent.keyboard('{ArrowUp}')
    const opts = screen.getAllByRole('option')
    expect(opts[opts.length - 1]).toHaveAttribute('aria-selected', 'true')
  })

  it('Enter trên mục tư liệu mở trang chi tiết', async () => {
    dung()
    await userEvent.type(screen.getByRole('combobox'), 'luu')
    await screen.findByText('Tư liệu')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(screen.getByTestId('vi-tri')).toHaveTextContent('/tai-lieu/11')
  })

  it('Enter trên mục từ khóa gọi tìm kiếm với từ khóa đó', async () => {
    const onTim = dung()
    await userEvent.type(screen.getByRole('combobox'), 'luu')
    await screen.findByText('Từ khóa phổ biến')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}')
    expect(onTim).toHaveBeenCalledWith('lưu trữ')
  })

  it('Enter khi chưa chọn mục nào thì tìm đúng chuỗi đã gõ', async () => {
    const onTim = dung()
    await userEvent.type(screen.getByRole('combobox'), 'van ban{Enter}')
    expect(onTim).toHaveBeenCalledWith('van ban')
  })

  it('Esc đóng gợi ý, Esc lần nữa xóa ô', async () => {
    dung()
    const o = screen.getByRole('combobox')
    await userEvent.type(o, 'luu')
    await screen.findByText('Tư liệu')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(o).toHaveAttribute('aria-expanded', 'false'))
    expect(o).toHaveValue('luu')
    await userEvent.keyboard('{Escape}')
    expect(o).toHaveValue('')
  })

  it('không gọi gợi ý khi gõ dưới 2 ký tự', async () => {
    const f = giaLapFetch({ '/goi-y': GOI_Y })
    renderVoi(<SearchBox onTimKiem={vi.fn()} doTre={0} />)
    await userEvent.type(screen.getByRole('combobox'), 'l')
    await new Promise((r) => setTimeout(r, 30))
    expect(f).not.toHaveBeenCalled()
  })
})
