# 1. Hentikan semua proses NW.js yang mungkin masih berjalan di latar belakang
Write-Host "--- Menghentikan proses NW.js yang berjalan ---" -ForegroundColor Yellow
Stop-Process -Name "nw" -ErrorAction SilentlyContinue

# 2. Tunggu sebentar agar sistem melepaskan penguncian file
Start-Sleep -Seconds 2

# 3. Hapus folder dist jika ada
if (Test-Path "./dist") {
    Write-Host "--- Menghapus folder dist secara paksa ---" -ForegroundColor Yellow
    Remove-Item -Path "./dist" -Recurse -Force -ErrorAction SilentlyContinue
}

# 4. Jalankan build menggunakan script build.js kita
Write-Host "--- Memulai Build Desktop Baru ---" -ForegroundColor Cyan
node build.js

Write-Host "--- Selesai! ---" -ForegroundColor Green