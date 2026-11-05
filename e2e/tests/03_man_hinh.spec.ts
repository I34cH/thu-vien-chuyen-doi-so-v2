// 8 trang x 2 khung (1440px và 375px): không lỗi console, không cuộn ngang. Chỉ đọc.
import { expect, test, type BrowserContext } from '@playwright/test'
import { TAI_KHOAN, choDashboard, dangNhapAPI, khongCuonNgang, motTuLieu, theoDoiLoi } from './tro_giup'

const KHUNG = [
  { ten: '1440', rong: 1440, cao: 900 },
  { ten: '375', rong: 375, cao: 812 },
] as const

type Trang = { ten: string; vaiTro: 'khach' | 'sv01' | 'thuthu'; url: (id: number) => string; cho: (p: import('@playwright/test').Page) => Promise<void> }

const TRANG: Trang[] = [
  { ten: 'Trang chủ (khách)', vaiTro: 'khach', url: () => '/', cho: async (p) => void (await expect(p.getByRole('heading', { level: 1 })).toContainText('Tìm trong')) },
  { ten: 'Tra cứu (khách)', vaiTro: 'khach', url: () => '/tra-cuu?q=luu%20tru', cho: async (p) => void (await expect(p.locator('article').first()).toBeVisible()) },
  { ten: 'Chi tiết tư liệu (khách)', vaiTro: 'khach', url: (id) => `/tai-lieu/${id}`, cho: async (p) => void (await expect(p.getByRole('heading', { name: 'Thông tin tư liệu' })).toBeVisible()) },
  { ten: 'Đăng nhập (khách)', vaiTro: 'khach', url: () => '/tai-khoan', cho: async (p) => void (await expect(p.getByRole('heading', { name: 'Đăng nhập', level: 1 })).toBeVisible()) },
  { ten: 'Không tìm thấy (khách)', vaiTro: 'khach', url: () => '/khong-co-trang-nay', cho: async (p) => void (await expect(p.getByRole('heading', { level: 1 })).toBeVisible()) },
  { ten: 'Tài khoản (sv01)', vaiTro: 'sv01', url: () => '/tai-khoan', cho: async (p) => void (await expect(p.getByRole('heading', { name: 'Lượt mượn của tôi' })).toBeVisible()) },
  { ten: 'Quản lý (thủ thư)', vaiTro: 'thuthu', url: () => '/quan-ly', cho: async (p) => void (await expect(p.getByRole('tab', { name: /Chờ duyệt/ })).toBeVisible()) },
  { ten: 'Dashboard (thủ thư)', vaiTro: 'thuthu', url: () => '/dashboard', cho: choDashboard },
]

const ctxTheoVaiTro: Partial<Record<Trang['vaiTro'], BrowserContext>> = {}
let idTuLieu = 0

test.beforeAll(async ({ browser }) => {
  for (const vt of ['khach', 'sv01', 'thuthu'] as const) {
    const c = await browser.newContext()
    if (vt !== 'khach') await dangNhapAPI(c, TAI_KHOAN[vt].ten, TAI_KHOAN[vt].mk)
    ctxTheoVaiTro[vt] = c
  }
  idTuLieu = (await motTuLieu(ctxTheoVaiTro.khach!)).id
})
test.afterAll(async () => {
  for (const c of Object.values(ctxTheoVaiTro)) await c?.close()
})

for (const k of KHUNG) {
  test.describe(`khung ${k.ten}px`, () => {
    for (const t of TRANG) {
      test(`${t.ten}: không lỗi console, không cuộn ngang`, async () => {
        // (Đã sửa: mục "Tư liệu tương tự" của trang chi tiết từng tràn ngang ở 375px; nay lưới có grid-cols-1 + min-w-0.)
        const page = await ctxTheoVaiTro[t.vaiTro]!.newPage()
        try {
          await page.setViewportSize({ width: k.rong, height: k.cao })
          const theo = theoDoiLoi(page)
          await page.goto(t.url(idTuLieu))
          await t.cho(page)
          await page.waitForLoadState('networkidle')
          await khongCuonNgang(page)
          expect(theo.loi, theo.loi.join('\n')).toEqual([])
        } finally {
          await page.close()
        }
      })
    }
  })
}
