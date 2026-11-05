import { useId, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { FlaskConical, FileUp, Search, X } from 'lucide-react'
import { quanLyApi, thongKeApi } from '../api/endpoints'
import type { BoLocThongKe, LoaiHinh } from '../api/types'
import { BangSoLieu, KhungBieuDo } from '../components/dashboard/KhungBieuDo'
import { BieuDoLoaiHinh, BieuDoLuotDocNgay, BieuDoTheoNgay, BieuDoTopTuKhoa } from '../components/dashboard/BieuDo'
import { WordCloud } from '../components/dashboard/WordCloud'
import { BieuDoChuDe, gopChuDe } from '../components/dashboard/BieuDoChuDe'
import { DoThiMuon } from '../components/dashboard/DoThiMuon'
import { PopoverLanToa } from '../components/dashboard/PopoverLanToa'
import { bangMauChuDe } from '../lib/echarts'
import { soSanhDiem, soSanhTuongDoi, TheKpi } from '../components/dashboard/TheKpi'
import { ErrorState, nutClass, PageHeader, Skeleton } from '../components/ui'
import { useBoLocDashboard, type Khoang } from '../hooks/useBoLocDashboard'
import { useDebounce, useTieuDe } from '../hooks/useTienIch'
import { DS_LOAI_HINH, giaTriPhanTram, LOAI_HINH, ngay, nhanLoaiHinh, phanTram, so } from '../lib/format'

const KHOANG: { k: Khoang; nhan: string }[] = [
  { k: '7', nhan: '7 ngày' },
  { k: '30', nhan: '30 ngày' },
  { k: '90', nhan: '90 ngày' },
  { k: 'tuy_chon', nhan: 'Tùy chọn' },
]

function useThongKe<T>(ten: string, boLoc: Partial<BoLocThongKe>, fn: () => Promise<T>) {
  return useQuery({ queryKey: ['thong-ke', ten, boLoc], queryFn: fn, placeholderData: keepPreviousData })
}

function NhanMoPhong() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-gold-500/70 bg-gold-100/50 px-2.5 py-0.5 text-xs font-semibold text-gold-700"
      title="Lượt tìm, lượt mượn và lượt đọc trên dashboard được sinh mô phỏng để trình diễn. Danh mục tư liệu là dữ liệu thật."
    >
      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
      Số liệu mô phỏng
    </span>
  )
}

