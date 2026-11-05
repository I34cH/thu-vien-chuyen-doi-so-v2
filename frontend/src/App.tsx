import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { YeuCauVaiTro } from './components/auth/YeuCauVaiTro'
import { Skeleton } from './components/ui'
import TrangChu from './pages/TrangChu'
import TraCuu from './pages/TraCuu'
import ChiTiet from './pages/ChiTiet'
import TaiKhoan from './pages/TaiKhoan'
import KhongTimThay from './pages/KhongTimThay'

// Trang thủ thư tải riêng (ECharts nặng), không làm chậm trang tra cứu
const QuanLy = lazy(() => import('./pages/QuanLy'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

function DangTaiTrang() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải trang">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-5 w-[28rem] max-w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TrangChu />} />
        <Route path="tra-cuu" element={<TraCuu />} />
        <Route path="tai-lieu/:id" element={<ChiTiet />} />
        <Route path="tai-khoan" element={<TaiKhoan />} />
        <Route
          path="quan-ly"
          element={
            <YeuCauVaiTro nhom={['thu_thu']} tenTrang="Trang quản lý">
              <Suspense fallback={<DangTaiTrang />}>
                <QuanLy />
              </Suspense>
            </YeuCauVaiTro>
          }
        />
        <Route
          path="dashboard"
          element={
            <YeuCauVaiTro nhom={['thu_thu']} tenTrang="Dashboard">
              <Suspense fallback={<DangTaiTrang />}>
                <Dashboard />
              </Suspense>
            </YeuCauVaiTro>
          }
        />
        <Route path="*" element={<KhongTimThay />} />
      </Route>
    </Routes>
  )
}
