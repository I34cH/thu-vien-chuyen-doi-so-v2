import { BO_LOC_MAC_DINH, capNhatBoLoc, demBoLocDangBat, docBoLoc, ghiBoLoc, khoangThapNien } from './boLoc'
import { timDoanKhop } from './highlight'
import { docBoLocDashboard } from '../hooks/useBoLocDashboard'

describe('bộ lọc tra cứu trên URL', () => {
  it('đọc đủ mọi tham số hợp lệ', () => {
    const b = docBoLoc(new URLSearchParams('q=lưu trữ&loai=khoa_luan&tu_nam=1990&den_nam=1999&co_ban_mem=1&con_ban=true&sap_xep=moi_nhat&trang=3'))
    expect(b).toEqual({ q: 'lưu trữ', loai: 'khoa_luan', tu_nam: 1990, den_nam: 1999, co_ban_mem: true, con_ban: true, sap_xep: 'moi_nhat', trang: 3, chinh_xac: false })
  })

  it('bỏ qua giá trị sai và dùng mặc định', () => {
    const b = docBoLoc(new URLSearchParams('loai=khong_co&tu_nam=abc&sap_xep=lung_tung&trang=-2'))
    expect(b).toEqual(BO_LOC_MAC_DINH)
  })

  it('ghi gọn: không ghi giá trị mặc định', () => {
    expect(ghiBoLoc(BO_LOC_MAC_DINH).toString()).toBe('')
    expect(ghiBoLoc({ ...BO_LOC_MAC_DINH, q: 'van ban', co_ban_mem: true, trang: 2 }).toString()).toBe('q=van+ban&co_ban_mem=1&trang=2')
  })

  it('đọc → ghi → đọc giữ nguyên (khứ hồi)', () => {
    const b = { ...BO_LOC_MAC_DINH, q: 'hồ sơ', loai: 'sach', tu_nam: 2000, den_nam: 2009, con_ban: true, sap_xep: 'cu_nhat' as const, trang: 4 }
    expect(docBoLoc(ghiBoLoc(b))).toEqual(b)
  })

  it('đổi điều kiện lọc thì về trang 1; chỉ đổi trang thì giữ', () => {
    const b = { ...BO_LOC_MAC_DINH, q: 'x', trang: 5 }
    expect(capNhatBoLoc(b, { loai: 'sach' }).trang).toBe(1)
    expect(capNhatBoLoc(b, { trang: 6 }).trang).toBe(6)
  })

  it('tìm chính xác: đọc/ghi trên URL, đổi từ khóa thì bỏ', () => {
    const b = docBoLoc(new URLSearchParams('q=lu tru&chinh_xac=1'))
    expect(b.chinh_xac).toBe(true)
    expect(ghiBoLoc(b).toString()).toBe('q=lu+tru&chinh_xac=1')
    expect(capNhatBoLoc(b, { loai: 'sach' }).chinh_xac).toBe(true)
    expect(capNhatBoLoc(b, { q: 'van thu' }).chinh_xac).toBe(false)
    expect(capNhatBoLoc({ ...b, chinh_xac: false }, { chinh_xac: true }).chinh_xac).toBe(true)
  })

  it('đếm bộ lọc đang bật và tính khoảng thập niên', () => {
    expect(demBoLocDangBat({ ...BO_LOC_MAC_DINH, loai: 'sach', tu_nam: 1990, co_ban_mem: true })).toBe(3)
    expect(khoangThapNien('2010')).toEqual({ tu_nam: 2010, den_nam: 2019 })
  })
})

describe('bộ lọc dashboard trên URL', () => {
  const homNay = new Date(2026, 10, 5)
  it('mặc định 30 ngày gần nhất', () => {
    const t = docBoLocDashboard(new URLSearchParams(''), homNay)
    expect(t).toMatchObject({ khoang: '30', tu_ngay: '2026-10-07', den_ngay: '2026-11-05', loai: '', tu_khoa: '' })
  })
  it('khoảng tùy chọn đảo lại nếu ngày bắt đầu sau ngày kết thúc', () => {
    const t = docBoLocDashboard(new URLSearchParams('khoang=tuy_chon&tu_ngay=2026-10-20&den_ngay=2026-10-01&tu_khoa=luu tru'), homNay)
    expect(t).toMatchObject({ tu_ngay: '2026-10-01', den_ngay: '2026-10-20', tu_khoa: 'luu tru' })
  })
})

describe('tô đậm phần khớp', () => {
  it('khớp không dấu với chuỗi có dấu và trả vị trí trên chuỗi gốc', () => {
    const s = 'Công tác lưu trữ'
    const d = timDoanKhop(s, 'luu tru')
    expect(d.map(([a, b]) => s.slice(a, b))).toEqual(['lưu', 'trữ'])
  })
  it('ưu tiên khớp nguyên từ: "tru" tô "trữ", không tô đầu "Trung"', () => {
    const s = 'Lưu trữ tại Trung tâm'
    expect(timDoanKhop(s, 'luu tru').map(([a, b]) => s.slice(a, b))).toEqual(['Lưu', 'trữ'])
  })
  it('đ khớp với d', () => {
    const s = 'Đổi mới'
    expect(timDoanKhop(s, 'doi').map(([a, b]) => s.slice(a, b))).toEqual(['Đổi'])
  })
})
