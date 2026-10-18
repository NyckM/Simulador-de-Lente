@echo off
setlocal
call "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul
cd /d "%~dp0"
cl /nologo /O2 /EHsc /std:c++17 /MT /I"..\..\..\..\work\openfx\include" HostTest.cpp /Febin\HostTest.exe
if errorlevel 1 exit /b 1
bin\HostTest.exe
if errorlevel 1 exit /b 1
if not exist bin\cpu mkdir bin\cpu
copy /y bin\BruxosdovfxDesfoque.ofx bin\cpu\BruxosdovfxDesfoque.ofx >nul
bin\HostTest.exe bin\cpu\BruxosdovfxDesfoque.ofx --cpu-fallback
