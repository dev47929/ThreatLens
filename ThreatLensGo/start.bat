@echo off

start "CLI Backend" cmd /k "cd /d %~dp0cli-backend && python -m connect"

start "TUI" cmd /k "cd /d %~dp0tui && npm run dev"