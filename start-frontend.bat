@echo off
echo ========================================
echo   Starting Frontend Server (React + Vite)
echo ========================================
echo.

cd /d "%~dp0frontend"

echo [1/2] Installing dependencies...
call npm install

echo.
echo [2/2] Starting frontend server...
echo Frontend will be available at: http://localhost:5178
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
