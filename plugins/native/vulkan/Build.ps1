$ErrorActionPreference = 'Stop'
$taskNativeRoot = $PSScriptRoot
cmake -S $taskNativeRoot -B "$taskNativeRoot/build" -A x64
if ($LASTEXITCODE -ne 0) { throw 'Falha na configuração CMake. Instale o SDK Vulkan e o compilador C++.' }
cmake --build "$taskNativeRoot/build" --config Release
if ($LASTEXITCODE -ne 0) { throw 'Falha na compilação Vulkan.' }
New-Item -ItemType Directory -Force "$taskNativeRoot/bin" | Out-Null
Copy-Item -LiteralPath "$taskNativeRoot/build/Release/optica_vk.dll" -Destination "$taskNativeRoot/bin/optica_vk.dll" -Force
Copy-Item -LiteralPath "$taskNativeRoot/build/lens.spv" -Destination "$taskNativeRoot/bin/lens.spv" -Force
