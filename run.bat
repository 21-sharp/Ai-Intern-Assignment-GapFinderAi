@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or is not on PATH.
  pause
  exit /b 1
)

node -e "const [major,minor] = process.versions.node.split('.').map(Number); if (major < 22 || (major === 22 && minor < 13)) process.exit(1)"
if errorlevel 1 (
  echo Node.js 22.13 or newer is required. Install a supported Node.js version and try again.
  pause
  exit /b 1
)

if not exist "node_modules\next\dist\bin\next" (
  echo Installing project dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

echo Starting GapFinder AI on http://localhost:3000
node "%~dp0scripts\dev-server.cjs"
set "EXIT_CODE=%ERRORLEVEL%"
if "%EXIT_CODE%"=="2" (
  echo GapFinder AI did not start because port 3000 is already in use.
  pause >nul
)
if not "%EXIT_CODE%"=="0" if not "%EXIT_CODE%"=="2" (
  echo GapFinder AI stopped with an error. Read the message above, then press any key to close this window.
  pause >nul
)
exit /b %EXIT_CODE%
