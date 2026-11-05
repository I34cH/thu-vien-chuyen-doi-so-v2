// Kiểu dữ liệu theo hợp đồng docs/API.md. Khóa JSON giữ nguyên tiếng Việt không dấu.

export type LoaiHinh =
  | 'luan_an'
  | 'luan_van'
  | 'khoa_luan'
  | 'bao_cao_kh'
  | 'ky_yeu'
  | 'sach'
  | 'sach_ha_noi'
  | 'tu_sach_tang'

export type NhomVaiTro = 'nguoi_dung' | 'thu_thu'
export type MucTruyCap = 'cong_khai' | 'noi_bo'

export interface NguoiDung {
  id: number
  ten_dang_nhap: string
  ho_ten: string
  vai_tro: string
  nhom: NhomVaiTro
}

export interface TaiLieuTomTat {
  id: number
  ky_hieu: string
  tieu_de: string
  tac_gia: string | null
  loai_hinh: LoaiHinh
  nam: number | null
  so_ban: number
  so_ban_con: number
  co_ban_mem: boolean
  muc_truy_cap: MucTruyCap | null
  khong_co_tl: boolean
}

export type TrangThaiMuon = 'cho_duyet' | 'dang_muon' | 'da_tra' | 'tu_choi'

export interface LuotMuon {
  id: number
  tai_lieu: { id: number; ky_hieu: string; tieu_de: string; loai_hinh: LoaiHinh }
  nguoi_dung?: { id: number; ho_ten: string; ten_dang_nhap: string; vai_tro: string }
  ma_ban_sao: string | null
  trang_thai: TrangThaiMuon
  ngay_dang_ky: string
  ngay_muon: string | null
  han_tra: string | null
  ngay_tra: string | null
  qua_han: boolean
}

export interface BanSao {
  id: number
  ma_ban_sao: string
  trang_thai: 'con' | 'dang_muon' | 'mat'
}

export interface TaiLieuChiTiet extends TaiLieuTomTat {
  gvhd: string | null
  co_quan: string | null
  nxb: string | null
  nam_goc: string | null
  he: string | null
  khoa_hoc: string | null
  ghi_chu: string | null
  ma_van_de: { ma: string; ten: string | null } | null
  ban_sao: BanSao[]
  luot_muon_cua_toi: LuotMuon | null
}

export interface TrangKetQua<T> {
  du_lieu: T[]
  tong_so: number
  trang: number
  kich_thuoc: number
  tong_trang: number
}

// ---- Tài khoản ----
export interface DangNhapVao {
  ten_dang_nhap: string
  mat_khau: string
}
export interface PhanHoiNguoiDung {
  nguoi_dung: NguoiDung | null
}

// ---- Tra cứu ----
export interface GioiThieu {
  tong_tai_lieu: number
  da_so_hoa: number
  so_loai_hinh: number
  theo_loai_hinh: { loai_hinh: LoaiHinh; so_luong: number }[]
  tu_khoa_noi_bat: string[]
}

export interface GoiY {
  tai_lieu: { id: number; tieu_de: string; loai_hinh: LoaiHinh; nam: number | null }[]
  tu_khoa: { tu_khoa: string; so_lan: number }[]
}

export type SapXep = 'lien_quan' | 'moi_nhat' | 'cu_nhat'

export interface FacetMuc {
  gia_tri: string
  so_luong: number
}

export interface KetQuaTimKiem extends TrangKetQua<TaiLieuTomTat> {
  log_id: number | null
  facet: { loai_hinh: FacetMuc[]; thap_nien: FacetMuc[] }
  /** Cụm gần đúng (dạng có dấu) khi truy vấn có vẻ gõ sai; vẫn trả khi chinh_xac=1. */
  goi_y_sua: string | null
  /** Cụm đã dùng để tìm khi hệ thống tự sửa lỗi gõ ("Đang hiện kết quả cho …"); null khi không sửa hoặc chinh_xac=1. */
  da_sua: string | null
}

export interface TaiLieuTuongTu {
  tai_lieu: TaiLieuTomTat
  diem: number
}

