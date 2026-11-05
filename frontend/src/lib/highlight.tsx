// Tô đậm phần khớp với truy vấn, không phân biệt dấu và hoa thường.
import { Fragment, type ReactNode } from 'react'

/** Bỏ dấu tiếng Việt, đ→d, chữ thường. */
export function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

/**
 * Trả về các đoạn [bắt đầu, kết thúc) trong chuỗi gốc khớp với các từ của truy vấn.
 * Chuẩn hóa từng ký tự gốc và giữ bảng ánh xạ để vị trí không lệch khi bỏ dấu.
 */
export function timDoanKhop(text: string, query: string): [number, number][] {
  const tokens = boDau(query)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 1)
  if (!tokens.length || !text) return []

  let chuan = ''
  const viTriGoc: number[] = [] // viTriGoc[i] = chỉ số ký tự gốc của ký tự chuẩn hóa thứ i
  const chars = Array.from(text)
  let idx = 0
  for (const ch of chars) {
    const n = boDau(ch)
    for (let k = 0; k < n.length; k++) {
      chuan += n[k]
      viTriGoc.push(idx)
    }
    idx += ch.length
  }

  const laChu = (c: string | undefined) => !!c && /[\p{L}\p{N}]/u.test(c)
  const doan: [number, number][] = []
  for (const t of tokens) {
    // Chỉ khớp ở đầu một từ; nếu có khớp nguyên từ thì chỉ giữ khớp nguyên từ ("tru" → "trữ", không tô "Trung")
    const dauTu: { p: number; nguyen: boolean }[] = []
    let from = 0
    while (from <= chuan.length - t.length) {
      const p = chuan.indexOf(t, from)
      if (p < 0) break
      if (!laChu(chuan[p - 1])) dauTu.push({ p, nguyen: !laChu(chuan[p + t.length]) })
      from = p + 1
    }
    const coNguyen = dauTu.some((d) => d.nguyen)
    for (const { p, nguyen } of dauTu) {
      if (coNguyen && !nguyen) continue
      const start = viTriGoc[p]
      const lastIdx = viTriGoc[p + t.length - 1]
      // kết thúc = hết ký tự gốc chứa ký tự chuẩn hóa cuối (tính cả cặp surrogate)
      const goc = text.codePointAt(lastIdx)
      const end = lastIdx + (goc !== undefined && goc > 0xffff ? 2 : 1)
      doan.push([start, end])
    }
  }
  if (!doan.length) return []
  // Gộp các đoạn chồng nhau
  doan.sort((a, b) => a[0] - b[0])
  const gop: [number, number][] = [doan[0]]
  for (const d of doan.slice(1)) {
    const cuoi = gop[gop.length - 1]
    if (d[0] <= cuoi[1]) cuoi[1] = Math.max(cuoi[1], d[1])
    else gop.push([...d])
  }
  return gop
}

export function ToDam({ text, query, className = 'font-semibold text-ink bg-gold-100/80 rounded-[2px]' }: { text: string; query: string; className?: string }): ReactNode {
  const doan = timDoanKhop(text, query)
  if (!doan.length) return text
  const out: ReactNode[] = []
  let truoc = 0
  doan.forEach(([a, b], i) => {
    if (a > truoc) out.push(<Fragment key={`t${i}`}>{text.slice(truoc, a)}</Fragment>)
    out.push(
      <mark key={`m${i}`} className={className}>
        {text.slice(a, b)}
      </mark>,
    )
    truoc = b
  })
  if (truoc < text.length) out.push(<Fragment key="cuoi">{text.slice(truoc)}</Fragment>)
  return <>{out}</>
}
