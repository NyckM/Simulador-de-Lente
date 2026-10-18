@echo off
setlocal
call "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul
cd /d "%~dp0"
if not exist panel\engine mkdir panel\engine
cl /nologo /O2 /EHsc /std:c++17 /openmp /MT /I"..\ae" Service.cpp NativeEngine.cpp ..\ae\LensCore.cpp ..\ae\CpuEngine.generated.cpp /Fepanel\engine\BruxosPhotoshopEngine.exe /link /SUBSYSTEM:WINDOWS
if errorlevel 1 exit /b 1
copy /y ..\ae\bin\optica_cuda.dll panel\engine\bruxos_ps_cuda.dll >nul
