// Bảng giải nghĩa mã vấn đề: sửa tại chỗ, Enter để lưu, Esc để hủy.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Check, Pencil, Search } from 'lucide-react'
import { thongDiepLoi } from '../../api/client'
import { quanLyApi } from '../../api/endpoints'
import type { MaVanDe } from '../../api/types'
import { ErrorState, Skeleton, useToast } from '../../components/ui'
import { boDau } from '../../lib/highlight'
import { so } from '../../lib/format'

function DongMa({ m }: { m: MaVanDe }) {
  const [sua, setSua] = useState(false)
  const [ten, setTen] = useState(m.ten ?? '')
  const qc = useQueryClient()
  const toast = useToast()
  const luu = useMutation({
    mutationFn: () => quanLyApi.suaMaVanDe(m.ma, ten.trim()),
    onSuccess: () => {
      qc.setQueryData<MaVanDe[]>(['quan-ly', 'ma-van-de'], (cu) => cu?.map((x) => (x.ma === m.ma ? { ...x, ten: ten.trim() || null } : x)))
      setSua(false)
      toast.thanhCong(`Đã lưu giải nghĩa mã ${m.ma}`)
    },
    onError: (e) => toast.loi('Chưa lưu được', thongDiepLoi(e)),
  })
  const huy = () => {
    setTen(m.ten ?? '')
    setSua(false)
  }
  return (
    <tr className="group border-b border-line last:border-b-0">
      <th scope="row" className="whitespace-nowrap px-4 py-2.5 text-left font-mono text-sm font-semibold text-brand-700">
        {m.ma}
      </th>
      <td className="w-full px-2 py-1.5">
        {sua ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              luu.mutate()
            }}
          >
            <input
              autoFocus
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && huy()}
              aria-label={`Giải nghĩa mã ${m.ma}`}
              placeholder="Ví dụ: Quản trị văn phòng"
              className="h-9 w-full rounded-md border border-brand-600 bg-surface px-2.5 text-sm ring-2 ring-brand-600/20 focus:outline-none"
            />
            <button type="submit" disabled={luu.isPending} className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-600 text-white hover:bg-brand-700" aria-label="Lưu">
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
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-brand-50"
            aria-label={`Sửa giải nghĩa mã ${m.ma}`}
          >
            <span className={clsx('flex-1', m.ten ? 'text-ink' : 'italic text-muted')}>{m.ten || 'Chưa có giải nghĩa'}</span>
            <Pencil className="h-3.5 w-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" aria-hidden="true" />
          </button>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm tabular-nums text-ink-soft">{so(m.so_tai_lieu)}</td>
    </tr>
  )
}

export function BangMaVanDe() {
  const q = useQuery({ queryKey: ['quan-ly', 'ma-van-de'], queryFn: quanLyApi.maVanDe })
  const [loc, setLoc] = useState('')
  if (q.isPending) return <Skeleton className="h-96 w-full" />
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const chuaCo = q.data.filter((m) => !m.ten).length
  const ds = q.data.filter((m) => !loc || boDau(`${m.ma} ${m.ten ?? ''}`).includes(boDau(loc)))
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {chuaCo > 0 ? (
            <>
              <strong className="text-ink">{chuaCo}</strong>/{q.data.length} mã chưa có giải nghĩa. Bấm vào một dòng để sửa.
            </>
          ) : (
            'Tất cả mã đã có giải nghĩa.'
          )}
        </p>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
            placeholder="Lọc mã"
            aria-label="Lọc mã vấn đề"
            className="h-9 w-full rounded-md border border-line-strong bg-surface pl-9 pr-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-paper/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-left font-semibold">Mã</th>
              <th scope="col" className="px-4 py-2.5 text-left font-semibold">Giải nghĩa</th>
              <th scope="col" className="whitespace-nowrap px-4 py-2.5 text-right font-semibold">Số tư liệu</th>
            </tr>
          </thead>
          <tbody>
            {ds.map((m) => (
              <DongMa key={m.ma} m={m} />
            ))}
            {ds.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted">
                  Không có mã khớp “{loc}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
