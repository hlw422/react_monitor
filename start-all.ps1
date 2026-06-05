# Enterprise Monitoring Platform - Start All Services
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Enterprise Monitoring Platform" -ForegroundColor Cyan
Write-Host "   Starting All Services..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "[Step 1] Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\backend'; npm install; npm run start:dev" -WindowStyle Normal

Write-Host "[Step 2] Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "[Step 3] Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\frontend'; npm install; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   All services are starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "   Frontend:  " -NoNewline; Write-Host "http://localhost:5178" -ForegroundColor Cyan
Write-Host "   Backend:   " -NoNewline; Write-Host "http://localhost:4000" -ForegroundColor Cyan
Write-Host "   API Docs:  " -NoNewline; Write-Host "http://localhost:4000/api/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Default Login:" -ForegroundColor Yellow
Write-Host "   Username: admin"
Write-Host "   Password: admin123"
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
