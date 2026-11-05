// Chế độ dữ liệu giả lập (chỉ bật khi VITE_MOCK=1). Bọc window.fetch cho các đường dẫn /api theo docs/API.md
// để xem giao diện khi backend chưa chạy. Không dùng trong bản build thường.
import type {
  ChuDeQuanLy,
  DiemTheoNgay,
  KetQuaTimKiem,
  LoaiHinh,
  LuotMuon,
  MaVanDe,
  MucTruyCap,
  NguoiDung,
  TaiLieuChiTiet,
  TaiLieuTomTat,
  TuKhoaThongKe,
} from './types'
import { boDau } from '../lib/highlight'
import { congNgay, isoNgay } from '../lib/format'

function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const r = rng(42)
const chon = <T,>(a: T[]) => a[Math.floor(r() * a.length)]

const CHU_DE = [
  'Công tác lưu trữ', 'Văn bản hành chính', 'Quản trị văn phòng', 'Tài liệu lưu trữ', 'Số hóa tài liệu', 'Thông tin thư viện',
  'Lưu trữ điện tử', 'Bảo quản tài liệu', 'Công tác văn thư', 'Lịch sử Việt Nam', 'Hồ sơ nhân sự', 'Chính quyền địa phương',
  'Quản lý nhà nước', 'Cải cách hành chính', 'Văn hóa công sở', 'Thủ tục hành chính',
]
const NOI = ['tại Ủy ban nhân dân tỉnh Nam Định', 'ở Trung tâm Lưu trữ Quốc gia I', 'tại Bộ Nội vụ', 'giai đoạn 1945–1954', 'tại Thành phố Hà Nội', 'trong các cơ quan nhà nước', 'thời kỳ đổi mới', 'tại Đại học Quốc gia Hà Nội']
const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ']
const TEN = ['Thị Lan', 'Văn Minh', 'Thu Hà', 'Quang Huy', 'Ngọc Anh', 'Đức Thắng', 'Thanh Hương', 'Minh Tuấn', 'Hải Yến']
const LOAI: LoaiHinh[] = ['luan_an', 'luan_van', 'khoa_luan', 'bao_cao_kh', 'ky_yeu', 'sach', 'sach_ha_noi', 'tu_sach_tang']
const TIEN_TO: Record<LoaiHinh, string> = { luan_an: 'LA', luan_van: 'LV', khoa_luan: 'KL', bao_cao_kh: 'KH', ky_yeu: 'KY', sach: 'S', sach_ha_noi: 'HN', tu_sach_tang: 'VDQ' }
const TRONG_SO = [0.04, 0.16, 0.34, 0.08, 0.05, 0.2, 0.08, 0.05]

function loaiNgauNhien(): LoaiHinh {
  let x = r()
  for (let i = 0; i < LOAI.length; i++) {
    x -= TRONG_SO[i]
    if (x <= 0) return LOAI[i]
  }
  return 'khoa_luan'
}