function ThanhBoLoc() {
  const { tt, dat } = useBoLocDashboard()
  const id = useId()
  const coLoc = tt.loai || tt.tu_khoa || tt.khoang !== '30'
  const o = 'h-9 rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20'
  return (
    <div className="z-30 -mx-4 mb-6 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 md:sticky md:top-16">
      <div role="group" aria-label="Bộ lọc dashboard" className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <div role="radiogroup" aria-label="Khoảng thời gian" className="inline-flex rounded-lg border border-line-strong bg-surface p-0.5">
          {KHOANG.map((k) => (
            <button
              key={k.k}
              type="button"
              role="radio"
              aria-checked={tt.khoang === k.k}
              onClick={() => dat(k.k === 'tuy_chon' ? { khoang: k.k, tu_ngay: tt.tu_ngay, den_ngay: tt.den_ngay } : { khoang: k.k })}
              className={clsx(
                'h-8 rounded-md px-3 text-sm font-semibold transition-colors',
                tt.khoang === k.k ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-soft hover:bg-brand-50 hover:text-ink',
              )}
            >
              {k.nhan}
            </button>
          ))}
        </div>

        {tt.khoang === 'tuy_chon' && (
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor={`${id}-tu`} className="an-truc-quan">Từ ngày</label>
            <input id={`${id}-tu`} type="date" value={tt.tu_ngay} max={tt.den_ngay} onChange={(e) => e.target.value && dat({ tu_ngay: e.target.value })} className={o} />
            <span className="text-muted" aria-hidden="true">–</span>
            <label htmlFor={`${id}-den`} className="an-truc-quan">Đến ngày</label>
            <input id={`${id}-den`} type="date" value={tt.den_ngay} min={tt.tu_ngay} onChange={(e) => e.target.value && dat({ den_ngay: e.target.value })} className={o} />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          Loại hình
          <select value={tt.loai} onChange={(e) => dat({ loai: e.target.value as LoaiHinh | '' })} className={o}>
            <option value="">Tất cả</option>
            {DS_LOAI_HINH.map((l) => (
              <option key={l} value={l}>
                {LOAI_HINH[l].nhan}
              </option>
            ))}
          </select>
        </label>

        {tt.tu_khoa && (
          <button
            type="button"
            onClick={() => dat({ tu_khoa: '' })}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-600 pl-3 pr-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            aria-label={`Bỏ lọc từ khóa ${tt.tu_khoa}`}
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />“{tt.tu_khoa}”
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}

        <span className="ml-auto hidden text-xs text-muted tabular-nums sm:inline">
          {ngay(tt.tu_ngay)} – {ngay(tt.den_ngay)}
        </span>
        {coLoc && (
          <button type="button" onClick={() => dat({ khoang: '30', loai: '', tu_khoa: '' })} className="text-sm font-semibold text-brand-600 hover:underline">
            Đặt lại
          </button>
        )}
      </div>
    </div>
  )
}

function KhoiKpi({ boLoc, nhanKy }: { boLoc: BoLocThongKe; nhanKy: string }) {
  const q = useThongKe('tong-quan', boLoc, () => thongKeApi.tongQuan(boLoc))
  if (q.isPending)
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-[7.5rem]" />
        ))}
      </div>
    )
  if (q.isError) return <ErrorState compact error={q.error} onRetry={() => q.refetch()} />
  const d = q.data
  const ss = d.so_sanh_ky_truoc
  return (
    <div className={clsx('grid grid-cols-2 gap-3 lg:grid-cols-5', q.isPlaceholderData && 'dang-lam-moi')}>
      <TheKpi nhan="Lượt tìm" giaTri={so(d.tong_luot_tim)} soSanh={soSanhTuongDoi(d.tong_luot_tim, ss.tong_luot_tim, true)} kyTruoc={nhanKy} />
      <TheKpi
        nhan="Tìm không ra"
        giaTri={giaTriPhanTram(d.ti_le_khong_ket_qua)}
        soSanh={soSanhDiem(d.ti_le_khong_ket_qua, ss.ti_le_khong_ket_qua, false)}
        kyTruoc={nhanKy}
        nhan_tooltip="Tỉ lệ lượt tìm không trả về tư liệu nào"
      />
      <TheKpi
        nhan="Lượt mượn đang mở"
        giaTri={so(d.luot_muon_mo)}
        phu={
          d.qua_han > 0 ? (
            <Link to="/quan-ly" className="font-semibold text-danger hover:underline">
              {so(d.qua_han)} lượt quá hạn
            </Link>
          ) : (
            'Không có lượt quá hạn'
          )
        }
      />
      <TheKpi
        nhan="Đã số hóa"
        giaTri={so(d.da_so_hoa)}
        phu={`${phanTram(d.tong_tai_lieu ? d.da_so_hoa / d.tong_tai_lieu : 0)} của ${so(d.tong_tai_lieu)} tư liệu`}
      />
      <div className="col-span-2 lg:col-span-1">
        <TheKpi nhan="Lượt đọc bản mềm" giaTri={so(d.luot_doc)} soSanh={soSanhTuongDoi(d.luot_doc, ss.luot_doc, true)} kyTruoc={nhanKy} />
      </div>
    </div>
  )
}

function ThanhNgang({ giaTri, max, mau = 'bg-brand-600' }: { giaTri: number; max: number; mau?: string }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-line/60" aria-hidden="true">
      <span className={clsx('block h-full rounded-full', mau)} style={{ width: `${Math.max(2, (giaTri / Math.max(1, max)) * 100)}%` }} />
    </span>
  )
}

