// Bảng chủ đề (gom cụm TF-IDF): thủ thư sửa nhãn tự động tại chỗ, Enter để lưu, Esc để hủy.
// Nhãn mới hiện ngay trên ThemeRiver và đồ thị mượn cùng nhau của dashboard. Nhãn sửa tay được lưu theo chữ ký
// cụm nên giữ qua pipeline.reset; dòng đã sửa hiện nhãn tự động gốc và nút "Khôi phục nhãn tự động".
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, RotateCcw } from 'lucide-react'
import { thongDiepLoi } from '../../api/client'
import { quanLyApi } from '../../api/endpoints'
import type { ChuDeQuanLy } from '../../api/types'
import { ErrorState, Skeleton, useToast } from '../../components/ui'
import { bangMauChuDe, MAU_KHAC } from '../../lib/echarts'
import { so } from '../../lib/format'

const KHOA = ['quan-ly', 'chu-de'] as const

function DongChuDe({ c, mau }: { c: ChuDeQuanLy; mau: string }) {
  const [sua, setSua] = useState(false)
  const [nhan, setNhan] = useState(c.nhan)
  const qc = useQueryClient()
  const toast = useToast()
  const luu = useMutation({
    mutationFn: () => quanLyApi.suaChuDe(c.id, nhan.trim()),
    onSuccess: (moi) => {
      qc.setQueryData<ChuDeQuanLy[]>([...KHOA], (cu) => cu?.map((x) => (x.id === c.id ? moi : x)))
      qc.invalidateQueries({ queryKey: ['thong-ke'] })
      setNhan(moi.nhan)
      setSua(false)
      toast.thanhCong('Đã đổi nhãn chủ đề', moi.nhan)
    },
    onError: (e) => toast.loi('Chưa lưu được', thongDiepLoi(e)),
  })
  const khoiPhuc = useMutation({
    mutationFn: () => quanLyApi.khoiPhucChuDe(c.id),
    onSuccess: (moi) => {
      qc.setQueryData<ChuDeQuanLy[]>([...KHOA], (cu) => cu?.map((x) => (x.id === c.id ? moi : x)))
      qc.invalidateQueries({ queryKey: ['thong-ke'] })
      setNhan(moi.nhan)
      toast.thanhCong('Đã khôi phục nhãn tự động', moi.nhan)
    },
    onError: (e) => toast.loi('Chưa khôi phục được', thongDiepLoi(e)),
  })
  const huy = () => {
    setNhan(c.nhan)
    setSua(false)
  }
  return (
    <tr className="group border-b border-line align-top last:border-b-0">
      <td className="w-full min-w-[16rem] px-2 py-1.5">
        {sua ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (nhan.trim()) luu.mutate()
            }}
          >
            <input
              autoFocus
              value={nhan}
              maxLength={200}
              onChange={(e) => setNhan(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && huy()}
              aria-label={`Nhãn chủ đề ${c.id}`}
              aria-invalid={!nhan.trim()}
              placeholder="Ví dụ: Lưu trữ học"
              className="h-9 w-full rounded-md border border-brand-600 bg-surface px-2.5 text-sm ring-2 ring-brand-600/20 focus:outline-none"
            />
            <button
              type="submit"
              disabled={luu.isPending || !nhan.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
              aria-label="Lưu"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={huy} className="h-9 shrink-0 rounded-md px-2 text-sm text-ink-soft hover:bg-ink/5">
              Hủy
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setSua(true)}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-brand-50"
            aria-label={`Sửa nhãn chủ đề ${c.nhan}`}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: mau }} aria-hidden="true" />
            <span className="min-w-0 flex-1 font-semibold text-ink">{c.nhan}</span>
            {c.da_sua_tay && (
              <span className="shrink-0 rounded-full bg-gold-100 px-2 py-0.5 text-xs font-medium text-gold-700">Sửa tay</span>
            )}
            <Pencil className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" aria-hidden="true" />
          </button>
        )}
        {!sua && c.da_sua_tay && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2.5 pb-1 pl-8 text-xs text-muted">
            <span>
              Nhãn tự động: <span className="text-ink-soft">{c.nhan_tu_dong}</span>
            </span>
            <button
              type="button"
              onClick={() => khoiPhuc.mutate()}
              disabled={khoiPhuc.isPending}
              className="inline-flex items-center gap-1 rounded px-1 font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Khôi phục nhãn tự động
            </button>
          </p>
        )}
      </td>
      <td className="hidden px-4 py-2.5 text-sm text-ink-soft md:table-cell">
        <span className="line-clamp-2 min-w-[14rem]">{c.tu_khoa_noi_bat.join(', ') || '–'}</span>
      </td>
      <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm tabular-nums text-ink-soft">{so(c.so_tai_lieu)}</td>
    </tr>
  )
}

export function BangChuDe() {
  const q = useQuery({ queryKey: [...KHOA], queryFn: quanLyApi.chuDe })
  if (q.isPending) return <Skeleton className="h-96 w-full" />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const mau = bangMauChuDe(q.data)
  return (
    <div>
      <p className="mb-4 text-sm text-ink-soft">
        <strong className="text-ink">{q.data.length}</strong> chủ đề do máy gom từ tiêu đề tư liệu; nhãn là vài từ nổi bật nhất, riêng nhóm quá rời rạc
        được gọi là “Tổng hợp (nhiều chủ đề)”. Bấm vào nhãn để đặt tên dễ hiểu hơn; nhãn sửa tay được giữ khi dựng lại dữ liệu.
        Màu là màu của chủ đề trên dashboard (chủ đề nhỏ gộp vào “Khác”).
      </p>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-left font-semibold">Nhãn</th>
              <th scope="col" className="hidden px-4 py-2.5 text-left font-semibold md:table-cell">Từ khóa nổi bật</th>
              <th scope="col" className="whitespace-nowrap px-4 py-2.5 text-right font-semibold">Số tư liệu</th>
            </tr>
          </thead>
          <tbody>
            {q.data.map((c) => (
              <DongChuDe key={c.id} c={c} mau={mau.get(c.id) ?? MAU_KHAC} />
            ))}
            {q.data.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted">
                  Chưa có chủ đề. Chạy pipeline TF-IDF (python -m pipeline.tuong_tu) để gom chủ đề.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
