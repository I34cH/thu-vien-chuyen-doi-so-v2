// Nhãn hiển thị và định dạng số, ngày theo tiếng Việt.
import type { LoaiHinh, TrangThaiMuon } from '../api/types'

export const LOAI_HINH: Record<LoaiHinh, { nhan: string; ngan: string }> = {
  luan_an: { nhan: 'Luận án', ngan: 'Luận án' },
  luan_van: { nhan: 'Luận văn', ngan: 'Luận văn' },
  khoa_luan: { nhan: 'Khóa luận', ngan: 'Khóa luận' },
  bao_cao_kh: { nhan: 'Báo cáo khoa học', ngan: 'Báo cáo KH' },
  ky_yeu: { nhan: 'Kỷ yếu', ngan: 'Kỷ yếu' },
  sach: { nhan: 'Sách', ngan: 'Sách' },
  sach_ha_noi: { nhan: 'Sách Hà Nội', ngan: 'Sách HN' },
  tu_sach_tang: { nhan: 'Tủ sách tặng', ngan: 'Sách tặng' },
}

export const DS_LOAI_HINH = Object.keys(LOAI_HINH) as LoaiHinh[]

export function nhanLoaiHinh(l: string | null | undefined): string {
  if (!l) return ''
  return (LOAI_HINH as Record<string, { nhan: string }>)[l]?.nhan ?? l
}

export const TRANG_THAI_MUON: Record<TrangThaiMuon, string> = {
  cho_duyet: 'Chờ duyệt',
  dang_muon: 'Đang mượn',
  da_tra: 'Đã trả',
  tu_choi: 'Từ chối',
}

export const VAI_TRO: Record<string, string> = {
  sinh_vien: 'Sinh viên',
  giang_vien: 'Giảng viên',
  thu_thu: 'Thủ thư',
  admin: 'Quản trị',
}

const fmtSo = new Intl.NumberFormat('vi-VN')
export const so = (n: number | null | undefined) => (n == null ? '–' : fmtSo.format(n))

/** Định dạng một tỉ lệ 0..1 thành phần trăm. */
export function phanTram(ti: number, chuSo = 1): string {
  return giaTriPhanTram(ti * 100, chuSo)
}

/** Định dạng giá trị đã là phần trăm 0..100 (ví dụ ti_le_khong_ket_qua của API). */
export function giaTriPhanTram(v: number, chuSo = 1): string {
  return `${v.toLocaleString('vi-VN', { maximumFractionDigits: chuSo, minimumFractionDigits: 0 })}%`
}

function taoNgay(iso: string): Date {
  // Chuỗi chỉ có ngày (YYYY-MM-DD) hiểu theo giờ địa phương để không lệch ngày
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso)
}

export function ngay(iso: string | null | undefined): string {
  if (!iso) return '–'
  const d = taoNgay(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function ngayNgan(iso: string): string {
  const d = taoNgay(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

/** Số ngày từ hôm nay đến hạn (âm = đã quá hạn). */
export function soNgayDenHan(iso: string | null, homNay = new Date()): number | null {
  if (!iso) return null
  const han = taoNgay(iso)
  const a = new Date(homNay.getFullYear(), homNay.getMonth(), homNay.getDate()).getTime()
  const b = new Date(han.getFullYear(), han.getMonth(), han.getDate()).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** Định dạng ngày ISO YYYY-MM-DD theo giờ địa phương. */
export function isoNgay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dd}`
}

export function congNgay(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