const TAI_LIEU: TaiLieuChiTiet[] = Array.from({ length: 240 }, (_, i) => {
  const loai = loaiNgauNhien()
  const so_ban = loai === 'sach' ? 1 + Math.floor(r() * 3) : 1 + Math.floor(r() * 2)
  const khong = r() < 0.04
  const coMem = !khong && r() < 0.12
  const tieuDe = loai === 'sach' || loai === 'sach_ha_noi' || loai === 'tu_sach_tang' ? `${chon(CHU_DE)}: lý luận và thực tiễn` : `${chon(CHU_DE)} ${chon(NOI)}`
  return {
    id: i + 1,
    ky_hieu: `${TIEN_TO[loai]}.${String(i + 1).padStart(3, '0')}`,
    tieu_de: tieuDe,
    tac_gia: `${chon(HO)} ${chon(TEN)}`,
    loai_hinh: loai,
    nam: 1978 + Math.floor(r() * 47),
    so_ban: khong ? 0 : so_ban,
    so_ban_con: khong ? 0 : Math.max(0, so_ban - (r() < 0.3 ? 1 : 0)),
    co_ban_mem: coMem,
    muc_truy_cap: coMem ? (r() < 0.7 ? 'cong_khai' : 'noi_bo') : null,
    khong_co_tl: khong,
    gvhd: loai.startsWith('lua') || loai === 'khoa_luan' ? `PGS.TS. ${chon(HO)} ${chon(TEN)}` : null,
    co_quan: r() < 0.5 ? 'Khoa Lưu trữ học và Quản trị văn phòng' : null,
    nxb: loai === 'sach' ? chon(['NXB Chính trị Quốc gia', 'NXB Đại học Quốc gia Hà Nội', 'NXB Lao động']) : null,
    nam_goc: null,
    he: loai === 'khoa_luan' ? 'Chính quy' : null,
    khoa_hoc: loai === 'khoa_luan' ? `K${50 + Math.floor(r() * 15)}` : null,
    ghi_chu: khong ? 'Ko có TL' : null,
    ma_van_de: r() < 0.7 ? { ma: chon(['QTVP', 'LTH', 'VB', 'LT', 'KS']), ten: null } : null,
    ban_sao: [],
    luot_muon_cua_toi: null,
  }
})
TAI_LIEU.forEach((t) => {
  t.ban_sao = Array.from({ length: t.so_ban }, (_, j) => ({
    id: t.id * 10 + j,
    ma_ban_sao: `${t.ky_hieu}-${j + 1}`,
    trang_thai: j < t.so_ban_con ? 'con' : 'dang_muon',
  }))
})

const tomTat = (t: TaiLieuChiTiet): TaiLieuTomTat => {
  const { id, ky_hieu, tieu_de, tac_gia, loai_hinh, nam, so_ban, so_ban_con, co_ban_mem, muc_truy_cap, khong_co_tl } = t
  return { id, ky_hieu, tieu_de, tac_gia, loai_hinh, nam, so_ban, so_ban_con, co_ban_mem, muc_truy_cap, khong_co_tl }
}

const NGUOI: Record<string, { mk: string; nd: NguoiDung }> = {
  thuthu: { mk: 'thuthu123', nd: { id: 1, ten_dang_nhap: 'thuthu', ho_ten: 'Lê Thu Thủy', vai_tro: 'thu_thu', nhom: 'thu_thu' } },
  sv01: { mk: 'sv123', nd: { id: 2, ten_dang_nhap: 'sv01', ho_ten: 'Nguyễn Minh Anh', vai_tro: 'sinh_vien', nhom: 'nguoi_dung' } },
  gv01: { mk: 'gv123', nd: { id: 3, ten_dang_nhap: 'gv01', ho_ten: 'Trần Quốc Bảo', vai_tro: 'giang_vien', nhom: 'nguoi_dung' } },
}
let hienTai: NguoiDung | null = null
try {
  const luu = sessionStorage.getItem('mock-nguoi')
  if (luu) hienTai = NGUOI[luu]?.nd ?? null
} catch {
  /* bỏ qua */
}

