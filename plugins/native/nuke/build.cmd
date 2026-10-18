@echo off
setlocal
call "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul
cd /d "%~dp0"
if not exist bin mkdir bin
cl /nologo /utf-8 /O2 /EHsc /std:c++17 /openmp /MT /LD /I"..\ae" /I"..\..\..\..\work\openfx\include" Plugin.cpp NativeEngine.cpp ..\ae\StackEngine.cpp ..\ae\LensCore.cpp ..\ae\CpuEngine.generated.cpp /Febin\BruxosdovfxNuke.ofx
if errorlevel 1 exit /b 1
copy /y ..\ae\bin\optica_cuda.dll bin\bruxos_nuke_cuda.dll >nul

copy /y ..\ae\bin\bruxos_layers_cuda.dll bin\bruxos_layers_cuda.dll >nul
