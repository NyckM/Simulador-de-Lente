@echo off
setlocal
call "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul
cd /d "%~dp0"
cl /nologo /O2 /EHsc /std:c++17 /openmp /MT StackTest.cpp LensCore.cpp StackEngine.cpp NativeEngine.cpp CpuEngine.generated.cpp /Febin\StackTest.exe
if errorlevel 1 exit /b 1
set OMP_NUM_THREADS=8
bin\StackTest.exe