const homNay = new Date()
const LUOT: LuotMuon[] = Array.from({ length: 46 }, (_, i) => {
  const t = TAI_LIEU[(i * 7) % TAI_LIEU.length]
  const nd = i % 5 === 0 ? NGUOI.sv01.nd : i % 7 === 0 ? NGUOI.gv01.nd : { id: 100 + i, ho_ten: `${chon(HO)} ${chon(TEN)}`, ten_dang_nhap: `sv${100 + i}`, vai_tro: 'sinh_vien', nhom: 'nguoi_dung' as const }
  const tt = (['cho_duyet', 'dang_muon', 'dang_muon', 'da_tra', 'tu_choi'] as const)[i % 5 === 0 ? i % 4 : i % 5]
  const dk = congNgay(homNay, -Math.floor(r() * 40) - 1)
  const muon = tt === 'cho_duyet' || tt === 'tu_choi' ? null : congNgay(dk, 1)
  const han = muon ? congNgay(muon, 14) : null
  return {
    id: i + 1,
    tai_lieu: { id: t.id, ky_hieu: t.ky_hieu, tieu_de: t.tieu_de, loai_hinh: t.loai_hinh },
    nguoi_dung: { id: nd.id, ho_ten: nd.ho_ten, ten_dang_nhap: nd.ten_dang_nhap, vai_tro: nd.vai_tro },
    ma_ban_sao: muon ? `${t.ky_hieu}-1` : null,
    trang_thai: tt,
    ngay_dang_ky: isoNgay(dk),
    ngay_muon: muon ? isoNgay(muon) : null,
    han_tra: han ? isoNgay(han) : null,
    ngay_tra: tt === 'da_tra' ? isoNgay(congNgay(dk, 9)) : null,
    qua_han: tt === 'dang_muon' && !!han && han < homNay,
  }
})

const MA: MaVanDe[] = [
  { ma: 'QTVP', ten: null, so_tai_lieu: 412 },
  { ma: 'LTH', ten: 'Lưu trữ học', so_tai_lieu: 980 },
  { ma: 'VB', ten: null, so_tai_lieu: 233 },
  { ma: 'LT', ten: null, so_tai_lieu: 145 },
  { ma: 'KS', ten: null, so_tai_lieu: 61 },
]

const TU_KHOA_GOC = [
  'lưu trữ', 'văn bản hành chính', 'quản trị văn phòng', 'tài liệu lưu trữ', 'số hóa', 'văn thư', 'hồ sơ', 'lịch sử', 'bảo quản tài liệu',
  'lưu trữ điện tử', 'thủ tục hành chính', 'cải cách hành chính', 'chính quyền địa phương', 'học máy', 'python', 'trí tuệ nhân tạo',
  'thư viện số', 'văn hóa công sở', 'nam định', 'bộ nội vụ', 'quản lý nhà nước', 'hà nội', 'luận văn thạc sĩ', 'khóa luận', 'kỷ yếu',
  'dữ liệu lớn', 'chuyển đổi số', 'metadata', 'mục lục hồ sơ', 'phông lưu trữ',
]
const KHONG_CO = new Set(['học máy', 'python', 'trí tuệ nhân tạo', 'dữ liệu lớn', 'metadata'])

function tuKhoaThongKe(): TuKhoaThongKe[] {
  return TU_KHOA_GOC.map((k, i) => {
    const so_lan = Math.round(900 / Math.pow(i + 1, 1.1))
    return { tu_khoa: boDau(k), hien_thi: k, so_lan, so_lan_khong_kq: KHONG_CO.has(k) ? so_lan : Math.round(so_lan * 0.03) }
  })
}

function soNgay(tu: string, den: string) {
  return Math.round((new Date(den).getTime() - new Date(tu).getTime()) / 86_400_000) + 1
}

