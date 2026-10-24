@echo off
echo ============================================================
echo Starting Procure-to-Pay (P2P) Analytics & Automated Reporting
echo ============================================================

echo [1/2] Starting FastAPI Backend on http://localhost:8000...
start "P2P Backend API" cmd /k "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://localhost:5173...
start "P2P Frontend UI" cmd /k "cd frontend && npm run dev"

echo ============================================================
echo Both servers are launching!
echo Backend Swagger API Docs: http://localhost:8000/docs
echo Frontend Web Dashboard:   http://localhost:5173
echo ============================================================
