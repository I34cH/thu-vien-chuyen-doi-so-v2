import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/endpoints'
import type { DangNhapVao, NguoiDung } from '../api/types'

export const KHOA_AUTH = ['auth', 'toi'] as const

export type NhomHienTai = 'khach' | 'nguoi_dung' | 'thu_thu'

/** Người đang đăng nhập (null = khách). Lỗi mạng coi như khách nhưng vẫn báo isError. */
export function useAuth() {
  const q = useQuery({
    queryKey: KHOA_AUTH,
    queryFn: async () => (await authApi.toi()).nguoi_dung,
    staleTime: 5 * 60_000,
  })
  const nguoiDung: NguoiDung | null = q.data ?? null
  const nhom: NhomHienTai = nguoiDung?.nhom ?? 'khach'
  return { nguoiDung, nhom, dangTai: q.isPending, loi: q.isError ? q.error : null }
}

export function useDangNhap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vao: DangNhapVao) => authApi.dangNhap(vao),
    onSuccess: (data) => {
      qc.setQueryData(KHOA_AUTH, data.nguoi_dung)
      // Dữ liệu phụ thuộc người dùng (chi tiết có luot_muon_cua_toi, ...) cần tải lại
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })
    },
  })
}

export function useDangXuat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.dangXuat(),
    onSettled: () => {
      qc.setQueryData(KHOA_AUTH, null)
      // Bỏ dữ liệu riêng của người dùng/thủ thư; giữ dữ liệu công khai (giới thiệu, tìm kiếm) để không nháy lại
      const rieng = new Set(['muon-cua-toi', 'quan-ly', 'thong-ke', 'tai-lieu'])
      qc.removeQueries({ predicate: (q) => rieng.has(String(q.queryKey[0])) })
    },
  })
}
