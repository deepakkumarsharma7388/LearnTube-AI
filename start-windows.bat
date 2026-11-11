@echo off
setlocal
cd /d "%~dp0"

if not exist "backend\.env" (
  echo backend\.env not found. Run setup-windows.bat first.
  pause
  exit /b 1
)

start "LearnTube AI Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 2 /nobreak >nul
start "LearnTube AI Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Backend and frontend are starting in separate windows.
pause
