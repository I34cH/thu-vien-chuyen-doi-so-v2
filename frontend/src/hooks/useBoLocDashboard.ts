import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { BoLocThongKe, LoaiHinh } from '../api/types'
import { congNgay, DS_LOAI_HINH, isoNgay } from '../lib/format'

export type Khoang = '7' | '30' | '90' | 'tuy_chon'

export interface TrangThaiDashboard {
  khoang: Khoang
  tu_ngay: string
  den_ngay: string
  loai: LoaiHinh | ''
  tu_khoa: string
}

/** Đọc bộ lọc dashboard từ URL; mặc định 30 ngày gần nhất. */
export function docBoLocDashboard(sp: URLSearchParams, homNay = new Date()): TrangThaiDashboard {
  const k = sp.get('khoang')
  const khoang: Khoang = k === '7' || k === '90' || k === 'tuy_chon' ? k : '30'
  const den = isoNgay(homNay)
  let tu_ngay = isoNgay(congNgay(homNay, -(Number(khoang === 'tuy_chon' ? 30 : khoang) - 1)))
  let den_ngay = den
  if (khoang === 'tuy_chon') {
    const a = sp.get('tu_ngay')
    const b = sp.get('den_ngay')
    const hopLe = (s: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)
    if (hopLe(a)) tu_ngay = a!
    if (hopLe(b)) den_ngay = b!
    if (tu_ngay > den_ngay) [tu_ngay, den_ngay] = [den_ngay, tu_ngay]
  }
  const loai = sp.get('loai') ?? ''
  return {
    khoang,
    tu_ngay,
    den_ngay,
    loai: (DS_LOAI_HINH as string[]).includes(loai) ? (loai as LoaiHinh) : '',
    tu_khoa: (sp.get('tu_khoa') ?? '').trim(),
  }
}

export function useBoLocDashboard() {
  const [sp, setSp] = useSearchParams()
  const tt = useMemo(() => docBoLocDashboard(sp), [sp])
  const boLoc: BoLocThongKe = useMemo(
    () => ({ tu_ngay: tt.tu_ngay, den_ngay: tt.den_ngay, loai: tt.loai, tu_khoa: tt.tu_khoa }),
    [tt],
  )
  const dat = useCallback(
    (p: Partial<TrangThaiDashboard>) =>
      setSp(
        (cu) => {
          const moi = new URLSearchParams(cu)
          for (const [k, v] of Object.entries(p)) {
            if (v === '' || v === undefined || (k === 'khoang' && v === '30')) moi.delete(k)
            else moi.set(k, String(v))
          }
          if (p.khoang && p.khoang !== 'tuy_chon') {
            moi.delete('tu_ngay')
            moi.delete('den_ngay')
          }
          return moi
        },
        { replace: true },
      ),
    [setSp],
  )
  return { tt, boLoc, dat }
}
