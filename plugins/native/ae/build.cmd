@echo off
setlocal
call "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul
cd /d "%~dp0"
set "AE_SDK=..\..\..\..\work\ae-sdk"
if not exist bin mkdir bin
cl /nologo /utf-8 /EP /I"%AE_SDK%\Headers" /Tc Bruxosdovfx.r >bin\Bruxosdovfx.rr
if errorlevel 1 exit /b 1
"%AE_SDK%\Resources\PiPLtool.exe" bin\Bruxosdovfx.rr bin\Bruxosdovfx.rrc
if errorlevel 1 exit /b 1
cl /nologo /utf-8 /EP /DMSWindows /Tc bin\Bruxosdovfx.rrc >bin\Bruxosdovfx.rc
rc /nologo /fo bin\Bruxosdovfx.res bin\Bruxosdovfx.rc
if errorlevel 1 exit /b 1
cl /nologo /utf-8 /O2 /EHsc /std:c++17 /openmp /MT /D_WINDOWS /LD /I"%AE_SDK%\Headers" /I"%AE_SDK%\Headers\SP" /I"%AE_SDK%\Util" Effect.cpp LensCore.cpp NativeEngine.cpp StackEngine.cpp CpuEngine.generated.cpp bin\Bruxosdovfx.res /Febin\BruxosdovfxDesfoque.aex /link /EXPORT:EffectMain
if errorlevel 1 exit /b 1
"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.8\bin\nvcc.exe" -O3 -std=c++17 --shared --cudart static -Xcompiler /MT -gencode arch=compute_75,code=sm_75 -gencode arch=compute_80,code=sm_80 -gencode arch=compute_86,code=sm_86 -gencode arch=compute_89,code=sm_89 -gencode arch=compute_90,code=sm_90 -gencode arch=compute_90,code=compute_90 GpuEngine.generated.cu -o bin\optica_cuda.dll
if errorlevel 1 exit /b 1

"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.8\bin\nvcc.exe" -O3 -std=c++17 --shared --cudart static -Xcompiler /MT -gencode arch=compute_75,code=sm_75 -gencode arch=compute_80,code=sm_80 -gencode arch=compute_86,code=sm_86 -gencode arch=compute_89,code=sm_89 -gencode arch=compute_90,code=sm_90 -gencode arch=compute_90,code=compute_90 StackEngine.cu -o bin\bruxos_layers_cuda.dll
if errorlevel 1 exit /b 1
