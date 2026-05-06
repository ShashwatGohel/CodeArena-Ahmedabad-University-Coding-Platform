@echo off
echo ==========================================
echo    CodeArena - Ahmedabad University
echo       Starting Development Environment
echo ==========================================

echo [1/3] Starting Backend...
start cmd /k "title Backend && cd backend && npm run dev"

echo [2/3] Starting Frontend...
start cmd /k "title Frontend && cd frontend && npm run dev"

echo [3/4] Starting Judge Worker...
start cmd /k "title Judge Worker && cd backend && node worker.js"

echo [4/4] Starting Judge0 Infrastructure...
start cmd /k "title Judge0 && cd judge0-ce && docker-compose up -d"

echo.
echo ------------------------------------------
echo All services have been launched!
echo Check the newly opened windows for logs.
echo ------------------------------------------
pause
