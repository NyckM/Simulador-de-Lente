@echo off
setlocal
call "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul
cd /d "%~dp0\..\ae"
"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.8\bin\nvcc.exe" -O3 -std=c++17 --shared --cudart static -Xcompiler /MT -gencode arch=compute_75,code=sm_75 -gencode arch=compute_80,code=sm_80 -gencode arch=compute_86,code=sm_86 -gencode arch=compute_89,code=sm_89 -gencode arch=compute_90,code=sm_90 -gencode arch=compute_90,code=compute_90 GpuEngine.generated.cu -o bin\optica_cuda.dll
if errorlevel 1 exit /b 1
copy /y bin\optica_cuda.dll ..\photoshop\panel\engine\bruxos_ps_cuda.dll >nul
