@echo off
setlocal

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%artifacts\admin-link-pool"
set "DNS_BACKEND=%ROOT%DNS-Locket-Gold"

if not exist "%FRONTEND%\package.json" (
  echo Frontend folder not found: %FRONTEND%
  pause
  exit /b 1
)

start "Unified Frontend" cmd /k "cd /d ""%FRONTEND%"" && set PORT=5173 && set BASE_PATH=/ && set DNS_BACKEND_URL=http://localhost:8080 && pnpm run dev"

if exist "%DNS_BACKEND%\server.js" (
  start "DNS Backend" cmd /k "cd /d ""%DNS_BACKEND%"" && set PORT=8080 && node server.js"
) else (
  echo DNS backend not found: %DNS_BACKEND%\server.js
  echo Frontend was started, but DNS automation backend could not be started.
)

timeout /t 3 /nobreak >nul
start "" http://localhost:5173/
echo Unified application: http://localhost:5173/
endlocal
