// Chụp ảnh cho báo cáo -> outputs/screenshots/<vai_tro>/<trang>_{1440,375}.png (chỉ chụp khung nhìn, không fullPage)
// và ảnh từng biểu đồ -> outputs/screenshots/dashboard/*.png.
// Làm mờ họ tên tác giả và người hướng dẫn thật bằng CSS blur (tên bạn đọc, người dùng là dữ liệu mô phỏng).
// Chỉ đọc: không đăng ký mượn, không duyệt, không tải bản mềm (mỗi lần tìm chỉ ghi thêm log tìm kiếm).
// Chạy: npx playwright test --project=chup_anh   (backend + frontend tự bật nếu chưa chạy)
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TAI_KHOAN, choDashboard, dangNhapAPI } from './tro_giup'

const GOC_ANH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../outputs/screenshots')
const KHUNG = [
  { ten: 1440, rong: 1440, cao: 900 },
  { ten: 375, rong: 375, cao: 812 },
] as const

// Làm mờ: tác giả ở thẻ kết quả, dòng tác giả đầu trang chi tiết, dòng "Tác giả"/"Người hướng dẫn" trong bảng thông tin,
// tác giả ở thẻ "Tư liệu tương tự". Phần JS gắn thuộc tính cho <dd> theo nhãn <dt> (CSS thuần không chọn theo chữ được).
const CSS_LAM_MO = `
  article h3 + p, article h1 + p, #tieu-de-tuong-tu + ul p.truncate, [data-lam-mo] { filter: blur(6px) !important; }
`
const JS_LAM_MO = `
  (() => {
    const css = ${JSON.stringify(CSS_LAM_MO)};
    const gan = () => {
      if (!document.getElementById('lam-mo-ten')) {
        const s = document.createElement('style'); s.id = 'lam-mo-ten'; s.textContent = css; (document.head || document.documentElement).appendChild(s);
      }
      document.querySelectorAll('dt').forEach((dt) => {
        if (/^(Tác giả|Người hướng dẫn)$/.test(dt.textContent.trim()) && dt.nextElementSibling) dt.nextElementSibling.setAttribute('data-lam-mo', '1');
      });
    };
    new MutationObserver(gan).observe(document, { childList: true, subtree: true });
    document.addEventListener('DOMContentLoaded', gan);
  })();
`

