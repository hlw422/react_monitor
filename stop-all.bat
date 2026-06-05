@echo off
echo ========================================
echo   Stopping All Services...
echo ========================================
echo.

echo Stopping Node.js processes on port 4000 and 5178...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000" ^| findstr "LISTENING"') do (
    echo Stopping backend process (PID: %%a)
    taskkill /F /PID %%a > nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5178" ^| findstr "LISTENING"') do (
    echo Stopping frontend process (PID: %%a)
    taskkill /F /PID %%a > nul 2>&1
)

echo.
echo All services stopped.
echo.
pause
