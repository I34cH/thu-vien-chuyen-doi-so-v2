import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { capNhatBoLoc, docBoLoc, ghiBoLoc, type BoLocTraCuu } from '../lib/boLoc'

/** Bộ lọc tra cứu đồng bộ với URL: đọc từ query string, ghi lại khi đổi (giữ lịch sử để Back hoạt động). */
export function useBoLocTraCuu() {
  const [sp, setSp] = useSearchParams()
  const boLoc = useMemo(() => docBoLoc(sp), [sp])
  const datBoLoc = useCallback(
    (thayDoi: Partial<BoLocTraCuu>, opts?: { thayThe?: boolean }) => {
      setSp((cu) => ghiBoLoc(capNhatBoLoc(docBoLoc(cu), thayDoi)), { replace: opts?.thayThe })
    },
    [setSp],
  )
  const xoaBoLoc = useCallback(() => setSp((cu) => ghiBoLoc({ ...docBoLoc(new URLSearchParams()), q: docBoLoc(cu).q })), [setSp])
  return { boLoc, datBoLoc, xoaBoLoc, chuoi: sp.toString() }
}