async function taoContext(browser: import('@playwright/test').Browser, k: (typeof KHUNG)[number], vaiTro?: 'sv01' | 'thuthu') {
  const ctx = await browser.newContext({ viewport: { width: k.rong, height: k.cao }, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' })
  await ctx.addInitScript(JS_LAM_MO)
  if (vaiTro) await dangNhapAPI(ctx, TAI_KHOAN[vaiTro].ten, TAI_KHOAN[vaiTro].mk)
  return ctx
}

async function chup(page: Page, vaiTro: string, trang: string, k: (typeof KHUNG)[number]) {
  const thuMuc = path.join(GOC_ANH, vaiTro)
  fs.mkdirSync(thuMuc, { recursive: true })
  await page.mouse.move(0, 0)
  await page.waitForTimeout(500) // chuyển động CSS và bố cục biểu đồ ổn định
  await page.screenshot({ path: path.join(thuMuc, `${trang}_${k.ten}.png`) }) // chỉ khung nhìn
}

async function mo(page: Page, url: string, cho?: (p: Page) => Promise<unknown>) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  if (cho) await cho(page)
}

test.beforeAll(() => {
  // Xóa ảnh cũ để thư mục phản ánh đúng lần chụp này
  fs.rmSync(GOC_ANH, { recursive: true, force: true })
  fs.mkdirSync(GOC_ANH, { recursive: true })
})

test('khách', async ({ browser }) => {
  for (const k of KHUNG) {
    const ctx = await taoContext(browser, k)
    const page = await ctx.newPage()
    // Một luận văn có người hướng dẫn để minh họa phần làm mờ tên
    const r = await ctx.request.get('/api/tim-kiem', { params: { q: 'lưu trữ', loai: 'luan_van', con_ban: 'true', kich_thuoc: '3' } })
    const idLuanVan = (await r.json()).du_lieu[0].id as number

    await mo(page, '/', (p) => expect(p.getByRole('heading', { level: 1 })).toContainText('Tìm trong'))
    await chup(page, 'khach', 'trang_chu', k)

    await page.getByRole('combobox').pressSequentially('luu tr', { delay: 70 })
    await expect(page.getByRole('listbox', { name: 'Gợi ý tìm kiếm' }).getByRole('option').nth(1)).toBeVisible()
    await chup(page, 'khach', 'goi_y_khi_go', k)

    await mo(page, '/tra-cuu?q=luu%20tru', (p) => expect(p.locator('article').first()).toBeVisible())
    await chup(page, 'khach', 'tra_cuu_khong_dau', k)

    await mo(page, '/tra-cuu?q=lu%20tru', (p) => expect(p.getByText(/Đang hiện kết quả cho/)).toBeVisible())
    await chup(page, 'khach', 'tra_cuu_go_sai', k)

    await mo(page, '/tra-cuu?q=lu%20tru&chinh_xac=1', (p) => expect(p.getByText(/Có phải bạn muốn tìm/)).toBeVisible())
    await chup(page, 'khach', 'tra_cuu_go_sai_chinh_xac', k)

    await mo(page, '/tra-cuu?q=hoc%20may', (p) => expect(p.getByText(/Chưa tìm thấy/)).toBeVisible())
    await chup(page, 'khach', 'tra_cuu_khong_ket_qua', k)

    await mo(page, `/tai-lieu/${idLuanVan}`, (p) => expect(p.getByRole('heading', { name: 'Thông tin tư liệu' })).toBeVisible())
    await chup(page, 'khach', 'chi_tiet', k)

    await mo(page, '/tai-khoan', (p) => expect(p.getByRole('heading', { name: 'Đăng nhập', level: 1 })).toBeVisible())
    await chup(page, 'khach', 'dang_nhap', k)

    await mo(page, '/dashboard', (p) => expect(p.getByRole('heading', { level: 1 })).toContainText('dành cho thủ thư'))
    await chup(page, 'khach', 'dashboard_yeu_cau_dang_nhap', k)
    await ctx.close()
  }
})

test('người dùng (sv01)', async ({ browser }) => {
  for (const k of KHUNG) {
    const ctx = await taoContext(browser, k, 'sv01')
    const page = await ctx.newPage()
    // Tư liệu còn bản và sv01 chưa có lượt mở, để thấy nút "Đăng ký mượn"
    const mo_ = (await (await ctx.request.get('/api/muon/cua-toi')).json()) as { tai_lieu: { id: number }; trang_thai: string }[]
    const daMo = new Set(mo_.filter((l) => l.trang_thai === 'cho_duyet' || l.trang_thai === 'dang_muon').map((l) => l.tai_lieu.id))
    const ds = (await (await ctx.request.get('/api/tim-kiem', { params: { q: 'lưu trữ', loai: 'luan_van', con_ban: 'true', kich_thuoc: '30' } })).json()).du_lieu as { id: number }[]
    const id = ds.find((t) => !daMo.has(t.id))!.id

    await mo(page, `/tai-lieu/${id}`, (p) => expect(p.getByRole('button', { name: 'Đăng ký mượn' })).toBeVisible())
    await page.getByRole('button', { name: 'Đăng ký mượn' }).scrollIntoViewIfNeeded()
    await chup(page, 'nguoi_dung', 'chi_tiet_dang_ky_muon', k)

    await mo(page, '/tai-khoan', (p) => expect(p.getByRole('heading', { name: 'Lượt mượn của tôi' })).toBeVisible())
    await chup(page, 'nguoi_dung', 'tai_khoan_luot_muon', k)
    await ctx.close()
  }
})

test('thủ thư: quản lý và dashboard', async ({ browser }) => {
  const dsSoHoa = (id: number) => `/quan-ly?muc=so-hoa&tai_lieu=${id}`
  for (const k of KHUNG) {
    const ctx = await taoContext(browser, k, 'thuthu')
    const page = await ctx.newPage()
    const dau = (await (await ctx.request.get('/api/thong-ke/nen-so-hoa', { params: { gioi_han: '1' } })).json())[0].tai_lieu.id as number

    await mo(page, '/tai-khoan', (p) => expect(p.getByRole('heading', { level: 1 })).toBeVisible())
    await chup(page, 'thu_thu', 'tai_khoan', k)

    await mo(page, '/quan-ly', (p) => expect(p.getByRole('tab', { name: /Chờ duyệt/ })).toBeVisible())
    await expect(page.getByRole('tabpanel').locator('li').first()).toBeVisible()
    await chup(page, 'thu_thu', 'quan_ly_luot_muon', k)

    await mo(page, dsSoHoa(dau), (p) => expect(p.getByRole('button', { name: 'Tải bản mềm lên' })).toBeVisible())
    await chup(page, 'thu_thu', 'quan_ly_so_hoa', k)

    await mo(page, '/quan-ly?muc=chu-de', (p) => expect(p.getByRole('tabpanel').locator('input, table').first()).toBeVisible())
    await chup(page, 'thu_thu', 'quan_ly_chu_de', k)

    await mo(page, '/quan-ly?muc=ma-van-de', (p) => expect(p.getByRole('tabpanel').locator('input, table').first()).toBeVisible())
    await chup(page, 'thu_thu', 'quan_ly_ma_van_de', k)

    await mo(page, '/dashboard', choDashboard)
    await chup(page, 'thu_thu', 'dashboard', k)

    if (k.ten === 1440) {
      // 90 ngày: đồ thị mượn cùng nhau và ThemeRiver đủ dày để minh họa
      await mo(page, '/dashboard?khoang=90', choDashboard)
      await chupBieuDo(page)
    }
    await ctx.close()
  }
})

/** Ảnh từng biểu đồ/khối của dashboard (1440px) -> outputs/screenshots/dashboard/. */
async function chupBieuDo(page: Page) {
  const thuMuc = path.join(GOC_ANH, 'dashboard')
  fs.mkdirSync(thuMuc, { recursive: true })
  // Bỏ sticky để thanh đầu trang/bộ lọc không che biểu đồ khi chụp phần tử
  await page.addStyleTag({ content: '[class*="sticky"]{position:static !important}' })
  const luu = async (ten: string, loc: ReturnType<Page['locator']>) => {
    await loc.scrollIntoViewIfNeeded()
    await page.mouse.move(0, 0)
    await page.waitForTimeout(400)
    await loc.screenshot({ path: path.join(thuMuc, `${ten}.png`) })
  }
  const khung = (tieuDe: string) => page.locator('section', { has: page.getByRole('heading', { name: tieuDe, exact: true }) })

  await luu('kpi', page.locator('div.grid.grid-cols-2').first())
  await luu('luot_tim_theo_ngay', khung('Bạn đọc tìm nhiều vào những ngày nào?'))
  await luu('loai_hinh', khung('Loại hình nào được quan tâm nhất?'))
  await luu('word_cloud', khung('Bạn đọc hay tìm những cụm từ nào?'))
  await luu('top_15_tu_khoa', khung('15 từ khóa nào được tìm nhiều nhất?'))
  await luu('nen_so_hoa', khung('Tư liệu nào nên số hóa trước?'))
  await luu('khong_ket_qua', khung('Bạn đọc tìm gì mà thư viện chưa có?'))
  await luu('luot_doc_ban_mem', khung('Bản mềm nào đang được đọc?'))
  await luu('themeriver_chu_de', khung('Chủ đề nào đang được quan tâm hơn theo thời gian?'))
  await luu('do_thi_muon_cung_nhau', khung('Tư liệu nào thường được mượn cùng nhau?'))

  // Popover "lan tỏa" (nguồn đóng góp điểm lan tỏa của một tư liệu)
  const nut = khung('Tư liệu nào nên số hóa trước?').locator('tbody tr button').first()
  if (await nut.count()) {
    // Cuộn tới bảng và chờ cuộn mượt kết thúc: sự kiện scroll làm popover tự đóng
    await nut.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)
    await nut.click()
    await page.waitForTimeout(400)
    await expect(page.getByRole('dialog', { name: 'Nguồn điểm lan tỏa' })).toBeVisible()
    // Chụp khung nhìn (không chụp theo clip để trang không cuộn: cuộn sẽ đóng popover)
    await page.screenshot({ path: path.join(thuMuc, 'nen_so_hoa_lan_toa.png') })
    await page.keyboard.press('Escape')
  }

  // Lọc chéo: bấm từ khóa đầu bảng top từ khóa -> toàn dashboard đổi
  await page.addStyleTag({ content: '[class*="sticky"]{position:sticky !important}' }).catch(() => undefined)
  const bieuDo = page.locator('[role=img][aria-label^="Biểu đồ cột ngang"]')
  await bieuDo.scrollIntoViewIfNeeded()
  const hop = (await bieuDo.locator('path[fill="#9b1c1c"]').first().boundingBox())!
  await page.mouse.click(hop.x + hop.width / 2, hop.y + hop.height / 2)
  await expect(page).toHaveURL(/tu_khoa=/)
  await page.waitForTimeout(1500)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.mouse.move(0, 0)
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(thuMuc, 'loc_cheo_tu_khoa.png') })
}
