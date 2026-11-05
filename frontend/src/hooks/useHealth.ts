import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'

export interface HealthResponse {
  status: string
  [khac: string]: unknown
}

// Kiểm tra máy chủ định kỳ; lỗi mạng chỉ làm đổi trạng thái, không ném lỗi ra giao diện
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch<HealthResponse>('/health'),
    refetchInterval: 30_000,
  })
}
