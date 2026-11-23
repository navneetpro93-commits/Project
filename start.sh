#!/usr/bin/env bash

# FinGuard One-Command Unified Startup Script
# Connects Java Backend (Port 8080) + React Tailwind Frontend (Port 5173)

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "   FinGuard: Starting Unified Java + React Platform       "
echo "=========================================================="

# 1. Compile Java Backend
echo ""
echo "[1/3] Compiling Java Core & API Server with MySQL JDBC Driver..."
javac -cp "lib/mysql-connector-j.jar:." -d . finguard/*.java finguard/api/*.java finguard/concurrent/*.java finguard/db/*.java finguard/exception/*.java finguard/model/*.java finguard/safety/*.java finguard/savings/*.java finguard/service/*.java
if [ $? -ne 0 ]; then
  echo "❌ Java compilation failed. Please fix any syntax issues."
  exit 1
fi
echo "✔ Java Core successfully compiled."

# 2. Start Java API Server if not already running on port 8080
echo ""
echo "[2/3] Checking Java API Server on port 8080..."
if lsof -i :8080 > /dev/null 2>&1; then
  echo "✔ Java Server is already active on http://localhost:8080"
else
  echo "🚀 Starting Java API Server on http://localhost:8080..."
  java -cp "lib/mysql-connector-j.jar:." finguard.api.ApiMain 8080 > java_server.log 2>&1 &
  JAVA_PID=$!
  sleep 2
  echo "✔ Java Server started (PID: $JAVA_PID). Logs: java_server.log"
fi

# 3. Start React + Tailwind Frontend
echo ""
echo "[3/3] Starting React + Tailwind CSS Frontend on port 5173..."
cd "$DIR/frontend"

if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

echo ""
echo "=========================================================="
echo "✔ System is ready!"
echo "   • React Frontend: http://localhost:5173"
echo "   • Java Backend:   http://localhost:8080"
echo "=========================================================="
echo ""

npm run dev
