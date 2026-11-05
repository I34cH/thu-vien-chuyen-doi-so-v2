import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { giaLapFetch, renderVoi } from '../../test/tienIch'
import { BangChuDe } from './BangChuDe'

afterEach(() => vi.unstubAllGlobals())

const DS = [
  { id: 1, nhan: 'lưu trữ, tài liệu, trung tâm', nhan_tu_dong: 'lưu trữ, tài liệu, trung tâm', da_sua_tay: false, tu_khoa_noi_bat: ['lưu trữ', 'tài liệu', 'phông'], so_tai_lieu: 499 },
  { id: 4, nhan: 'hành chính, cải cách, thủ tục', nhan_tu_dong: 'hành chính, cải cách, thủ tục', da_sua_tay: false, tu_khoa_noi_bat: ['hành chính', 'cải cách'], so_tai_lieu: 101 },
]

describe('Tab Chủ đề ở trang Quản lý', () => {
  it('hiện nhãn, từ khóa nổi bật, số tư liệu và sửa nhãn tại chỗ', async () => {
    const f = giaLapFetch({
      '/quan-ly/chu-de': (_url: URL, init?: RequestInit) => {
        if (init?.method === 'PUT') {
          const body = JSON.parse(String(init.body))
          return { ...DS[0], nhan: body.nhan, da_sua_tay: true }
        }
        return DS
      },
    })
    renderVoi(<BangChuDe />)
    expect(await screen.findByText('lưu trữ, tài liệu, trung tâm')).toBeInTheDocument()
    expect(screen.getByText('lưu trữ, tài liệu, phông')).toBeInTheDocument()
    expect(screen.getByText('499')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Sửa nhãn chủ đề lưu trữ, tài liệu, trung tâm' }))
    const o = screen.getByRole('textbox', { name: 'Nhãn chủ đề 1' })
    await userEvent.clear(o)
    expect(screen.getByRole('button', { name: 'Lưu' })).toBeDisabled()
    await userEvent.type(o, 'Lưu trữ học{Enter}')
    expect(await screen.findByRole('button', { name: 'Sửa nhãn chủ đề Lưu trữ học' })).toBeInTheDocument()
    const put = f.mock.calls.find((c) => (c[1] as RequestInit | undefined)?.method === 'PUT')!
    expect(String(put[0])).toContain('/api/quan-ly/chu-de/1')
    expect(JSON.parse(String((put[1] as RequestInit).body))).toEqual({ nhan: 'Lưu trữ học' })
    // đã sửa tay: hiện nhãn tự động gốc và nút khôi phục
    expect(screen.getByText('Sửa tay')).toBeInTheDocument()
    expect(screen.getByText('Nhãn tự động:').parentElement).toHaveTextContent('Nhãn tự động: lưu trữ, tài liệu, trung tâm')
  })

  it('khôi phục nhãn tự động gọi POST /khoi-phuc và bỏ dấu "Sửa tay"', async () => {
    const daSua = { ...DS[0], nhan: 'Lưu trữ học', da_sua_tay: true }
    const f = giaLapFetch({
      '/quan-ly/chu-de': [daSua, DS[1]],
      '/quan-ly/chu-de/1/khoi-phuc': (_url: URL, init?: RequestInit) =>
        init?.method === 'POST' ? DS[0] : new Response('{}', { status: 405 }),
    })
    renderVoi(<BangChuDe />)
    expect(await screen.findByText('Sửa tay')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Khôi phục nhãn tự động' }))
    expect(await screen.findByRole('button', { name: 'Sửa nhãn chủ đề lưu trữ, tài liệu, trung tâm' })).toBeInTheDocument()
    expect(screen.queryByText('Sửa tay')).not.toBeInTheDocument()
    expect(f.mock.calls.some((c) => String(c[0]).includes('/api/quan-ly/chu-de/1/khoi-phuc') && (c[1] as RequestInit).method === 'POST')).toBe(true)
  })

  it('báo lỗi khi máy chủ từ chối (trùng nhãn) và giữ ô sửa', async () => {
    giaLapFetch({
      '/quan-ly/chu-de': (_url: URL, init?: RequestInit) =>
        init?.method === 'PUT'
          ? new Response(JSON.stringify({ detail: 'Đã có chủ đề khác mang nhãn này.' }), { status: 409 })
          : DS,
    })
    renderVoi(<BangChuDe />)
    await userEvent.click(await screen.findByRole('button', { name: /Sửa nhãn chủ đề hành chính/ }))
    const o = screen.getByRole('textbox', { name: 'Nhãn chủ đề 4' })
    await userEvent.clear(o)
    await userEvent.type(o, 'lưu trữ, tài liệu, trung tâm{Enter}')
    await waitFor(() => expect(screen.getByText('Đã có chủ đề khác mang nhãn này.')).toBeInTheDocument())
    expect(screen.getByRole('textbox', { name: 'Nhãn chủ đề 4' })).toBeInTheDocument()
  })
})
