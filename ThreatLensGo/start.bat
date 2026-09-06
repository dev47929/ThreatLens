@echo off
cls 
setlocal

echo Checking CLI backend...
node -e "fetch('http://localhost:1234/pulse').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo CLI backend is already running on port 1234.
    set CLI_PID=
) else (
    echo Starting CLI backend...
    for /f "tokens=2" %%P in ('powershell -NoProfile -Command "(Start-Process -FilePath 'python' -ArgumentList '-m connect' -WorkingDirectory '%~dp0cli-backend' -WindowStyle Hidden -PassThru).Id"') do set CLI_PID=%%P
    timeout /t 2 /nobreak >nul
)

echo Starting TUI...

cd /d "%~dp0tui"
start /wait /max cmd /c "cls && npm run dev"

echo.
echo TUI stopped. Closing CLI backend...

if defined CLI_PID taskkill /PID %CLI_PID% /T /F >nul 2>&1

endlocal