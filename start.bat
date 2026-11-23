@echo off
echo ==========================================================
echo    FinGuard: Starting Unified Java + React Platform      
echo ==========================================================

REM 1. Compile Java Backend
echo.
echo [1/3] Compiling Java Core & API Server...
javac -cp "lib/mysql-connector-j.jar;." -d . finguard/*.java finguard/api/*.java finguard/concurrent/*.java finguard/db/*.java finguard/exception/*.java finguard/model/*.java finguard/safety/*.java finguard/savings/*.java finguard/service/*.java
if %errorlevel% neq 0 (
  echo Java compilation encountered an issue. Continuing with runtime...
)

REM 2. Start Java API Server
echo.
echo [2/3] Starting Java API Server on http://localhost:8080...
start /b java -cp "lib/mysql-connector-j.jar;." finguard.api.ApiMain 8080

REM 3. Start Frontend
echo.
echo [3/3] Starting React + Tailwind Frontend on http://localhost:5173...
cd frontend
if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
)
call npm run dev
