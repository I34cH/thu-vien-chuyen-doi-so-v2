// Hàm gọi API theo đúng đường dẫn trong docs/API.md, gom theo nhóm.
import { apiFetch, postJson, qs } from './client'
import type {
  BoLocThongKe,
  ChuDeQuanLy,
  ChuDeTheoThoiGian,
  DangNhapVao,
  DiemTheoNgay,
  GioiThieu,
  GoiY,
  HangDoiMuon,
  KetQuaTimKiem,
  LuotDocTaiLieu,
  LuotMuon,
  MaVanDe,
  MucTruyCap,
  MuonCungNhau,
  NenSoHoa,
  NguoiDung,
  PhanHoiNguoiDung,
  SapXep,
  TaiLieuChiTiet,
  TaiLieuTomTat,
  TaiLieuTuongTu,
  TheoLoaiHinh,
  ThongKeLuotDoc,
  TongQuan,
  TrangKetQua,
  TuKhoaKhongKetQua,
  TuKhoaThongKe,
} from './types'

// ---------- Tài khoản ----------
export const authApi = {
  toi: () => apiFetch<PhanHoiNguoiDung>('/auth/toi'),
  dangNhap: (vao: DangNhapVao) => postJson<{ nguoi_dung: NguoiDung }>('/auth/dang-nhap', vao),
  dangXuat: () => postJson<{ ok: true }>('/auth/dang-xuat'),
}

// ---------- Tra cứu ----------
export interface ThamSoTimKiem {
  q?: string
  loai?: string
  tu_nam?: number | null
  den_nam?: number | null
  co_ban_mem?: boolean
  con_ban?: boolean
  sap_xep?: SapXep
  trang?: number
  kich_thuoc?: number
  chinh_xac?: boolean
}

