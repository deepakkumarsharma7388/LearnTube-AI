@echo off
setlocal
cd /d %~dp0
echo ================================================
echo LearnTube AI - Setup
echo Node.js + Express + MongoDB Atlas + Gemini AI
echo ================================================
if not exist backend\.env copy backend\.env.example backend\.env && echo Created backend\.env from .env.example
if not exist frontend\.env copy frontend\.env.example frontend\.env && echo Created frontend\.env from .env.example
echo.
echo IMPORTANT: Edit backend\.env and add MONGO_URI, ADMIN_TOKEN and GEMINI_API_KEY.
echo.
echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 goto fail
cd ..
echo Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 goto fail
cd ..
echo.
echo Setup complete.
echo Next: edit backend\.env, then run start-windows.bat or start both servers separately.
goto done
:fail
echo.
echo Setup failed. Check the error above.
exit /b 1
:done
pause
