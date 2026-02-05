@echo off
echo Starting Faculty Feedback System...
echo.

REM Navigate to project directory
cd /d "%~dp0"

REM Start Python HTTP server in background
echo Starting local server on port 8000...
start /min python -m http.server 8000

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Start Cloudflare tunnel
echo Starting Cloudflare tunnel...
echo.
cloudflared tunnel --url http://localhost:8000

pause