@echo off
setlocal

echo Starting CLI backend...

for /f "tokens=2" %%P in ('powershell -NoProfile -Command "(Start-Process -FilePath 'python' -ArgumentList '-m connect' -WorkingDirectory '%~dp0cli-backend' -WindowStyle Hidden -PassThru).Id"') do set CLI_PID=%%P

timeout /t 2 /nobreak >nul

echo Starting TUI...

cd /d "%~dp0tui"
npm run dev

echo.
echo TUI stopped. Closing CLI backend...

if defined CLI_PID taskkill /PID %CLI_PID% /T /F >nul 2>&1

endlocal