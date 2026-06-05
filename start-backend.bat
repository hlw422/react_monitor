@echo off
echo ========================================
echo   Starting Backend Server (NestJS)
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1/2] Installing dependencies...
call npm install

echo.
echo [2/2] Starting backend server...
echo Backend will be available at: http://localhost:4000
echo API Docs: http://localhost:4000/api/docs
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run start:dev
