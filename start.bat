@echo off
title Tebak Kata LIVE Launcher
color 0A

echo ========================================================
echo         TEBAK KATA LIVE - GAME LAUNCHER
echo ========================================================
echo.

:: 1. Build shared package first
echo [1/3] Building @tebak-kata/shared...
call npm run build -w packages/shared
if %errorlevel% neq 0 (
    echo [ERROR] Gagal build @tebak-kata/shared!
    pause
    exit /b %errorlevel%
)

:: 2. Start Backend Server in a new window
echo [2/3] Menjalankan Server Backend (Port 4000)...
start "Tebak Kata - Backend Server (Port 4000)" cmd /k "cd /d %~dp0 && npm run dev -w apps/server"

:: 3. Start Next.js Frontend in a new window
echo [3/3] Menjalankan Frontend Web (Port 3000)...
start "Tebak Kata - Web Frontend (Port 3000)" cmd /k "cd /d %~dp0 && npm run dev -w apps/web"

echo.
echo ========================================================
echo   Semua service sedang berjalan!
echo ========================================================
echo.
echo   - Host Dashboard : http://localhost:3000/host
echo   - OBS Overlay    : http://localhost:3000/overlay
echo   - Admin Panel    : http://localhost:3000/admin
echo.
echo Membuka Host Dashboard di browser dalam 5 detik...
timeout /t 5 /nobreak >nul
start http://localhost:3000/host

echo Launcher selesai. Tekan sembarang tombol untuk keluar dari jendela ini.
pause >nul
