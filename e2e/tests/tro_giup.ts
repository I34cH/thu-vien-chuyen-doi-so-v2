// Hàm dùng chung cho các kịch bản đầu cuối và chụp ảnh.
import { expect, type BrowserContext, type Locator, type Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const THU_MUC = path.dirname(fileURLToPath(import.meta.url))

/** PDF mẫu có sẵn trong repo (dùng cho kịch bản tải bản mềm). */
export const PDF_MAU = path.resolve(THU_MUC, '../../backend/storage/ban_mem/mau/ban_mem_mau.pdf')

export const TAI_KHOAN = {
  thuthu: { ten: 'thuthu', mk: 'thuthu123' },
  sv01: { ten: 'sv01', mk: 'sv123' },
  gv01: { ten: 'gv01', mk: 'gv123' },
} as const

/**
 * Gom lỗi console và lỗi script chưa bắt của một trang. Không bỏ qua lỗi nào (lỗi ECharts "translate(x NaN)"
 * trên Dashboard trước đây được bỏ qua ở đây; đã sửa gốc ở BieuDoTheoNgay: tắt hiệu ứng của chuỗi nét đứt).
 */
export function theoDoiLoi(page: Page) {
  const loi: string[] = []
  const ghi = (s: string) => loi.push(s)
  page.on('console', (m) => {
    if (m.type() === 'error') ghi(`[console] ${m.text()} @ ${m.location().url}`)
  })
  page.on('pageerror', (e) => ghi(`[pageerror] ${e.message}`))
  page.on('response', (r) => {
    if (r.status() >= 500) ghi(`[http ${r.status()}] ${r.url()}`)
  })
  return { loi }
}

/** Đăng nhập qua giao diện (trang /tai-khoan). */
export async function dangNhapUI(page: Page, ten: string, mk: string) {
  await page.goto('/tai-khoan')
  await page.getByLabel('Tên đăng nhập').fill(ten)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(mk)
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toHaveCount(0)
}

/** Đăng nhập nhanh bằng API (cookie gắn vào context), dùng cho kịch bản chỉ cần phiên. */
export async function dangNhapAPI(ctx: BrowserContext, ten: string, mk: string) {
  const r = await ctx.request.post('/api/auth/dang-nhap', { data: { ten_dang_nhap: ten, mat_khau: mk } })
  expect(r.ok(), `đăng nhập ${ten}`).toBeTruthy()
}

type TL = { id: number; tieu_de: string; so_ban_con: number; so_ban: number; co_ban_mem: boolean }

/** Tìm một tư liệu còn bản để mượn mà người dùng chưa có lượt mở (lấy qua API, không ghi log). */
export async function timTuLieuConBan(ctx: BrowserContext): Promise<TL> {
  const mo = await (await ctx.request.get('/api/muon/cua-toi')).json()
  const daMo = new Set<number>(
    (mo as { tai_lieu: { id: number }; trang_thai: string }[])
      .filter((l) => l.trang_thai === 'cho_duyet' || l.trang_thai === 'dang_muon')
      .map((l) => l.tai_lieu.id),
  )
  // /quan-ly/tai-lieu không ghi log nhưng cần quyền thủ thư; dùng /tai-lieu/{id} cho ứng viên từ tra cứu của khách
  const r = await ctx.request.get('/api/tim-kiem', { params: { q: 'lưu trữ', con_ban: 'true', kich_thuoc: '50' } })
  const ds = (await r.json()).du_lieu as TL[]
  const t = ds.find((x) => x.so_ban_con >= 1 && !daMo.has(x.id))
  if (!t) throw new Error('Không tìm thấy tư liệu còn bản (cần chạy pipeline.reset)')
  return t
}

/** Một tư liệu bất kỳ để mở trang chi tiết (qua API, tìm "lưu trữ"). */
export async function motTuLieu(ctx: BrowserContext): Promise<TL> {
  const r = await ctx.request.get('/api/tim-kiem', { params: { q: 'lưu trữ', con_ban: 'true', kich_thuoc: '5' } })
  return (await r.json()).du_lieu[0] as TL
}

/** Chờ Dashboard vẽ xong mọi biểu đồ ECharts. */
export async function choDashboard(page: Page) {
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await expect(page.locator('[role=img][aria-label^="Đồ thị mạng"]')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('[role=img][aria-label^="Biểu đồ dòng chảy chủ đề"]')).toBeVisible()
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 20_000 })
  await page.waitForTimeout(1200) // bố cục lực của đồ thị mạng ổn định
}

/** Thẻ KPI theo nhãn: trả về chữ của số chính. */
export function giaTriKpi(page: Page, nhan: string): Locator {
  return page.locator('div.shadow-card', { has: page.getByText(nhan, { exact: true }) }).locator('p').nth(1)
}

/** Không có cuộn ngang ở trang hiện tại. */
export async function khongCuonNgang(page: Page) {
  const kq = await page.evaluate(() => ({
    rong: document.documentElement.scrollWidth,
    khung: document.documentElement.clientWidth,
  }))
  expect(kq.rong, `cuộn ngang: scrollWidth ${kq.rong} > clientWidth ${kq.khung}`).toBeLessThanOrEqual(kq.khung)
}
