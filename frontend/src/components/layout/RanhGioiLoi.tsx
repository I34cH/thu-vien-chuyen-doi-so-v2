// Ranh giới lỗi: một trang lỗi không làm trắng cả ứng dụng.
import { Component, type ErrorInfo, type ReactNode } from 'react'

export class RanhGioiLoi extends Component<{ children: ReactNode; khoa?: string }, { loi: Error | null }> {
  state = { loi: null as Error | null }
  static getDerivedStateFromError(loi: Error) {
    return { loi }
  }
  componentDidUpdate(truoc: { khoa?: string }) {
    // Đổi trang thì thử hiển thị lại
    if (truoc.khoa !== this.props.khoa && this.state.loi) this.setState({ loi: null })
  }
  componentDidCatch(loi: Error, info: ErrorInfo) {
    console.error('Lỗi giao diện:', loi, info.componentStack)
  }
  render() {
    if (!this.state.loi) return this.props.children
    return (
      <section role="alert" className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-3xl font-semibold text-brand-700">Trang gặp sự cố khi hiển thị</h1>
        <p className="mt-3 text-ink-soft">Đã ghi lại lỗi. Bạn có thể tải lại trang hoặc quay về trang chủ.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="h-11 rounded-md bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">
            Tải lại trang
          </button>
          <a href="/" className="inline-flex h-11 items-center rounded-md border border-line-strong px-5 text-sm font-semibold text-brand-700 no-underline hover:bg-brand-50">
            Về trang chủ
          </a>
        </div>
      </section>
    )
  }
}
