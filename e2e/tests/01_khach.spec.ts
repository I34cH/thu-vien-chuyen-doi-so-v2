// Kịch bản khách (không đăng nhập): gợi ý khi gõ, tìm không dấu, gợi ý sửa lỗi, 0 kết quả, trang thủ thư bị chặn.
// Chỉ đọc (mỗi lần tìm ghi 1 dòng log_tim_kiem, không ảnh hưởng kịch bản khác).
import { expect, test } from '@playwright/test'

test.describe('Khách', () => {
  test('gõ "luu tr" thấy gợi ý, Enter ra kết quả có "còn x/y bản"', async ({ page }) => {
    await page.goto('/')
    const o = page.getByRole('combobox')
    await o.pressSequentially('luu tr', { delay: 60 })
    const goiY = page.getByRole('listbox', { name: 'Gợi ý tìm kiếm' })
    await expect(goiY.getByRole('option').first()).toBeVisible()
    // Có ít nhất một gợi ý tư liệu hoặc từ khóa ngoài dòng "Tìm tất cả kết quả"
    await expect(goiY.getByRole('option')).not.toHaveCount(1)
    await o.press('Enter')
    await expect(page).toHaveURL(/\/tra-cuu\?q=luu(%20|\+)tr/)
    const ketQua = page.getByRole('region', { name: /kết quả/i })
    await expect(ketQua.locator('article').first()).toBeVisible()
    await expect(ketQua).toContainText(/Còn \d+\/\d+ bản/)
  })

  test('gõ "lu tru": hiện kết quả cho "lưu trữ", bấm "Tìm chính xác" rồi "Có phải bạn muốn tìm"', async ({ page }) => {
    const soKetQua = async () =>
      Number((await page.locator('#tieu-de-ket-qua strong').first().innerText()).replace(/\D/g, ''))
    await page.goto('/tra-cuu?q=lu%20tru')
    // Mặc định (như các công cụ tìm kiếm phổ biến): kết quả của cụm đã sửa, kèm lối tìm chính xác cụm gốc
    const daSua = page.getByTestId('da-sua')
    await expect(daSua).toHaveText('Đang hiện kết quả cho lưu trữ. Tìm chính xác “lu tru”')
    await expect(page.locator('article').first()).toBeVisible()
    const soSua = await soKetQua()
    expect(soSua).toBeGreaterThan(100)
    await daSua.getByRole('button', { name: '“lu tru”' }).click()
    await expect(page).toHaveURL(/chinh_xac=1/)
    // Chế độ chính xác: chỉ tiêu đề chứa nguyên văn "lu tru" (ít hơn hẳn), hỏi lại "Có phải bạn muốn tìm"
    const goiY = page.getByTestId('goi-y-sua')
    await expect(goiY).toContainText('Đang hiện kết quả chính xác cho “lu tru”. Có phải bạn muốn tìm lưu trữ?')
    await expect.poll(soKetQua).toBeLessThan(soSua)
    // Bấm gợi ý thì tìm lại bằng cụm đã sửa (bỏ chế độ chính xác)
    await goiY.getByRole('button').click()
    await expect(page).toHaveURL(/q=l(%C6%B0|ư)u(%20|\+)tr(%E1%BB%AF|ữ)$/)
    await expect(page.locator('article').first()).toBeVisible()
  })

  test('"hoc may" ra 0 kết quả', async ({ page }) => {
    await page.goto('/tra-cuu?q=hoc%20may')
    await expect(page.getByRole('heading', { name: /0\s*kết quả/ })).toBeVisible()
    await expect(page.getByText(/Chưa tìm thấy/)).toBeVisible()
    await expect(page.locator('article')).toHaveCount(0)
  })

  test('trang quản lý và dashboard yêu cầu đăng nhập', async ({ page }) => {
    for (const [duongDan, tieuDe] of [
      ['/quan-ly', /Trang quản lý dành cho thủ thư/],
      ['/dashboard', /Dashboard dành cho thủ thư/],
    ] as const) {
      await page.goto(duongDan)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(tieuDe)
      const dangNhap = page.getByRole('link', { name: 'Đăng nhập', exact: true }).last()
      await expect(dangNhap).toHaveAttribute('href', new RegExp(`/tai-khoan\\?tiep=${encodeURIComponent(duongDan)}`))
    }
  })
})