function NutXemThem({ tong, het, onDoi }: { tong: number; het: boolean; onDoi: () => void }) {
  if (tong <= 10) return null
  return (
    <div className="border-t border-line px-5 pt-3 sm:px-6">
      <button type="button" onClick={onDoi} aria-expanded={het} className="text-sm font-semibold text-brand-600 hover:underline">
        {het ? 'Thu gọn' : `Xem thêm ${tong - 10} dòng`}
      </button>
    </div>
  )
}

function Bang({ children }: { children: ReactNode }) {
  return <div className="relative -mx-5 overflow-x-auto sm:-mx-6">{children}</div>
}

export default function Dashboard() {
  useTieuDe('Dashboard')
  const { tt, boLoc, dat } = useBoLocDashboard()
  // Biểu đồ từ khóa bỏ qua bộ lọc từ khóa (để vẫn thấy các từ khác và từ đang chọn nổi lên);
  // biểu đồ loại hình bỏ qua bộ lọc loại hình vì cùng lý do.
  const locKhongTuKhoa = { ...boLoc, tu_khoa: '' }
  const locKhongLoai = { ...boLoc, loai: '' as const }

  const tuKhoa = useThongKe('tu-khoa', locKhongTuKhoa, () => thongKeApi.tuKhoa(locKhongTuKhoa))
  const theoNgay = useThongKe('theo-ngay', boLoc, () => thongKeApi.theoNgay(boLoc))
  const loaiHinh = useThongKe('theo-loai-hinh', locKhongLoai, () => thongKeApi.theoLoaiHinh(locKhongLoai))
  const khongKq = useThongKe('khong-ket-qua', boLoc, () => thongKeApi.khongKetQua(boLoc))
  const nenSoHoa = useThongKe('nen-so-hoa', boLoc, () => thongKeApi.nenSoHoa(boLoc))
  const luotDoc = useThongKe('luot-doc', boLoc, () => thongKeApi.luotDoc(boLoc))
  const chuDeTg = useThongKe('chu-de-theo-thoi-gian', boLoc, () => thongKeApi.chuDeTheoThoiGian(boLoc))
  const [nguong, setNguong] = useState(2)
  const nguongGui = useDebounce(nguong, 250)
  const locMuon = { ...boLoc, nguong: nguongGui }
  const muonCung = useThongKe('muon-cung-nhau', locMuon, () => thongKeApi.muonCungNhau(boLoc, nguongGui))
  // Màu chủ đề cố định theo kho (8 chủ đề nhiều tư liệu nhất), dùng chung cho ThemeRiver và đồ thị mượn
  const dsChuDe = useQuery({ queryKey: ['quan-ly', 'chu-de'], queryFn: quanLyApi.chuDe, staleTime: 5 * 60_000 })
  const mauChuDe = useMemo(() => bangMauChuDe(dsChuDe.data ?? []), [dsChuDe.data])
  const song = useMemo(() => (chuDeTg.data ? gopChuDe(chuDeTg.data, mauChuDe) : null), [chuDeTg.data, mauChuDe])
  const [noiChuDe, setNoiChuDe] = useState('')
  const navigate = useNavigate()

  const soNgay = Math.round((new Date(tt.den_ngay).getTime() - new Date(tt.tu_ngay).getTime()) / 86_400_000) + 1
  const nhanKy = `so với ${soNgay} ngày trước đó`
  const chonTuKhoa = (k: string) => dat({ tu_khoa: k })
  const maxDiem = Math.max(1, ...(nenSoHoa.data?.map((d) => d.diem) ?? [1]))
  const maxKhong = Math.max(1, ...(khongKq.data?.map((d) => d.so_lan) ?? [1]))
  const maxDoc = Math.max(1, ...(luotDoc.data?.tai_lieu.map((d) => d.so_luot_doc) ?? [1]))
  const [hetNen, setHetNen] = useState(false)
  const [hetKhong, setHetKhong] = useState(false)
  const loc = [tt.loai && nhanLoaiHinh(tt.loai), tt.tu_khoa && `“${tt.tu_khoa}”`].filter(Boolean).join(', ')

  return (
    <div>
      <PageHeader
        title="Dashboard"
        canhTieuDe={<NhanMoPhong />}
        description="Bạn đọc đang tìm gì, tìm không ra gì, và tư liệu nào nên số hóa trước. Chỉ số tổng hợp, không hiện ai tìm gì."
      />
      <ThanhBoLoc />

      <div className="space-y-6">
        <KhoiKpi boLoc={boLoc} nhanKy={nhanKy} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <KhungBieuDo
            cauHoi="Bạn đọc tìm nhiều vào những ngày nào?"
            cachDoc={<>Mỗi điểm là tổng lượt tìm trong ngày{loc && ` (lọc: ${loc})`}. Nét đứt là hôm nay, số liệu còn đang cập nhật.</>}
            dangTai={theoNgay.isPending}
            dangLamMoi={theoNgay.isPlaceholderData}
            loi={theoNgay.error}
            onThuLai={() => theoNgay.refetch()}
            rong={!!theoNgay.data && theoNgay.data.every((d) => d.so_luot === 0)}
            bang={theoNgay.data && <BangSoLieu cot={['Ngày', 'Lượt tìm', 'Không có kết quả']} dong={theoNgay.data.map((d) => [ngay(d.ngay) + (d.dang_cap_nhat ? ' *' : ''), so(d.so_luot), so(d.so_luot_khong_kq)])} />}
          >
            {theoNgay.data && <BieuDoTheoNgay du_lieu={theoNgay.data} />}
          </KhungBieuDo>

          <KhungBieuDo
            cauHoi="Loại hình nào được quan tâm nhất?"
            cachDoc="Lượt chọn từ kết quả tìm và lượt mượn, kèm tỉ lệ đã số hóa. Bấm một loại hình để lọc."
            dangTai={loaiHinh.isPending}
            dangLamMoi={loaiHinh.isPlaceholderData}
            loi={loaiHinh.error}
            onThuLai={() => loaiHinh.refetch()}
            rong={!!loaiHinh.data && loaiHinh.data.length === 0}
            bang={
              loaiHinh.data && (
                <BangSoLieu
                  cot={['Loại hình', 'Lượt chọn', 'Lượt mượn', 'Đã số hóa']}
                  dong={loaiHinh.data.map((d) => [nhanLoaiHinh(d.loai_hinh), so(d.so_luot_chon), so(d.so_luot_muon), `${so(d.da_so_hoa)}/${so(d.so_tai_lieu)}`])}
                />
              )
            }
          >
            {loaiHinh.data && <BieuDoLoaiHinh du_lieu={loaiHinh.data} dangChon={tt.loai} onChon={(l) => dat({ loai: l as LoaiHinh | '' })} />}
          </KhungBieuDo>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <KhungBieuDo
            cauHoi="Bạn đọc hay tìm những cụm từ nào?"
            cachDoc="Cỡ chữ theo số lượt tìm của cả cụm truy vấn. Bấm một từ để lọc mọi biểu đồ."
            dangTai={tuKhoa.isPending}
            dangLamMoi={tuKhoa.isPlaceholderData}
            loi={tuKhoa.error}
            onThuLai={() => tuKhoa.refetch()}
            rong={!!tuKhoa.data && tuKhoa.data.length === 0}
            chieuCao="h-[300px]"
          >
            {tuKhoa.data && <WordCloud du_lieu={tuKhoa.data} dangChon={tt.tu_khoa} onChon={chonTuKhoa} />}
          </KhungBieuDo>

          <KhungBieuDo
            cauHoi="15 từ khóa nào được tìm nhiều nhất?"
            cachDoc={tt.tu_khoa ? `Đang lọc theo “${tt.tu_khoa}”: các từ khác được làm mờ. Bấm lại để bỏ lọc.` : 'Xếp theo số lượt tìm. Bấm một cột để lọc cả dashboard.'}
            dangTai={tuKhoa.isPending}
            dangLamMoi={tuKhoa.isPlaceholderData}
            loi={tuKhoa.error}
            onThuLai={() => tuKhoa.refetch()}
            rong={!!tuKhoa.data && tuKhoa.data.length === 0}
            bang={tuKhoa.data && <BangSoLieu cot={['Từ khóa', 'Lượt tìm', 'Không có kết quả']} dong={tuKhoa.data.slice(0, 15).map((d) => [d.hien_thi, so(d.so_lan), so(d.so_lan_khong_kq)])} />}
          >
            {tuKhoa.data && <BieuDoTopTuKhoa du_lieu={tuKhoa.data} dangChon={tt.tu_khoa} onChon={chonTuKhoa} />}
          </KhungBieuDo>
        </div>

        <KhungBieuDo
          cauHoi="Tư liệu nào nên số hóa trước?"
          cachDoc={
            <>
              Điểm = lượt chọn + 2 × lượt mượn + lan tỏa. Lan tỏa (phần phụ): bản mềm tương tự đang được đọc (độ tương tự × ln(1 + lượt đọc), tăng chậm dần theo lượt đọc); bấm dấu hỏi để xem nguồn. Chỉ gồm tư liệu chưa có bản mềm và còn bản giấy.
            </>
          }
          dangTai={nenSoHoa.isPending}
          dangLamMoi={nenSoHoa.isPlaceholderData}
          loi={nenSoHoa.error}
          onThuLai={() => nenSoHoa.refetch()}
          rong={!!nenSoHoa.data && nenSoHoa.data.length === 0}
          thongDiepRong="Không có tư liệu nào cần ưu tiên trong khoảng và bộ lọc này."
        >
          {nenSoHoa.data && (
            <Bang>
              <table className="w-full min-w-[44rem] text-sm">
                <thead className="border-y border-line bg-paper/60 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th scope="col" className="w-10 py-2.5 pl-5 text-left font-semibold sm:pl-6">#</th>
                    <th scope="col" className="py-2.5 text-left font-semibold">Tư liệu</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Lượt chọn</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Lượt mượn</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-semibold">Lan tỏa</th>
                    <th scope="col" className="w-40 px-3 py-2.5 text-left font-semibold">Điểm</th>
                    <th scope="col" className="py-2.5 pr-5 text-right font-semibold sm:pr-6"><span className="an-truc-quan">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody>
                  {nenSoHoa.data.slice(0, hetNen ? undefined : 10).map((d, i) => (
                    <tr key={d.tai_lieu.id} className="border-b border-line/70 last:border-b-0 hover:bg-brand-50/40">
                      <td className="py-3 pl-5 tabular-nums text-muted sm:pl-6">{i + 1}</td>
                      <td className="max-w-[26rem] py-3 pr-3">
                        <Link to={`/tai-lieu/${d.tai_lieu.id}`} className="line-clamp-2 font-semibold leading-snug text-ink no-underline hover:text-brand-700 hover:underline">
                          {d.tai_lieu.tieu_de}
                        </Link>
                        <span className="text-xs text-muted">
                          {nhanLoaiHinh(d.tai_lieu.loai_hinh)} · <span className="font-mono">{d.tai_lieu.ky_hieu}</span>
                          {d.tai_lieu.nam ? ` · ${d.tai_lieu.nam}` : ''}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink-soft">{so(d.so_lan_chon)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink-soft">{so(d.so_luot_muon)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink-soft">
                        <span className="inline-flex items-center justify-end gap-1">
                          {d.diem_lan_toa > 0 ? d.diem_lan_toa.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : <span className="text-muted">0</span>}
                          {d.lan_toa_tu.length > 0 ? (
                            <PopoverLanToa diem={d.diem_lan_toa} nguon={d.lan_toa_tu} tieuDe={d.tai_lieu.tieu_de} />
                          ) : (
                            <span className="w-6" aria-hidden="true" />
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2">
                          <span className="w-10 text-right font-semibold tabular-nums text-ink">{d.diem.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</span>
                          <ThanhNgang giaTri={d.diem} max={maxDiem} />
                        </span>
                      </td>
                      <td className="py-3 pr-5 text-right sm:pr-6">
                        <Link to={`/quan-ly?muc=so-hoa&tai_lieu=${d.tai_lieu.id}`} className={nutClass('secondary', 'sm', 'h-8')}>
                          <FileUp className="h-4 w-4" aria-hidden="true" />
                          Số hóa
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <NutXemThem tong={nenSoHoa.data.length} het={hetNen} onDoi={() => setHetNen((v) => !v)} />
            </Bang>
          )}
        </KhungBieuDo>

        <div className="grid gap-6 lg:grid-cols-2">
          <KhungBieuDo
            cauHoi="Bạn đọc tìm gì mà thư viện chưa có?"
            cachDoc="Từ khóa tìm nhiều nhưng không ra kết quả: gợi ý mua hoặc bổ sung tư liệu."
            dangTai={khongKq.isPending}
            dangLamMoi={khongKq.isPlaceholderData}
            loi={khongKq.error}
            onThuLai={() => khongKq.refetch()}
            rong={!!khongKq.data && khongKq.data.length === 0}
            thongDiepRong="Mọi lượt tìm trong khoảng này đều có kết quả."
          >
            {khongKq.data && (
              <Bang>
                <table className="w-full text-sm">
                  <thead className="border-y border-line bg-paper/60 text-xs uppercase tracking-wider text-muted">
                    <tr>
                      <th scope="col" className="py-2.5 pl-5 text-left font-semibold sm:pl-6">Từ khóa</th>
                      <th scope="col" className="w-36 px-3 py-2.5 text-left font-semibold">Lượt tìm</th>
                      <th scope="col" className="py-2.5 pr-5 text-right font-semibold sm:pr-6">Lần cuối</th>
                    </tr>
                  </thead>
                  <tbody>
                    {khongKq.data.slice(0, hetKhong ? undefined : 10).map((d) => (
                      <tr key={d.tu_khoa} className="border-b border-line/70 last:border-b-0">
                        <td className="py-2.5 pl-5 sm:pl-6">
                          <Link to={`/tra-cuu?q=${encodeURIComponent(d.hien_thi)}`} className="font-semibold text-ink no-underline hover:text-brand-700 hover:underline" title="Thử tìm lại trong danh mục">
                            {d.hien_thi}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-2">
                            <span className="w-8 text-right tabular-nums text-ink">{so(d.so_lan)}</span>
                            <ThanhNgang giaTri={d.so_lan} max={maxKhong} mau="bg-gold-700" />
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-5 text-right tabular-nums text-muted sm:pr-6">{ngay(d.lan_cuoi)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <NutXemThem tong={khongKq.data.length} het={hetKhong} onDoi={() => setHetKhong((v) => !v)} />
              </Bang>
            )}
          </KhungBieuDo>

          <KhungBieuDo
            cauHoi="Bản mềm nào đang được đọc?"
            cachDoc="Lượt mở bản mềm theo ngày và các tư liệu được đọc nhiều nhất. Đây là dữ liệu cho vòng số hóa tiếp theo."
            dangTai={luotDoc.isPending}
            dangLamMoi={luotDoc.isPlaceholderData}
            loi={luotDoc.error}
            onThuLai={() => luotDoc.refetch()}
            rong={!!luotDoc.data && luotDoc.data.tai_lieu.length === 0 && luotDoc.data.theo_ngay.every((d) => d.so_luot === 0)}
            thongDiepRong="Chưa có lượt đọc bản mềm nào trong khoảng này."
          >
            {luotDoc.data && (
              <div className="space-y-5">
                {luotDoc.data.theo_ngay.length > 0 && <BieuDoLuotDocNgay du_lieu={luotDoc.data.theo_ngay} />}
                <ol className="space-y-3">
                  {luotDoc.data.tai_lieu.slice(0, 6).map((d) => (
                    <li key={d.tai_lieu.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
                      <Link to={`/tai-lieu/${d.tai_lieu.id}`} className="truncate text-sm font-semibold text-ink no-underline hover:text-brand-700 hover:underline">
                        {d.tai_lieu.tieu_de}
                      </Link>
                      <span className="text-right text-sm tabular-nums text-ink-soft">
                        <b className="text-ink">{so(d.so_luot_doc)}</b> lượt
                      </span>
                      <span className="col-span-2">
                        <ThanhNgang giaTri={d.so_luot_doc} max={maxDoc} mau="bg-[#2f6db5]" />
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </KhungBieuDo>
        </div>

        <KhungBieuDo
          cauHoi="Chủ đề nào đang được quan tâm hơn theo thời gian?"
          cachDoc={
            <>
              Độ dày mỗi dòng là số lượt bạn đọc chọn tư liệu thuộc chủ đề đó {chuDeTg.data?.don_vi === 'tuan' ? 'trong từng tuần' : 'trong từng ngày'}
              {loc && ` (lọc: ${loc})`}; lượt tìm không chọn tư liệu nào không được tính. Bấm một chủ đề để làm nổi.
            </>
          }
          dangTai={chuDeTg.isPending}
          dangLamMoi={chuDeTg.isPlaceholderData}
          loi={chuDeTg.error}
          onThuLai={() => chuDeTg.refetch()}
          rong={!!song && song.dong.length === 0}
          thongDiepRong="Chưa có lượt chọn tư liệu nào trong khoảng và bộ lọc này."
          chieuCao="h-[300px]"
          bang={
            song &&
            chuDeTg.data && (
              <BangSoLieu
                cot={[chuDeTg.data.don_vi === 'tuan' ? 'Tuần từ' : 'Ngày', ...song.dong.map((d) => d.ten), 'Tổng']}
                dong={song.ky.map((k, i) => [
                  ngay(k),
                  ...song.dong.map((d) => so(d.gia_tri[i])),
                  so(song.dong.reduce((t, d) => t + d.gia_tri[i], 0)),
                ])}
              />
            )
          }
        >
          {chuDeTg.data && song && <BieuDoChuDe du_lieu={chuDeTg.data} song={song} dangNoi={noiChuDe} onNoi={setNoiChuDe} />}
        </KhungBieuDo>

        <KhungBieuDo
          cauHoi="Tư liệu nào thường được mượn cùng nhau?"
          cachDoc="Hai tư liệu nối nhau khi cùng một bạn đọc mượn cả hai trong khoảng này; nét càng dày càng nhiều bạn đọc chung. Nút to là tư liệu mượn nhiều, màu theo chủ đề. Kéo để di chuyển, cuộn để phóng to, bấm một nút để mở tư liệu."
          dangTai={muonCung.isPending}
          dangLamMoi={muonCung.isPlaceholderData}
          loi={muonCung.error}
          onThuLai={() => muonCung.refetch()}
          chieuCao="h-[400px]"
          bang={
            muonCung.data &&
            muonCung.data.canh.length > 0 && (
              <BangSoLieu
                cot={['Tư liệu', 'Mượn cùng với', 'Bạn đọc chung']}
                dong={(() => {
                  const ten = new Map(muonCung.data.nut.map((n) => [n.id, n.ten]))
                  return muonCung.data.canh.map((c) => [ten.get(c.nguon) ?? String(c.nguon), ten.get(c.dich) ?? String(c.dich), so(c.trong_so)])
                })()}
              />
            )
          }
        >
          {muonCung.data && (
            <DoThiMuon du_lieu={muonCung.data} mau={mauChuDe} nguong={nguong} onDoiNguong={setNguong} onMo={(id) => navigate(`/tai-lieu/${id}`)} />
          )}
        </KhungBieuDo>
      </div>
    </div>
  )
}
