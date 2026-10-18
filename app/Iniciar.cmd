@echo off
setlocal
cd /d "%~dp0"
if exist "..\..\work\venv\Scripts\python.exe" (
  "..\..\work\venv\Scripts\python.exe" server.py --open
  exit /b
)
if not exist ".venv\Scripts\python.exe" (
  python -m venv .venv
  if errorlevel 1 goto failed
  ".venv\Scripts\python.exe" -m pip install -r requirements.txt
  if errorlevel 1 goto failed
)
".venv\Scripts\python.exe" server.py --open
if errorlevel 1 goto failed
exit /b
:failed
echo Nao foi possivel iniciar. Verifique Python 3.13, dependencias e se a porta 8765 ja esta em uso.
pause
