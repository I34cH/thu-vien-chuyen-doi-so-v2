// Đọc/ghi trạng thái bộ lọc tra cứu trên URL. URL là nguồn sự thật duy nhất.
import type { SapXep } from '../api/types'
import { DS_LOAI_HINH } from './format'

export interface BoLocTraCuu {
  q: string
  loai: string
  tu_nam: number | null
  den_nam: number | null
  co_ban_mem: boolean
  con_ban: boolean
  sap_xep: SapXep
  trang: number
  /** Tìm chính xác cụm đã gõ (bỏ qua sửa lỗi gõ) — lối "Tìm chính xác …" khi kết quả đang theo cụm đã sửa. */
  chinh_xac: boolean
}

export const BO_LOC_MAC_DINH: BoLocTraCuu = {
  q: '',
  loai: '',
  tu_nam: null,
  den_nam: null,
  co_ban_mem: false,
  con_ban: false,
  sap_xep: 'lien_quan',
  trang: 1,
  chinh_xac: false,
}

const SAP_XEP_HOP_LE: SapXep[] = ['lien_quan', 'moi_nhat', 'cu_nhat']

function docNam(v: string | null): number | null {
  if (!v) return null
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) && n > 0 && n < 3000 ? n : null
}

const laDung = (v: string | null) => v === '1' || v === 'true'

export function docBoLoc(sp: URLSearchParams): BoLocTraCuu {
  const loai = sp.get('loai') ?? ''
  const sapXep = sp.get('sap_xep') as SapXep | null
  const trang = Number.parseInt(sp.get('trang') ?? '1', 10)
  return {
    q: (sp.get('q') ?? '').trim(),
    loai: (DS_LOAI_HINH as string[]).includes(loai) ? loai : '',
    tu_nam: docNam(sp.get('tu_nam')),
    den_nam: docNam(sp.get('den_nam')),
    co_ban_mem: laDung(sp.get('co_ban_mem')),
    con_ban: laDung(sp.get('con_ban')),
    sap_xep: sapXep && SAP_XEP_HOP_LE.includes(sapXep) ? sapXep : 'lien_quan',
    trang: Number.isFinite(trang) && trang >= 1 ? trang : 1,
    chinh_xac: laDung(sp.get('chinh_xac')),
  }
}

/** Ghi bộ lọc thành query string, bỏ các giá trị mặc định cho URL gọn. */
export function ghiBoLoc(b: BoLocTraCuu): URLSearchParams {
  const sp = new URLSearchParams()
  if (b.q) sp.set('q', b.q)
  if (b.loai) sp.set('loai', b.loai)
  if (b.tu_nam) sp.set('tu_nam', String(b.tu_nam))
  if (b.den_nam) sp.set('den_nam', String(b.den_nam))
  if (b.co_ban_mem) sp.set('co_ban_mem', '1')
  if (b.con_ban) sp.set('con_ban', '1')
  if (b.sap_xep !== 'lien_quan') sp.set('sap_xep', b.sap_xep)
  if (b.trang > 1) sp.set('trang', String(b.trang))
  if (b.chinh_xac && b.q) sp.set('chinh_xac', '1')
  return sp
}

/** Cập nhật một phần bộ lọc; đổi bất kỳ điều kiện nào (trừ trang) thì quay về trang 1.
 *  Đổi từ khóa thì bỏ chế độ tìm chính xác (truy vấn mới lại được sửa lỗi gõ như mặc định). */
export function capNhatBoLoc(b: BoLocTraCuu, thayDoi: Partial<BoLocTraCuu>): BoLocTraCuu {
  const moi = { ...b, ...thayDoi }
  if (!('trang' in thayDoi)) moi.trang = 1
  if ('q' in thayDoi && thayDoi.q !== b.q && !('chinh_xac' in thayDoi)) moi.chinh_xac = false
  return moi
}

export function demBoLocDangBat(b: BoLocTraCuu): number {
  return [b.loai, b.tu_nam || b.den_nam, b.co_ban_mem, b.con_ban].filter(Boolean).length
}

/** "1990" (thập niên) → khoảng năm 1990–1999. */
export function khoangThapNien(giaTri: string): { tu_nam: number; den_nam: number } | null {
  const n = Number.parseInt(giaTri, 10)
  if (!Number.isFinite(n)) return null
  const dau = Math.floor(n / 10) * 10
  return { tu_nam: dau, den_nam: dau + 9 }
}
