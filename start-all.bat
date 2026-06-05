@echo off
echo ========================================
echo   Enterprise Monitoring Platform
echo   Starting All Services...
echo ========================================
echo.

cd /d "%~dp0"

echo [Step 1] Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm install && npm run start:dev"

echo [Step 2] Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo [Step 3] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo.
echo ========================================
echo   All services are starting...
echo ========================================
echo.
echo   Frontend:  http://localhost:5178
echo   Backend:   http://localhost:4000
echo   API Docs:  http://localhost:4000/api/docs
echo.
echo   Default Login:
echo   Username: admin
echo   Password: admin123
echo.
echo   Close this window to stop all services.
echo ========================================
echo.

pause
