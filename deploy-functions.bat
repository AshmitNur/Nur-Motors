@echo off
setlocal

cd /d "%~dp0"

echo.
echo Deploying Nur Motors ^& Electronics Supabase functions...
echo.

where npx >nul 2>nul
if errorlevel 1 (
  echo ERROR: npx was not found. Install Node.js first.
  pause
  exit /b 1
)

echo If this is your first deploy on this machine, run:
echo   npx supabase login
echo.
echo Then run this file again.
echo.

call npx supabase functions deploy create-user --project-ref tfflxseipwsczwchywgr
if errorlevel 1 (
  echo.
  echo ERROR: Function deployment failed. Make sure you ran: npx supabase login
  pause
  exit /b 1
)

echo.
echo create-user function deployed.
pause