// ---- Quản lý ----
export interface DemTrangThai {
  cho_duyet: number
  dang_muon: number
  qua_han: number
  da_tra: number
  tu_choi: number
}
export interface HangDoiMuon extends TrangKetQua<LuotMuon> {
  dem: DemTrangThai
}
export interface MaVanDe {
  ma: string
  ten: string | null
  so_tai_lieu: number
}

// ---- Thống kê ----
export interface TongQuan {
  tong_luot_tim: number
  ti_le_khong_ket_qua: number
  luot_muon_mo: number
  qua_han: number
  da_so_hoa: number
  tong_tai_lieu: number
  luot_doc: number
  so_sanh_ky_truoc: { tong_luot_tim: number; ti_le_khong_ket_qua: number; luot_doc: number }
}
export interface TuKhoaThongKe {
  tu_khoa: string
  hien_thi: string
  so_lan: number
  so_lan_khong_kq: number
}
export interface DiemTheoNgay {
  ngay: string
  so_luot: number
  so_luot_khong_kq: number
  dang_cap_nhat: boolean
}
export interface TuKhoaKhongKetQua {
  tu_khoa: string
  hien_thi: string
  so_lan: number
  lan_cuoi: string
}
/** Một tư liệu đã có bản mềm góp điểm lan tỏa (dong_gop = so_luot_doc × diem_tuong_tu, làm tròn 1 chữ số). */
export interface NguonLanToa {
  id: number
  tieu_de: string
  so_luot_doc: number
  diem_tuong_tu: number
  dong_gop: number
}
export interface NenSoHoa {
  tai_lieu: TaiLieuTomTat
  so_lan_chon: number
  so_luot_muon: number
  diem_lan_toa: number
  diem: number
  /** Top 3 nguồn lan tỏa, rỗng khi diem_lan_toa = 0. */
  lan_toa_tu: NguonLanToa[]
}

// ---- Chủ đề (chặng 5) ----
export interface ChuDeQuanLy {
  id: number
  nhan: string
  /** Nhãn do pipeline sinh (từ nổi bật, hoặc "Tổng hợp (nhiều chủ đề)" với cụm kém tập trung). */
  nhan_tu_dong: string
  /** Thủ thư đã sửa tay (nhãn được giữ qua pipeline.reset). */
  da_sua_tay: boolean
  tu_khoa_noi_bat: string[]
  so_tai_lieu: number
}
export interface ChuDeTheoThoiGian {
  chu_de: { id: number; nhan: string; so_luot: number }[]
  don_vi: 'ngay' | 'tuan'
  /** [ngày đầu kỳ, số lượt, nhãn chủ đề] — đủ lưới kỳ × chủ đề */
  du_lieu: [string, number, string][]
}
export interface NutMuon {
  id: number
  ten: string
  tieu_de: string
  ky_hieu: string
  loai_hinh: LoaiHinh
  chu_de: { id: number; nhan: string } | null
  so_luot_muon: number
}
export interface CanhMuon {
  nguon: number
  dich: number
  trong_so: number
}
export interface MuonCungNhau {
  nut: NutMuon[]
  canh: CanhMuon[]
  nguong: number
  /** Trọng số lớn nhất trên mọi cạnh, trước khi lọc ngưỡng (để đặt thanh trượt). */
  trong_so_lon_nhat: number
  /** Số nút trước khi cắt theo gioi_han_nut. */
  tong_so_nut: number
}
export interface TheoLoaiHinh {
  loai_hinh: LoaiHinh
  so_tai_lieu: number
  so_luot_chon: number
  so_luot_muon: number
  da_so_hoa: number
}
export interface LuotDocTaiLieu {
  tai_lieu: TaiLieuTomTat
  so_luot_doc: number
}
/** Dạng đã chuẩn hóa ở frontend (hợp đồng chưa chốt khóa của chuỗi theo ngày). */
export interface ThongKeLuotDoc {
  tai_lieu: LuotDocTaiLieu[]
  theo_ngay: { ngay: string; so_luot: number }[]
}

/** Bộ lọc chung của mọi API thống kê. */
export interface BoLocThongKe {
  tu_ngay: string
  den_ngay: string
  loai?: LoaiHinh | ''
  tu_khoa?: string
}
