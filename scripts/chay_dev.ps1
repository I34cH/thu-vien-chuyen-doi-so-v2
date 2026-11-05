# Bật backend (cổng 8000) và frontend (cổng 5173) cho phát triển, mỗi cái một cửa sổ PowerShell.
# Chạy:  powershell -ExecutionPolicy Bypass -File scripts\chay_dev.ps1
# Dừng: đóng hai cửa sổ (hoặc Ctrl+C trong từng cửa sổ). Mở http://localhost:5173
$goc = Split-Path -Parent $PSScriptRoot
$py = Join-Path $goc 'backend\.venv\Scripts\python.exe'
if (-not (Test-Path $py)) { Write-Error "Chưa có backend\.venv. Xem README.md mục Cài đặt."; exit 1 }

Start-Process powershell -WorkingDirectory (Join-Path $goc 'backend') -ArgumentList '-NoExit', '-Command', "& '$py' -m uvicorn app.main:app --reload --port 8000"
Start-Process powershell -WorkingDirectory (Join-Path $goc 'frontend') -ArgumentList '-NoExit', '-Command', 'npm run dev -- --port 5173'

Write-Host 'Đang bật backend http://localhost:8000 và frontend http://localhost:5173 ...'
Write-Host 'Tài khoản demo: thuthu/thuthu123, sv01/sv123, gv01/gv123'
