@echo off
setlocal

cd /d "%~dp0"

echo.
echo Starting Nur Motors ^& Electronics...
echo Project: %CD%
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found. Install Node.js first, then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo ERROR: Dependency installation failed.
    pause
    exit /b 1
  )
)

if not exist ".env" (
  echo NOTE: .env was not found. The app will run in demo data mode.
  echo       Copy .env.example to .env and add Supabase values for live data.
  echo.
)

echo App URL: http://127.0.0.1:5173/
echo Press Ctrl+C to stop the app.
echo.

call npm run dev -- --port 5173

echo.
echo App stopped.
pause
