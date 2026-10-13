@echo off
title CDRMS Cloud Web Server
cd /d "%~dp0cdrms-web"
echo Starting CDRMS Cloud Web Server...
start "" http://localhost:5173/
cmd /c npm run dev -- --host --port 5173
pause
