# Kiểm tra toàn bộ từ đầu đến cuối (PowerShell): dựng lại dữ liệu -> pytest -> vitest -> build -> chụp ảnh -> E2E
# -> xuất sơ đồ -> dựng lại dữ liệu sạch. In bảng tóm tắt đạt/lỗi; thoát 1 nếu có bước lỗi.
# Chạy:  powershell -ExecutionPolicy Bypass -File scripts\kiem_tra_toan_bo.ps1
# Nhật ký từng bước: outputs\reports\kiem_tra\<bước>.log
# Lưu ý: E2E ghi vào CSDL (mượn, duyệt, số hóa) nên chạy sau chụp ảnh và có reset ở cuối.
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$goc = Split-Path -Parent $PSScriptRoot
Set-Location $goc
$py = Join-Path $goc 'backend\.venv\Scripts\python.exe'
$log = Join-Path $goc 'outputs\reports\kiem_tra'
New-Item -ItemType Directory -Force -Path $log, (Join-Path $goc 'outputs\diagrams') | Out-Null
$kq = New-Object System.Collections.Generic.List[object]
$coLoi = $false

# Chạy một lệnh cmd trong thư mục, ghi log, lấy dòng tóm tắt khớp mẫu
function Chay([string]$ten, [string]$thuMuc, [string]$lenh, [string]$mau) {
  Write-Host "== $ten ..."
  $t0 = Get-Date
  $tep = Join-Path $log "$ten.log"
  cmd /c "cd /d `"$thuMuc`" && $lenh > `"$tep`" 2>&1"
  $ma = $LASTEXITCODE
  $ct = (Select-String -Path $tep -Pattern $mau -ErrorAction SilentlyContinue | Select-Object -Last 1).Line
  if ($ct) { $ct = ($ct -replace '\x1b\[[0-9;]*m', '' -replace '\s+', ' ').Trim() } else { $ct = '(xem log)' }
  if ($ct.Length -gt 90) { $ct = $ct.Substring(0, 90) }
  if ($ma -ne 0) { $script:coLoi = $true }
  $kq.Add([pscustomobject]@{ Buoc = $ten; KetQua = $(if ($ma -eq 0) { 'DAT' } else { 'LOI' }); Giay = [int]((Get-Date) - $t0).TotalSeconds; ChiTiet = $ct })
}

Chay '1_reset_dau' $goc "`"$py`" -m pipeline.reset" 'Thời gian|tổng'
Chay '2_pytest' "$goc\backend" "`"$py`" -m pytest -q" 'passed|failed|error'
Chay '3_vitest' "$goc\frontend" 'npm run test' 'Tests .*(passed|failed)'
Chay '4_build' "$goc\frontend" 'npm run build' 'built in|error'
Chay '5_chup_anh' "$goc\e2e" 'npx playwright test --project=chup_anh' 'passed|failed'
Chay '6_e2e' "$goc\e2e" 'npx playwright test --project=e2e' 'passed|failed'

# Xuất sơ đồ Mermaid -> SVG và PNG
$t0 = Get-Date
$tepSoDo = Join-Path $log '7_so_do.log'
'' | Set-Content $tepSoDo
$loiSoDo = $false
Write-Host '== 7_so_do ...'
foreach ($f in Get-ChildItem (Join-Path $goc 'docs\diagrams\*.mmd')) {
  foreach ($e in 'svg', 'png') {
    $ra = Join-Path $goc "outputs\diagrams\$($f.BaseName).$e"
    cmd /c "npx -y @mermaid-js/mermaid-cli@11 -i `"$($f.FullName)`" -o `"$ra`" -b white -s 2 >> `"$tepSoDo`" 2>&1"
    if ($LASTEXITCODE -ne 0) { $loiSoDo = $true }
  }
}
$nSvg = (Get-ChildItem (Join-Path $goc 'outputs\diagrams\*.svg')).Count
$nPng = (Get-ChildItem (Join-Path $goc 'outputs\diagrams\*.png')).Count
if ($loiSoDo) { $coLoi = $true }
$kq.Add([pscustomobject]@{ Buoc = '7_so_do'; KetQua = $(if ($loiSoDo) { 'LOI' } else { 'DAT' }); Giay = [int]((Get-Date) - $t0).TotalSeconds; ChiTiet = "Đã xuất $nSvg SVG và $nPng PNG" })

Chay '8_reset_cuoi' $goc "`"$py`" -m pipeline.reset" 'Thời gian|tổng'

$nAnh = (Get-ChildItem (Join-Path $goc 'outputs\screenshots') -Recurse -Filter *.png -ErrorAction SilentlyContinue).Count
Write-Host ''
Write-Host '================ TÓM TẮT ================'
$kq | Format-Table Buoc, KetQua, Giay, ChiTiet -AutoSize | Out-String -Width 200 | Write-Host
Write-Host "Ảnh chụp: $nAnh tệp PNG trong outputs\screenshots"
if ($coLoi) { Write-Host "KẾT QUẢ CHUNG: CÓ LỖI (xem $log)"; exit 1 } else { Write-Host 'KẾT QUẢ CHUNG: ĐẠT'; exit 0 }
