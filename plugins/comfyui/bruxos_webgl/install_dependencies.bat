@echo off
setlocal
set "BRUXOS_PYTHON=%~1"
if not defined BRUXOS_PYTHON if exist "%~dp0..\..\..\python_embeded\python.exe" set "BRUXOS_PYTHON=%~dp0..\..\..\python_embeded\python.exe"
if not defined BRUXOS_PYTHON if exist "%~dp0..\..\.venv\Scripts\python.exe" set "BRUXOS_PYTHON=%~dp0..\..\.venv\Scripts\python.exe"
if not defined BRUXOS_PYTHON (
 echo Run this script with the path to ComfyUI's Python:
 echo install_dependencies.bat "C:\ComfyUI_windows_portable\python_embeded\python.exe"
 pause
 exit /b 1
)
"%BRUXOS_PYTHON%" -m pip install -r "%~dp0requirements.txt"
if errorlevel 1 goto failure
"%BRUXOS_PYTHON%" -m playwright install chromium
if errorlevel 1 goto failure
echo Installed. Restart ComfyUI.
pause
exit /b 0
:failure
echo Installation failed. Read the error above.
pause
exit /b 1
