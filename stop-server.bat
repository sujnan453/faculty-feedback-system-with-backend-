@echo off
echo Stopping Faculty Feedback System...
echo.

REM Kill Python HTTP server
taskkill /f /im python.exe >nul 2>&1

REM Kill Cloudflare tunnel
taskkill /f /im cloudflared.exe >nul 2>&1

echo All servers stopped.
pause