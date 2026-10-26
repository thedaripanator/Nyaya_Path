@echo off
echo ===================================================
echo        NYAYA-PATH - STARTING ALL SERVICES
echo ===================================================

if not defined JAVA_HOME if exist "%ProgramFiles%\Java\jdk-21\bin\java.exe" set "JAVA_HOME=%ProgramFiles%\Java\jdk-21"
if not defined JAVA_HOME if exist "%ProgramFiles%\Java\jdk-17\bin\java.exe" set "JAVA_HOME=%ProgramFiles%\Java\jdk-17"
if not defined JAVA_HOME (
  echo Java 17 or 21 was not found. Install a JDK and set JAVA_HOME.
  pause
  exit /b 1
)

powershell -NoProfile -Command "$tcp=New-Object Net.Sockets.TcpClient; try {$tcp.Connect('127.0.0.1',5432); exit 0} catch {exit 1} finally {$tcp.Dispose()}"
if errorlevel 1 (
  echo PostgreSQL is not listening on port 5432. Start PostgreSQL and create the nyaya_path database first.
  pause
  exit /b 1
)

powershell -NoProfile -Command "$tcp=New-Object Net.Sockets.TcpClient; try {$tcp.Connect('127.0.0.1',6333); exit 0} catch {exit 1} finally {$tcp.Dispose()}"
if errorlevel 1 (
  echo Qdrant is not listening on port 6333. Start Docker Desktop and the Qdrant container first.
  pause
  exit /b 1
)

echo [1/3] Starting Python FastAPI ML Service (Port 8001)...
start "Nyaya-Path - Python ML Service" cmd /k "cd /d %~dp0ml-service && if not exist venv\Scripts\python.exe python -m venv venv && venv\Scripts\python -m pip install -r requirements.txt && venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8001"

echo Waiting for the Python ML Service to become ready...
powershell -NoProfile -Command "$deadline=(Get-Date).AddMinutes(2); do { try { $response=Invoke-WebRequest -Uri 'http://127.0.0.1:8001/health' -UseBasicParsing -TimeoutSec 3; if ($response.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 2 } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 (
  echo Python ML Service did not become ready. Check its terminal for Python dependency or configuration errors.
  pause
  exit /b 1
)

echo [2/3] Starting Spring Boot Backend (Port 8100)...
start "Nyaya-Path - Spring Boot Backend" cmd /k "cd /d %~dp0backend\Nyaya-Path && set SPRING_PROFILES_ACTIVE=dev && .\mvnw.cmd spring-boot:run"

echo Waiting for Spring Boot and PostgreSQL to finish starting...
powershell -NoProfile -Command "$deadline=(Get-Date).AddMinutes(2); do { try { $response=Invoke-WebRequest -Uri 'http://127.0.0.1:8100/api/auth/me' -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -lt 500) { exit 0 } } catch { if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -lt 500) { exit 0 } }; Start-Sleep -Seconds 2 } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 (
  echo Spring Boot did not become ready. Check its terminal for database or configuration errors before opening the app.
  pause
  exit /b 1
)

echo [3/3] Starting React Frontend (Port 5173)...
start "Nyaya-Path - React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo All services launched in separate windows!
echo - Frontend:    http://localhost:5173
echo - Spring Boot: http://localhost:8100
echo - ML Service:  http://localhost:8001
echo ===================================================
pause
