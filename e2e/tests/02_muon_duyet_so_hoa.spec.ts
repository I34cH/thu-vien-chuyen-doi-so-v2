// Kịch bản nối tiếp: sv01 đăng ký mượn -> thủ thư duyệt (thấy hạn trả) -> ghi nhận trả (dọn lượt mượn)
// -> Dashboard (KPI, lọc chéo, ThemeRiver + đồ thị mượn) -> số hóa tư liệu đứng đầu bảng "nên số hóa".
// Dữ liệu ghi: 1 lượt mượn (được trả lại ở cuối kịch bản mượn), 1 bản mềm PDF (KHÔNG hoàn tác được:
// chạy `pipeline.reset` trước mỗi lượt chạy để kết quả lặp lại; scripts/kiem_tra_toan_bo.* đã làm việc này).
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import {
  PDF_MAU, TAI_KHOAN, choDashboard, dangNhapUI, giaTriKpi, theoDoiLoi, timTuLieuConBan,
} from './tro_giup'

test.describe.configure({ mode: 'serial' })

let ctxSv: BrowserContext
let ctxTt: BrowserContext
let pSv: Page
let pTt: Page
let tl: { id: number; tieu_de: string }

test.beforeAll(async ({ browser }) => {
  ctxSv = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  ctxTt = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  pSv = await ctxSv.newPage()
  pTt = await ctxTt.newPage()
})
test.afterAll(async () => {
  await ctxSv?.close()
  await ctxTt?.close()
})

test.describe('Mượn và duyệt', () => {
  test('sv01 đăng ký mượn, thấy "Chờ duyệt" ở trang tài khoản', async () => {
    await dangNhapUI(pSv, TAI_KHOAN.sv01.ten, TAI_KHOAN.sv01.mk)
    await expect(pSv.getByRole('heading', { name: 'Lượt mượn của tôi' })).toBeVisible()
    tl = await timTuLieuConBan(ctxSv)

    await pSv.goto(`/tai-lieu/${tl.id}`)
    await expect(pSv.getByRole('heading', { level: 1 })).toHaveText(tl.tieu_de)
    await pSv.getByRole('button', { name: 'Đăng ký mượn' }).click()
    await expect(pSv.getByText('Đã gửi đăng ký mượn')).toBeVisible()

    await pSv.goto('/tai-khoan')
    const tabCho = pSv.getByRole('tab', { name: /Chờ duyệt/ })
    await tabCho.click()
    const dong = pSv.getByRole('tabpanel').locator('li', { hasText: tl.tieu_de })
    await expect(dong).toBeVisible()
    await expect(dong.getByText('Chờ duyệt')).toBeVisible()
  })

  test('thủ thư duyệt lượt vừa tạo, thấy hạn trả; sv01 thấy đang mượn; thủ thư ghi nhận trả', async () => {
    await dangNhapUI(pTt, TAI_KHOAN.thuthu.ten, TAI_KHOAN.thuthu.mk)
    await pTt.goto('/quan-ly')
    await pTt.getByRole('searchbox', { name: 'Tìm trong hàng đợi' }).fill(tl.tieu_de)
    const dong = pTt.getByRole('tabpanel').locator('li', { hasText: 'sv01' }).filter({ hasText: tl.tieu_de })
    await expect(dong).toHaveCount(1)
    await dong.getByRole('button', { name: 'Duyệt', exact: true }).click()
    await dong.getByRole('group', { name: 'Duyệt và gán bản sao?' }).getByRole('button', { name: 'Duyệt', exact: true }).click()
    await expect(pTt.getByText('Đã duyệt lượt mượn')).toBeVisible()
    await expect(pTt.getByText(/hạn trả \d{2}\/\d{2}\/\d{4}/)).toBeVisible()

    // Sang tab "Đang mượn": dòng có hạn trả
    await pTt.getByRole('tab', { name: /Đang mượn/ }).click()
    const dongMuon = pTt.getByRole('tabpanel').locator('li', { hasText: 'sv01' }).filter({ hasText: tl.tieu_de })
    await expect(dongMuon).toContainText(/Hạn \d{2}\/\d{2}\/\d{4}/)

    // sv01 thấy trạng thái mới
    await pSv.goto('/tai-khoan')
    await expect(pSv.getByRole('tabpanel').locator('li', { hasText: tl.tieu_de })).toContainText(/Còn \d+ ngày/)

    // Dọn: ghi nhận trả để bản sao trở lại "còn"
    await dongMuon.getByRole('button', { name: 'Ghi nhận trả' }).click()
    await dongMuon.getByRole('group').getByRole('button', { name: 'Ghi nhận trả' }).click()
    await expect(pTt.getByText('Đã ghi nhận trả')).toBeVisible()
  })
})

