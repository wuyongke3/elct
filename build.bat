@echo off
cd /d E:\code\electron-template

echo === Building Vite + Electron ===
call npx vite build
if %ERRORLEVEL% NEQ 0 (
  echo Vite build FAILED!
  exit /b 1
)

echo === Building Windows NSIS installer ===
call npx electron-builder --win
if %ERRORLEVEL% NEQ 0 (
  echo Electron-builder FAILED!
  exit /b 1
)

echo.
echo === Build complete! ===
echo Output: dist\windows\
dir /b dist\windows\*.exe 2>nul
