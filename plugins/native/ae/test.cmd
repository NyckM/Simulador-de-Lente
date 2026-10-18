@echo off
setlocal
call "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul
cd /d "%~dp0"
set "AE_SDK=..\..\..\..\work\ae-sdk"
cl /nologo /O2 /EHsc /std:c++17 /MT /I"%AE_SDK%\Headers" /I"%AE_SDK%\Headers\SP" HostTest.cpp /Febin\HostTest.exe
if errorlevel 1 exit /b 1
set OMP_NUM_THREADS=8
bin\HostTest.exe
