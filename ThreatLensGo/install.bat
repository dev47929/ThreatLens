@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo           ThreatLensGo - Dependency Installer
echo ============================================================
echo.

:: 1. Check Python
echo [1/4] Checking Python environment...
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not found in PATH!
    echo Please install Python 3.10+ and make sure it is added to your PATH.
    echo.
    pause
    exit /b 1
)
python --version

:: 2. Check Node.js and NPM
echo.
echo [2/4] Checking Node.js and npm environment...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js v18 or higher and make sure it is added to PATH.
    echo.
    pause
    exit /b 1
)
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not found in PATH!
    echo Please ensure npm is installed and accessible in PATH.
    echo.
    pause
    exit /b 1
)
node --version
call npm --version

:: 3. Install Python Dependencies
echo.
echo [3/4] Installing Python requirements from requirements.txt...
python -m pip install -r "%~dp0requirements.txt"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Failed to install Python dependencies.
    echo Please check the error messages above.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
echo Python dependencies installed successfully.

:: 4. Install TUI Dependencies
echo.
echo [4/4] Installing TUI dependencies via npm...
pushd "%~dp0tui"
call npm install
if %ERRORLEVEL% neq 0 (
    popd
    echo.
    echo [ERROR] Failed to install TUI dependencies via npm.
    echo Please check the error messages above.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
popd
echo TUI dependencies installed successfully.

echo.
echo ============================================================
echo      ThreatLensGo installation completed successfully!
echo ============================================================
echo.
echo You can now launch ThreatLensGo by running:
echo     start.bat
echo.
pause
endlocal
