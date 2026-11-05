import { useSearchParams } from 'react-router-dom'
import { PageHeader, Tabs } from '../components/ui'
import { useTieuDe } from '../hooks/useTienIch'
import { HangDoiMuon } from './quan-ly/HangDoiMuon'
import { TaiBanMem } from './quan-ly/TaiBanMem'
import { BangMaVanDe } from './quan-ly/BangMaVanDe'
import { BangChuDe } from './quan-ly/BangChuDe'

type Muc = 'muon' | 'so-hoa' | 'ma-van-de' | 'chu-de'
const MUC: { khoa: Muc; nhan: string; moTa: string }[] = [
  { khoa: 'muon', nhan: 'Lượt mượn', moTa: 'Duyệt đăng ký, ghi nhận trả và theo dõi quá hạn.' },
  { khoa: 'so-hoa', nhan: 'Số hóa', moTa: 'Tải bản mềm PDF lên cho tư liệu và chọn ai được đọc.' },
  { khoa: 'ma-van-de', nhan: 'Mã vấn đề', moTa: 'Giải nghĩa các mã vấn đề để bạn đọc hiểu nhãn trên tư liệu.' },
  { khoa: 'chu-de', nhan: 'Chủ đề', moTa: 'Đặt tên dễ hiểu cho các chủ đề máy gom từ tiêu đề; nhãn hiện trên biểu đồ chủ đề của dashboard.' },
]

export default function QuanLy() {
  const [sp, setSp] = useSearchParams()
  const muc = (MUC.find((m) => m.khoa === sp.get('muc'))?.khoa ?? 'muon') as Muc
  const taiLieu = Number(sp.get('tai_lieu')) || null
  const hienTai = MUC.find((m) => m.khoa === muc)!
  useTieuDe(`Quản lý · ${hienTai.nhan}`)

  const doiMuc = (k: Muc) => setSp(k === 'muon' ? {} : { muc: k }, { replace: true })
  const doiTaiLieu = (id: number | null) => setSp(id ? { muc: 'so-hoa', tai_lieu: String(id) } : { muc: 'so-hoa' })

  return (
    <div>
      <PageHeader title="Quản lý" description={hienTai.moTa} />
      <Tabs nhanNhom="Khu vực quản lý" muc={MUC.map((m) => ({ khoa: m.khoa, nhan: m.nhan }))} dangChon={muc} onChon={doiMuc} idPanel="panel-quan-ly" />
      <div id="panel-quan-ly" role="tabpanel" aria-labelledby={`tab-${muc}`} className="mt-6">
        {muc === 'muon' && <HangDoiMuon />}
        {muc === 'so-hoa' && (
          <div className="max-w-3xl">
            <TaiBanMem taiLieuId={taiLieu} onDoiTaiLieu={doiTaiLieu} />
          </div>
        )}
        {muc === 'chu-de' && (
          <div className="max-w-5xl">
            <BangChuDe />
          </div>
        )}
        {muc === 'ma-van-de' && (
          <div className="max-w-4xl">
            <BangMaVanDe />
          </div>
        )}
      </div>
    </div>
  )
}
