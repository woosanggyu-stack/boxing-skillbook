@echo off
cd /d "%~dp0"
echo Starting boxing skillbook server...
start "boxing skillbook server - close this window to stop" python server.py 8640
timeout /t 2 /nobreak >nul
start "" http://localhost:8640