function theoNgay(tu: string, den: string, heSo = 1): DiemTheoNgay[] {
  const n = Math.max(1, soNgay(tu, den))
  const g = rng(7)
  return Array.from({ length: n }, (_, i) => {
    const d = congNgay(new Date(`${tu}T00:00:00`), i)
    const cuoiTuan = d.getDay() === 0 || d.getDay() === 6
    const homNayLa = i === n - 1 && isoNgay(d) === isoNgay(homNay)
    const goc = (cuoiTuan ? 45 : 110) + Math.sin(i / 6) * 25 + g() * 30
    const so_luot = Math.round(goc * heSo * (homNayLa ? 0.45 : 1))
    return { ngay: isoNgay(d), so_luot, so_luot_khong_kq: Math.round(so_luot * (0.08 + g() * 0.06)), dang_cap_nhat: homNayLa }
  })
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
const loi = (status: number, detail: string) => json({ detail }, status)
const doi = (ms: number) => new Promise((res) => setTimeout(res, ms))

function khop(t: TaiLieuChiTiet, q: string) {
  if (!q) return true
  const h = boDau(`${t.tieu_de} ${t.tac_gia ?? ''} ${t.ky_hieu}`)
  return boDau(q)
    .split(/\s+/)
    .every((w) => h.includes(w))
}

function trang<T>(ds: T[], tr: number, kt: number) {
  const tong_trang = Math.max(1, Math.ceil(ds.length / kt))
  return { du_lieu: ds.slice((tr - 1) * kt, tr * kt), tong_so: ds.length, trang: tr, kich_thuoc: kt, tong_trang }
}

let logId = 1000

async function xuLy(url: URL, init: RequestInit): Promise<Response> {
  const p = url.pathname.replace(/^\/api/, '')
  const m = (init.method ?? 'GET').toUpperCase()
  const sp = url.searchParams
  const body = typeof init.body === 'string' ? JSON.parse(init.body || '{}') : {}
  await doi(120 + Math.random() * 200)

  if (p === '/health') return json({ status: 'ok', che_do: 'gia_lap' })
  if (p === '/auth/toi') return json({ nguoi_dung: hienTai })
  if (p === '/auth/dang-nhap' && m === 'POST') {
    const n = NGUOI[body.ten_dang_nhap]
    if (!n || n.mk !== body.mat_khau) return loi(401, 'Sai tên đăng nhập hoặc mật khẩu')
    hienTai = n.nd
    sessionStorage.setItem('mock-nguoi', body.ten_dang_nhap)
    return json({ nguoi_dung: n.nd })
  }
  if (p === '/auth/dang-xuat') {
    hienTai = null
    sessionStorage.removeItem('mock-nguoi')
    return json({ ok: true })
  }
  if (p === '/gioi-thieu') {
    const theo = LOAI.map((l) => ({ loai_hinh: l, so_luong: Math.round(TAI_LIEU.filter((t) => t.loai_hinh === l).length * 14.4) }))
    return json({ tong_tai_lieu: 3462, da_so_hoa: TAI_LIEU.filter((t) => t.co_ban_mem).length, so_loai_hinh: 8, theo_loai_hinh: theo, tu_khoa_noi_bat: TU_KHOA_GOC.slice(0, 8) })
  }
  if (p === '/goi-y') {
    const q = sp.get('q') ?? ''
    const qq = boDau(q)
    return json({
      tai_lieu: TAI_LIEU.filter((t) => khop(t, q)).slice(0, 6).map((t) => ({ id: t.id, tieu_de: t.tieu_de, loai_hinh: t.loai_hinh, nam: t.nam })),
      tu_khoa: tuKhoaThongKe().filter((k) => k.tu_khoa.includes(qq)).slice(0, 5).map((k) => ({ tu_khoa: k.hien_thi, so_lan: k.so_lan })),
    })
  }
  if (p === '/tim-kiem') {
    const q = sp.get('q') ?? ''
    const loai = sp.get('loai')
    const tuNam = Number(sp.get('tu_nam')) || 0
    const denNam = Number(sp.get('den_nam')) || 9999
    let ds = TAI_LIEU.filter((t) => khop(t, q))
    const facetLoai = LOAI.map((l) => ({ gia_tri: l, so_luong: ds.filter((t) => t.loai_hinh === l).length })).filter((f) => f.so_luong)
    if (loai) ds = ds.filter((t) => t.loai_hinh === loai)
    ds = ds.filter((t) => (t.nam ?? 0) >= tuNam && (t.nam ?? 0) <= denNam)
    if (sp.get('co_ban_mem')) ds = ds.filter((t) => t.co_ban_mem)
    if (sp.get('con_ban')) ds = ds.filter((t) => t.so_ban_con > 0)
    const sx = sp.get('sap_xep')
    if (sx === 'moi_nhat') ds = [...ds].sort((a, b) => (b.nam ?? 0) - (a.nam ?? 0))
    if (sx === 'cu_nhat') ds = [...ds].sort((a, b) => (a.nam ?? 0) - (b.nam ?? 0))
    const thapNien = [...new Set(ds.map((t) => Math.floor((t.nam ?? 0) / 10) * 10))]
      .sort()
      .map((d) => ({ gia_tri: String(d), so_luong: ds.filter((t) => Math.floor((t.nam ?? 0) / 10) * 10 === d).length }))
    const tr = Number(sp.get('trang')) || 1
    const kq: KetQuaTimKiem = {
      ...trang(ds.map(tomTat), tr, Number(sp.get('kich_thuoc')) || 20),
      log_id: q && tr === 1 ? ++logId : null,
      facet: { loai_hinh: facetLoai, thap_nien: thapNien },
      goi_y_sua: boDau(q) === 'lu tru' ? 'lưu trữ' : null,
      da_sua: boDau(q) === 'lu tru' && !sp.get('chinh_xac') ? 'lưu trữ' : null,
    }
    return json(kq)
  }
  const chonM = p.match(/^\/tim-kiem\/(\d+)\/chon$/)
  if (chonM) return json({ ok: true })
  const tlM = p.match(/^\/tai-lieu\/(\d+)(\/tuong-tu)?$/)
  if (tlM) {
    const t = TAI_LIEU.find((x) => x.id === Number(tlM[1]))
    if (!t) return loi(404, 'Không tìm thấy tư liệu')
    if (tlM[2]) return json(TAI_LIEU.filter((x) => x.id !== t.id && x.loai_hinh === t.loai_hinh).slice(0, 6).map((x) => ({ tai_lieu: tomTat(x), diem: 0.4 })))
    const cuaToi = hienTai ? LUOT.find((l) => l.tai_lieu.id === t.id && l.nguoi_dung?.id === hienTai!.id && (l.trang_thai === 'cho_duyet' || l.trang_thai === 'dang_muon')) ?? null : null
    return json({ ...t, luot_muon_cua_toi: cuaToi })
  }
  if (p === '/muon' && m === 'POST') {
    if (!hienTai) return loi(401, 'Chưa đăng nhập')
    const t = TAI_LIEU.find((x) => x.id === body.tai_lieu_id)
    if (!t) return loi(404, 'Không tìm thấy tư liệu')
    if (t.so_ban_con <= 0) return loi(409, 'Tư liệu đã hết bản sao để mượn.')
    if (LUOT.some((l) => l.tai_lieu.id === t.id && l.nguoi_dung?.id === hienTai!.id && (l.trang_thai === 'cho_duyet' || l.trang_thai === 'dang_muon')))
      return loi(409, 'Bạn đã có lượt mượn đang mở cho tư liệu này.')
    const lm: LuotMuon = {
      id: LUOT.length + 1,
      tai_lieu: { id: t.id, ky_hieu: t.ky_hieu, tieu_de: t.tieu_de, loai_hinh: t.loai_hinh },
      nguoi_dung: { id: hienTai.id, ho_ten: hienTai.ho_ten, ten_dang_nhap: hienTai.ten_dang_nhap, vai_tro: hienTai.vai_tro },
      ma_ban_sao: null,
      trang_thai: 'cho_duyet',
      ngay_dang_ky: isoNgay(homNay),
      ngay_muon: null,
      han_tra: null,
      ngay_tra: null,
      qua_han: false,
    }
    LUOT.unshift(lm)
    return json(lm)
  }
  if (p === '/muon/cua-toi') {
    if (!hienTai) return loi(401, 'Chưa đăng nhập')
    return json(LUOT.filter((l) => l.nguoi_dung?.id === hienTai!.id))
  }
  if (p.startsWith('/quan-ly') || p.startsWith('/thong-ke')) {
    if (!hienTai) return loi(401, 'Chưa đăng nhập')
    if (hienTai.nhom !== 'thu_thu') return loi(403, 'Không có quyền')
  }
  if (p === '/quan-ly/muon') {
    const tt = sp.get('trang_thai') ?? 'cho_duyet'
    const q = boDau(sp.get('q') ?? '')
    const dem = {
      cho_duyet: LUOT.filter((l) => l.trang_thai === 'cho_duyet').length,
      dang_muon: LUOT.filter((l) => l.trang_thai === 'dang_muon').length,
      qua_han: LUOT.filter((l) => l.qua_han).length,
      da_tra: LUOT.filter((l) => l.trang_thai === 'da_tra').length,
      tu_choi: LUOT.filter((l) => l.trang_thai === 'tu_choi').length,
    }
    const ds = LUOT.filter((l) => (tt === 'qua_han' ? l.qua_han : l.trang_thai === tt)).filter(
      (l) => !q || boDau(`${l.tai_lieu.tieu_de} ${l.nguoi_dung?.ho_ten} ${l.nguoi_dung?.ten_dang_nhap}`).includes(q),
    )
    return json({ ...trang(ds, Number(sp.get('trang')) || 1, 20), dem })
  }
  const qlM = p.match(/^\/quan-ly\/muon\/(\d+)\/(duyet|tu-choi|tra)$/)
  if (qlM) {
    const l = LUOT.find((x) => x.id === Number(qlM[1]))
    if (!l) return loi(404, 'Không tìm thấy lượt mượn')
    if (qlM[2] === 'duyet') {
      l.trang_thai = 'dang_muon'
      l.ngay_muon = isoNgay(homNay)
      l.han_tra = isoNgay(congNgay(homNay, 14))
      l.ma_ban_sao = `${l.tai_lieu.ky_hieu}-1`
    } else if (qlM[2] === 'tu-choi') l.trang_thai = 'tu_choi'
    else {
      l.trang_thai = 'da_tra'
      l.ngay_tra = isoNgay(homNay)
      l.qua_han = false
    }
    return json(l)
  }
  if (p === '/quan-ly/tai-lieu') {
    const q = sp.get('q') ?? ''
    return json(trang(TAI_LIEU.filter((t) => khop(t, q)).map(tomTat), Number(sp.get('trang')) || 1, 20))
  }
  if (p === '/quan-ly/ma-van-de') {
    if (m === 'PUT') {
      const x = MA.find((y) => y.ma === body.ma)
      if (!x) return loi(404, 'Không có mã')
      x.ten = body.ten || null
      return json(x)
    }
    return json(MA)
  }
  if (p === '/quan-ly/chu-de') return json(CHU_DE_GL)
  const qlCd = p.match(/^\/quan-ly\/chu-de\/(\d+)$/)
  if (qlCd && m === 'PUT') {
    const x = CHU_DE_GL.find((c) => c.id === Number(qlCd[1]))
    if (!x) return loi(404, 'Không có chủ đề này.')
    if (!String(body.nhan ?? '').trim()) return loi(400, 'Nhãn chủ đề không được để trống.')
    x.nhan = String(body.nhan).trim()
    x.da_sua_tay = x.nhan !== x.nhan_tu_dong
    return json(x)
  }
  const qlCdKp = p.match(/^\/quan-ly\/chu-de\/(\d+)\/khoi-phuc$/)
  if (qlCdKp && m === 'POST') {
    const x = CHU_DE_GL.find((c) => c.id === Number(qlCdKp[1]))
    if (!x) return loi(404, 'Không có chủ đề này.')
    x.nhan = x.nhan_tu_dong
    x.da_sua_tay = false
    return json(x)
  }
  if (p.startsWith('/thong-ke')) {
    const tu = sp.get('tu_ngay') ?? isoNgay(congNgay(homNay, -29))
    const den = sp.get('den_ngay') ?? isoNgay(homNay)
    const heSo = (sp.get('tu_khoa') ? 0.18 : 1) * (sp.get('loai') ? 0.35 : 1)
    const ngays = theoNgay(tu, den, heSo)
    const tong = ngays.reduce((s, d) => s + d.so_luot, 0)
    const ten = p.replace('/thong-ke/', '')
    if (ten === 'tong-quan') {
      const khong = ngays.reduce((s, d) => s + d.so_luot_khong_kq, 0)
      return json({
        tong_luot_tim: tong,
        ti_le_khong_ket_qua: tong ? Math.round((khong / tong) * 1000) / 10 : 0,
        luot_muon_mo: LUOT.filter((l) => l.trang_thai === 'dang_muon' || l.trang_thai === 'cho_duyet').length,
        qua_han: LUOT.filter((l) => l.qua_han).length,
        da_so_hoa: TAI_LIEU.filter((t) => t.co_ban_mem).length,
        tong_tai_lieu: 3462,
        luot_doc: Math.round(tong * 0.06),
        so_sanh_ky_truoc: { tong_luot_tim: Math.round(tong * 0.88), ti_le_khong_ket_qua: tong ? Math.round((khong / tong) * 1120) / 10 : 0, luot_doc: Math.round(tong * 0.05) },
      })
    }
    if (ten === 'tu-khoa') return json(tuKhoaThongKe().map((k) => ({ ...k, so_lan: Math.max(1, Math.round(k.so_lan * heSo * (ngays.length / 30))) })))
    if (ten === 'theo-ngay') return json(ngays)
    if (ten === 'khong-ket-qua')
      return json(tuKhoaThongKe().filter((k) => KHONG_CO.has(k.hien_thi)).map((k) => ({ tu_khoa: k.tu_khoa, hien_thi: k.hien_thi, so_lan: k.so_lan, lan_cuoi: isoNgay(congNgay(homNay, -Math.floor(r() * 5))) })))
    if (ten === 'nen-so-hoa')
      return json(
        TAI_LIEU.filter((t) => !t.co_ban_mem && !t.khong_co_tl && (!sp.get('loai') || t.loai_hinh === sp.get('loai')))
          .slice(0, 20)
          .map((t, i) => {
            const so_lan_chon = Math.round(80 / (i + 1)) + 3
            const so_luot_muon = Math.round(20 / (i + 2))
            return { tai_lieu: tomTat(t), so_lan_chon, so_luot_muon, diem_lan_toa: 0, diem: so_lan_chon + 2 * so_luot_muon, lan_toa_tu: [] }
          })
          .sort((a, b) => b.diem - a.diem),
      )
    if (ten === 'theo-loai-hinh')
      return json(
        LOAI.map((l, i) => {
          const ds = TAI_LIEU.filter((t) => t.loai_hinh === l)
          return { loai_hinh: l, so_tai_lieu: ds.length * 14, so_luot_chon: Math.round(TRONG_SO[i] * tong * 0.4), so_luot_muon: Math.round(TRONG_SO[i] * 300 * heSo), da_so_hoa: ds.filter((t) => t.co_ban_mem).length * 3 }
        }),
      )
    if (ten === 'chu-de-theo-thoi-gian') {
      const tuan = ngays.length > 45
      const ky = ngays.filter((_, i) => !tuan || i % 7 === 0).map((d) => d.ngay)
      const cd = CHU_DE_GL.slice(0, 10)
      const du_lieu = cd.flatMap((c, j) => ky.map((k, i) => [k, Math.round((12 / (j + 1)) * (1 + Math.sin(i / 2 + j)) * heSo * (tuan ? 5 : 1)), c.nhan]))
      return json({
        chu_de: cd.map((c) => ({ id: c.id, nhan: c.nhan, so_luot: du_lieu.filter((d) => d[2] === c.nhan).reduce((t, d) => t + (d[1] as number), 0) })),
        don_vi: tuan ? 'tuan' : 'ngay',
        du_lieu,
      })
    }
    if (ten === 'muon-cung-nhau') {
      const nguong = Number(sp.get('nguong')) || 2
      if (nguong < 2) return loi(400, 'Dữ liệu không hợp lệ: nguong phải ≥ 2')
      const ds = TAI_LIEU.slice(0, 24)
      const canh = ds.flatMap((a, i) => ds.slice(i + 1, i + 4).map((b, j) => ({ nguon: a.id, dich: b.id, trong_so: 1 + ((i + j) % 4) }))).filter((c) => c.trong_so >= nguong)
      const co = new Set(canh.flatMap((c) => [c.nguon, c.dich]))
      return json({
        nut: ds.filter((t) => co.has(t.id)).map((t, i) => ({ id: t.id, ten: t.tieu_de.slice(0, 48), tieu_de: t.tieu_de, ky_hieu: t.ky_hieu, loai_hinh: t.loai_hinh, chu_de: { id: CHU_DE_GL[i % 12].id, nhan: CHU_DE_GL[i % 12].nhan }, so_luot_muon: 2 + (i % 9) })),
        canh,
        nguong,
        trong_so_lon_nhat: 4,
        tong_so_nut: co.size,
      })
    }
    if (ten === 'luot-doc')
      return json({
        top: TAI_LIEU.filter((t) => t.co_ban_mem).slice(0, 10).map((t, i) => ({ tai_lieu: tomTat(t), so_luot_doc: Math.round(60 / (i + 1)) })),
        theo_ngay: ngays.map((d) => ({ ngay: d.ngay, so_luot: Math.round(d.so_luot * 0.06) })),
      })
  }
  return loi(404, `Giả lập chưa hỗ trợ ${m} ${p}`)
}

const CHU_DE_GL: ChuDeQuanLy[] = [
  'Tổng hợp (nhiều chủ đề)', 'lưu trữ, tài liệu, trung tâm', 'công tác, quản lý, văn thư', 'văn phòng, quản trị, hoạt động',
  'việt nam, lưu trữ, tập đoàn', 'văn bản, quản lý, hệ thống', 'công ty, cổ phần, văn phòng', 'toàn tập, văn kiện, hồ chí minh',
  'sử dụng, khai thác, tài liệu', 'lịch sử, việt nam, lưu trữ', 'đại học, nhân văn, xã hội', 'hành chính, cải cách, thủ tục',
].map((nhan, i) => ({
  id: i + 1, nhan, nhan_tu_dong: nhan, da_sua_tay: false,
  tu_khoa_noi_bat: i === 0 ? ['hà nội', 'tập', 'văn hóa', 'luật', 'tổ chức'] : nhan.split(', '), so_tai_lieu: 900 - i * 70,
}))

export function batGiaLap() {
  const goc = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const url = new URL(raw, window.location.origin)
    if (url.origin === window.location.origin && url.pathname.startsWith('/api/') && !url.pathname.endsWith('/ban-mem')) return xuLy(url, init)
    return goc(input, init)
  }
  console.info('[giả lập] Đang dùng dữ liệu giả lập cho /api (VITE_MOCK=1)')
}

export async function moPhongTaiLen(id: number, muc: MucTruyCap, onTienTrinh: (p: number) => void): Promise<TaiLieuChiTiet> {
  for (let p = 0; p <= 100; p += 10) {
    onTienTrinh(p)
    await doi(90)
  }
  const t = TAI_LIEU.find((x) => x.id === id)
  if (!t) throw new Error('Không tìm thấy tư liệu')
  t.co_ban_mem = true
  t.muc_truy_cap = muc
  return { ...t }
}