export const traCuuApi = {
  gioiThieu: () => apiFetch<GioiThieu>('/gioi-thieu'),
  goiY: (q: string, signal?: AbortSignal) => apiFetch<GoiY>(`/goi-y${qs({ q })}`, { signal }),
  timKiem: (t: ThamSoTimKiem) =>
    apiFetch<KetQuaTimKiem>(
      `/tim-kiem${qs({
        q: t.q,
        loai: t.loai,
        tu_nam: t.tu_nam,
        den_nam: t.den_nam,
        co_ban_mem: t.co_ban_mem ? 'true' : undefined,
        con_ban: t.con_ban ? 'true' : undefined,
        sap_xep: t.sap_xep && t.sap_xep !== 'lien_quan' ? t.sap_xep : undefined,
        trang: t.trang ?? 1,
        kich_thuoc: t.kich_thuoc ?? 20,
        chinh_xac: t.chinh_xac ? '1' : undefined,
      })}`,
    ),
  /** Ghi tư liệu được chọn; keepalive để yêu cầu vẫn đi khi trang chuyển. Không chặn điều hướng. */
  chon: (logId: number, taiLieuId: number) => {
    try {
      void fetch(`/api/tim-kiem/${logId}/chon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ tai_lieu_id: taiLieuId }),
        credentials: 'include',
        keepalive: true,
      }).catch(() => undefined)
    } catch {
      /* ghi log thất bại không ảnh hưởng người dùng */
    }
  },
  chiTiet: (id: number) => apiFetch<TaiLieuChiTiet>(`/tai-lieu/${id}`),
  tuongTu: (id: number) => apiFetch<TaiLieuTuongTu[]>(`/tai-lieu/${id}/tuong-tu${qs({ gioi_han: 6 })}`),
  banMemUrl: (id: number) => `/api/tai-lieu/${id}/ban-mem`,
}

// ---------- Mượn (người dùng) ----------
export const muonApi = {
  dangKy: (taiLieuId: number) => postJson<LuotMuon>('/muon', { tai_lieu_id: taiLieuId }),
  cuaToi: () => apiFetch<LuotMuon[]>('/muon/cua-toi'),
}

// ---------- Quản lý (thủ thư) ----------
export type TabMuon = 'cho_duyet' | 'dang_muon' | 'qua_han' | 'da_tra' | 'tu_choi'

export const quanLyApi = {
  hangDoi: (p: { trang_thai: TabMuon; q?: string; trang?: number; kich_thuoc?: number }) =>
    apiFetch<HangDoiMuon>(`/quan-ly/muon${qs({ trang_thai: p.trang_thai, q: p.q, trang: p.trang ?? 1, kich_thuoc: p.kich_thuoc ?? 20 })}`),
  duyet: (id: number) => postJson<LuotMuon>(`/quan-ly/muon/${id}/duyet`),
  tuChoi: (id: number) => postJson<LuotMuon>(`/quan-ly/muon/${id}/tu-choi`),
  tra: (id: number) => postJson<LuotMuon>(`/quan-ly/muon/${id}/tra`),
  timTaiLieu: (q: string, trang = 1) =>
    apiFetch<TrangKetQua<TaiLieuTomTat>>(`/quan-ly/tai-lieu${qs({ q, trang })}`),
  maVanDe: () => apiFetch<MaVanDe[]>('/quan-ly/ma-van-de'),
  suaMaVanDe: (ma: string, ten: string) =>
    apiFetch<MaVanDe>('/quan-ly/ma-van-de', { method: 'PUT', body: JSON.stringify({ ma, ten }) }),
  chuDe: () => apiFetch<ChuDeQuanLy[]>('/quan-ly/chu-de'),
  suaChuDe: (id: number, nhan: string) =>
    apiFetch<ChuDeQuanLy>(`/quan-ly/chu-de/${id}`, { method: 'PUT', body: JSON.stringify({ nhan }) }),
  khoiPhucChuDe: (id: number) => postJson<ChuDeQuanLy>(`/quan-ly/chu-de/${id}/khoi-phuc`),
  /** Tải PDF bằng XMLHttpRequest để có tiến trình (fetch chưa báo tiến trình tải lên). */
  taiBanMem: (
    id: number,
    file: File,
    muc: MucTruyCap,
    onTienTrinh: (phanTram: number) => void,
  ): Promise<TaiLieuChiTiet> => {
    if (import.meta.env.VITE_MOCK === '1') {
      return import('./mock').then((m) => m.moPhongTaiLen(id, muc, onTienTrinh))
    }
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `/api/quan-ly/tai-lieu/${id}/ban-mem`)
      xhr.withCredentials = true
      xhr.setRequestHeader('Accept', 'application/json')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onTienTrinh(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        let body: unknown = null
        try {
          body = JSON.parse(xhr.responseText)
        } catch {
          /* không phải JSON */
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(body as TaiLieuChiTiet)
        else {
          const detail = (body as { detail?: unknown } | null)?.detail
          reject(Object.assign(new Error(typeof detail === 'string' ? detail : `Lỗi ${xhr.status}`), { status: xhr.status }))
        }
      }
      xhr.onerror = () => reject(Object.assign(new Error('Không kết nối được máy chủ.'), { status: 0 }))
      const fd = new FormData()
      fd.append('file', file)
      fd.append('muc_truy_cap', muc)
      xhr.send(fd)
    })
  },
}

// ---------- Thống kê (thủ thư) ----------
const loc = (b: Partial<BoLocThongKe>, them: Record<string, string | number | undefined> = {}) =>
  qs({ tu_ngay: b.tu_ngay, den_ngay: b.den_ngay, loai: b.loai || undefined, tu_khoa: b.tu_khoa || undefined, ...them })

/** Chuẩn hóa phản hồi /thong-ke/luot-doc: chấp nhận cả mảng trần lẫn đối tượng có chuỗi theo ngày. */
export function chuanHoaLuotDoc(raw: unknown): ThongKeLuotDoc {
  if (Array.isArray(raw)) return { tai_lieu: raw as LuotDocTaiLieu[], theo_ngay: [] }
  const o = (raw ?? {}) as Record<string, unknown>
  const taiLieu = (o.tai_lieu ?? o.du_lieu ?? o.top ?? []) as LuotDocTaiLieu[]
  const theoNgay = (o.theo_ngay ?? o.chuoi_theo_ngay ?? o.chuoi ?? []) as { ngay: string; so_luot: number }[]
  return { tai_lieu: Array.isArray(taiLieu) ? taiLieu : [], theo_ngay: Array.isArray(theoNgay) ? theoNgay : [] }
}

export const thongKeApi = {
  tongQuan: (b: BoLocThongKe) => apiFetch<TongQuan>(`/thong-ke/tong-quan${loc(b)}`),
  tuKhoa: (b: Partial<BoLocThongKe>) => apiFetch<TuKhoaThongKe[]>(`/thong-ke/tu-khoa${loc(b, { gioi_han: 60 })}`),
  theoNgay: (b: BoLocThongKe) => apiFetch<DiemTheoNgay[]>(`/thong-ke/theo-ngay${loc(b)}`),
  khongKetQua: (b: BoLocThongKe) =>
    apiFetch<TuKhoaKhongKetQua[]>(`/thong-ke/khong-ket-qua${loc(b, { gioi_han: 20 })}`),
  nenSoHoa: (b: BoLocThongKe) => apiFetch<NenSoHoa[]>(`/thong-ke/nen-so-hoa${loc(b, { gioi_han: 20 })}`),
  theoLoaiHinh: (b: Partial<BoLocThongKe>) => apiFetch<TheoLoaiHinh[]>(`/thong-ke/theo-loai-hinh${loc(b)}`),
  luotDoc: (b: BoLocThongKe) =>
    apiFetch<unknown>(`/thong-ke/luot-doc${loc(b, { gioi_han: 20 })}`).then(chuanHoaLuotDoc),
  chuDeTheoThoiGian: (b: BoLocThongKe) => apiFetch<ChuDeTheoThoiGian>(`/thong-ke/chu-de-theo-thoi-gian${loc(b)}`),
  muonCungNhau: (b: BoLocThongKe, nguong: number) =>
    apiFetch<MuonCungNhau>(`/thong-ke/muon-cung-nhau${loc(b, { nguong, gioi_han_nut: 60 })}`),
}