test.describe('Dashboard và số hóa', () => {
  test('5 thẻ KPI có số', async () => {
    const theo = theoDoiLoi(pTt)
    await pTt.goto('/dashboard')
    await choDashboard(pTt)
    for (const nhan of ['Lượt tìm', 'Tìm không ra', 'Lượt mượn đang mở', 'Đã số hóa', 'Lượt đọc bản mềm']) {
      await expect(giaTriKpi(pTt, nhan), nhan).toHaveText(/\d/)
    }
    expect(theo.loi, theo.loi.join('\n')).toEqual([])
  })

  test('bấm một từ khóa ở top từ khóa: URL có tu_khoa= và KPI đổi', async () => {
    await pTt.goto('/dashboard')
    await choDashboard(pTt)
    const truoc = await giaTriKpi(pTt, 'Lượt tìm').innerText()
    const bieuDo = pTt.locator('[role=img][aria-label^="Biểu đồ cột ngang"]')
    await bieuDo.scrollIntoViewIfNeeded()
    // Cột đầu tiên (từ khóa nhiều nhất) là path tô màu đỏ thương hiệu
    const cot = bieuDo.locator('path[fill="#9b1c1c"]').first()
    const hop = (await cot.boundingBox())!
    await pTt.mouse.click(hop.x + hop.width / 2, hop.y + hop.height / 2)
    await expect(pTt).toHaveURL(/tu_khoa=/)
    await expect(pTt.getByRole('button', { name: /Bỏ lọc từ khóa/ })).toBeVisible()
    await expect(giaTriKpi(pTt, 'Lượt tìm')).not.toHaveText(truoc)
    const sau = await giaTriKpi(pTt, 'Lượt tìm').innerText()
    expect(Number(sau.replace(/\./g, ''))).toBeLessThan(Number(truoc.replace(/\./g, '')))
    // Bỏ lọc thì quay lại như cũ
    await pTt.getByRole('button', { name: /Bỏ lọc từ khóa/ }).click()
    await expect(pTt).not.toHaveURL(/tu_khoa=/)
    await expect(giaTriKpi(pTt, 'Lượt tìm')).toHaveText(truoc)
  })

  test('ThemeRiver và đồ thị mượn cùng nhau cùng hiển thị', async () => {
    await pTt.goto('/dashboard')
    await choDashboard(pTt)
    const song = pTt.locator('[role=img][aria-label^="Biểu đồ dòng chảy chủ đề"]')
    const doThi = pTt.locator('[role=img][aria-label^="Đồ thị mạng"]')
    for (const b of [song, doThi]) {
      await b.scrollIntoViewIfNeeded()
      await expect(b).toBeVisible()
      expect(await b.locator('svg path').count()).toBeGreaterThan(5)
      const hop = (await b.boundingBox())!
      expect(hop.width).toBeGreaterThan(200)
      expect(hop.height).toBeGreaterThan(150)
    }
    await expect(pTt.getByText(/tư liệu · \d+ cặp/)).toBeVisible()
    // ngưỡng tối thiểu 2 bạn đọc chung
    await expect(pTt.getByRole('slider')).toHaveAttribute('min', '2')
  })

  test('Quản lý › Chủ đề: có nhóm "Tổng hợp", sửa nhãn (giữ sau khi tải lại) rồi khôi phục nhãn tự động', async () => {
    await pTt.goto('/quan-ly?muc=chu-de')
    const bang = pTt.getByRole('tabpanel')
    await expect(bang.getByRole('button', { name: /^Sửa nhãn chủ đề Tổng hợp \(nhiều chủ đề\)/ })).toBeVisible()
    const nutDau = bang.getByRole('button', { name: /^Sửa nhãn chủ đề / }).nth(1)
    const nhanGoc = ((await nutDau.getAttribute('aria-label')) ?? '').replace('Sửa nhãn chủ đề ', '')
    const ds = (await (await ctxTt.request.get('/api/quan-ly/chu-de')).json()) as { id: number; nhan: string }[]
    const idChuDe = ds.find((c) => c.nhan === nhanGoc)!.id
    try {
      await nutDau.click()
      await bang.getByRole('textbox').fill('Nhãn thử E2E')
      await bang.getByRole('textbox').press('Enter')
      const tenNut = 'Sửa nhãn chủ đề Nhãn thử E2E'
      await expect(bang.getByRole('button', { name: tenNut })).toBeVisible()
      // nhãn sửa tay được lưu (tải lại vẫn còn), hiện nhãn tự động gốc và nút khôi phục
      await pTt.reload()
      const dong = bang.locator('tr', { has: pTt.getByRole('button', { name: tenNut }) })
      await expect(dong).toContainText('Sửa tay')
      await expect(dong).toContainText(`Nhãn tự động: ${nhanGoc}`)
      await dong.getByRole('button', { name: 'Khôi phục nhãn tự động' }).click()
      await expect(bang.getByRole('button', { name: `Sửa nhãn chủ đề ${nhanGoc}`, exact: true })).toBeVisible()
      await expect(bang.getByText('Sửa tay', { exact: true })).toHaveCount(0)
    } finally {
      // luôn trả về nhãn tự động để pipeline.reset không giữ nhãn thử
      await ctxTt.request.post(`/api/quan-ly/chu-de/${idChuDe}/khoi-phuc`)
    }
  })

  test('tải bản mềm cho tư liệu đứng đầu bảng nên số hóa: tư liệu rời bảng', async () => {
    await pTt.goto('/dashboard')
    await choDashboard(pTt)
    const bang = pTt.locator('section', { has: pTt.getByRole('heading', { name: 'Tư liệu nào nên số hóa trước?' }) })
    const hangDau = bang.locator('tbody tr').first()
    const tieuDe = (await hangDau.locator('a').first().innerText()).trim()
    const daSoHoaTruoc = Number((await giaTriKpi(pTt, 'Đã số hóa').innerText()).replace(/\./g, ''))
    await expect(hangDau.locator('td').first()).toHaveText('1')

    await hangDau.getByRole('link', { name: /Số hóa/ }).click()
    await expect(pTt).toHaveURL(/\/quan-ly\?muc=so-hoa&tai_lieu=\d+/)
    const id = Number(new URL(pTt.url()).searchParams.get('tai_lieu'))
    await expect(pTt.getByRole('link', { name: tieuDe })).toBeVisible()
    await pTt.getByLabel('Chọn tệp PDF').setInputFiles(PDF_MAU)
    await pTt.getByRole('button', { name: 'Tải bản mềm lên' }).click()
    await expect(pTt.getByText('Đã số hóa xong')).toBeVisible()

    // Tư liệu rời bảng, KPI "Đã số hóa" tăng 1
    await pTt.goto('/dashboard')
    await choDashboard(pTt)
    await expect(bang.locator('tbody tr a', { hasText: tieuDe })).toHaveCount(0)
    await expect(giaTriKpi(pTt, 'Đã số hóa')).toHaveText(String(daSoHoaTruoc + 1))

    // Khách đọc được bản mềm công khai (đóng vòng lặp)
    const r = await ctxTt.request.get(`/api/tai-lieu/${id}/ban-mem`)
    expect(r.status()).toBe(200)
    expect(r.headers()['content-type']).toContain('pdf')
    await pTt.goto(`/tai-lieu/${id}`)
    await expect(pTt.getByRole('link', { name: /Đọc bản mềm/ })).toBeVisible()
  })
})
