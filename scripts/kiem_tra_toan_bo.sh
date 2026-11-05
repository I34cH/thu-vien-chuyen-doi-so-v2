#!/usr/bin/env bash
# Kiểm tra toàn bộ từ đầu đến cuối (Git Bash): dựng lại dữ liệu -> pytest -> vitest -> build -> chụp ảnh -> E2E
# -> xuất sơ đồ -> dựng lại dữ liệu sạch. In bảng tóm tắt đạt/lỗi; thoát 1 nếu có bước lỗi.
# Chạy từ bất kỳ đâu:  bash scripts/kiem_tra_toan_bo.sh
# Nhật ký từng bước: outputs/reports/kiem_tra/<bước>.log
# Lưu ý: E2E ghi vào CSDL (mượn, duyệt, số hóa) nên chạy sau chụp ảnh và có reset ở cuối.
cd "$(dirname "$0")/.." || exit 2
GOC="$(pwd)"
PY="$GOC/backend/.venv/Scripts/python"
LOG="$GOC/outputs/reports/kiem_tra"
mkdir -p "$LOG" "$GOC/outputs/diagrams"

TEN=(); KQ=(); CT=(); GIAY=()
CO_LOI=0

# chay <ten> <thu_muc> <mau_tom_tat> <lenh...>: chạy lệnh, ghi log, lấy dòng tóm tắt khớp <mau_tom_tat>
chay() {
  local ten="$1" thu_muc="$2" mau="$3"; shift 3
  local t0=$SECONDS
  echo "== $ten ..."
  ( cd "$thu_muc" && "$@" ) > "$LOG/$ten.log" 2>&1
  local ma=$?
  local ct
  ct="$(grep -aE "$mau" "$LOG/$ten.log" | tail -n 1 | sed 's/\x1b\[[0-9;]*m//g' | tr -s ' ' | cut -c1-90)"
  TEN+=("$ten"); GIAY+=("$((SECONDS - t0))")
  if [ $ma -eq 0 ]; then KQ+=("DAT"); else KQ+=("LOI"); CO_LOI=1; fi
  CT+=("${ct:-(xem log)}")
}

xuat_so_do() {
  local loi=0 f n
  for f in "$GOC"/docs/diagrams/*.mmd; do
    n="$(basename "$f" .mmd)"
    for e in svg png; do
      npx -y @mermaid-js/mermaid-cli@11 -i "$f" -o "$GOC/outputs/diagrams/$n.$e" -b white -s 2 || loi=1
    done
  done
  echo "Đã xuất $(ls "$GOC"/outputs/diagrams/*.svg | wc -l) SVG và $(ls "$GOC"/outputs/diagrams/*.png | wc -l) PNG"
  return $loi
}

chay "1_reset_dau"   "$GOC"          "Thời gian|tổng"        "$PY" -m pipeline.reset
chay "2_pytest"      "$GOC/backend"  "passed|failed|error"   "$PY" -m pytest -q
chay "3_vitest"      "$GOC/frontend" "Tests .*(passed|failed)" npm run test
chay "4_build"       "$GOC/frontend" "built in|error"        npm run build
chay "5_chup_anh"    "$GOC/e2e"      "passed|failed"         npx playwright test --project=chup_anh
chay "6_e2e"         "$GOC/e2e"      "passed|failed"         npx playwright test --project=e2e
chay "7_so_do"       "$GOC"          "Đã xuất"               xuat_so_do
chay "8_reset_cuoi"  "$GOC"          "Thời gian|tổng"        "$PY" -m pipeline.reset

N_ANH=$(find "$GOC/outputs/screenshots" -name '*.png' 2>/dev/null | wc -l)
echo
echo "================ TÓM TẮT ================"
printf '%-14s %-5s %5s  %s\n' "Bước" "Kết quả" "Giây" "Chi tiết"
for i in "${!TEN[@]}"; do
  printf '%-14s %-7s %5s  %s\n' "${TEN[$i]}" "${KQ[$i]}" "${GIAY[$i]}" "${CT[$i]}"
done
echo "Ảnh chụp: $N_ANH tệp PNG trong outputs/screenshots"
if [ $CO_LOI -eq 0 ]; then echo "KẾT QUẢ CHUNG: ĐẠT"; else echo "KẾT QUẢ CHUNG: CÓ LỖI (xem $LOG)"; fi
exit $CO_LOI
