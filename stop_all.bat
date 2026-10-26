@echo off
echo ===================================================
echo        NYAYA-PATH - STOPPING ALL SERVICES
echo ===================================================

echo Stopping services on ports 8000/8001 (ML), 8100 (Spring Boot), 5173 (Frontend)...
for %%p in (8000 8001 8100 5173) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%p ^| findstr LISTENING') do (
        echo Killing process PID %%a on port %%p...
        taskkill /F /PID %%a 2>nul
    )
)

echo.
echo All Nyaya-Path services stopped.
pause
