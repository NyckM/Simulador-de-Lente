# Bruxosdovfx — compila e empacota AE / Resolve / Nuke 0.4.0 (visual do app 1.2.17).
# Uso (PowerShell, na pasta ol):   powershell -ExecutionPolicy Bypass -File work\build-plugins-1.2.17.ps1
# Requer: Visual Studio 2019 Build Tools (C++), work\ae-sdk, work\openfx\include, Python 3.
# Os DLLs CUDA (native\ae\bin\optica_cuda.dll e bruxos_layers_cuda.dll) não mudaram nesta versão e são reaproveitados.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$log = Join-Path $root 'work\plugins-040.log'
"== build-plugins-1.2.17 $(Get-Date -Format s)" | Out-File $log -Encoding utf8
function Fail($msg) { Write-Host "ERRO: $msg" -ForegroundColor Red; "ERRO: $msg" | Out-File $log -Append -Encoding utf8; Write-Host "Log completo: $log"; exit 1 }
function Step($msg) { Write-Host "`n== $msg" -ForegroundColor Cyan; "== $msg" | Out-File $log -Append -Encoding utf8 }

Step 'Verificando ferramentas'
$vc = 'C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\VC\Auxiliary\Build\vcvars64.bat'
if (-not (Test-Path $vc)) {
  $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
  if (Test-Path $vswhere) { $inst = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath; if ($inst) { $vc = Join-Path $inst 'VC\Auxiliary\Build\vcvars64.bat' } }
}
if (-not (Test-Path $vc)) { Fail 'vcvars64.bat não encontrado (instale Visual Studio Build Tools com C++).' }
foreach ($p in 'work\ae-sdk\Headers','work\openfx\include','outputs\OpticaLab\native\ae\bin\optica_cuda.dll','outputs\OpticaLab\native\ae\bin\bruxos_layers_cuda.dll','outputs\OpticaLab\native\ae\bruxos_dirt.rgba') {
  if (-not (Test-Path $p)) { Fail "Falta: $p" }
}
$py = Join-Path $root 'work\venv\Scripts\python.exe'
if (-not (Test-Path $py)) { $cmd = Get-Command py -ErrorAction SilentlyContinue; if ($cmd) { $py = 'py' } else { $py = 'python' } }
Write-Host "Python: $py  ·  VC: $vc"

# The build scripts expect the 2019 BuildTools path; point them at the one found.
$env:BRUXOS_VCVARS = $vc

Step '1/3 Teste do visual nativo (filtros, prismas, starburst, lens dirt, recuperação)'
$ae = Join-Path $root 'outputs\OpticaLab\native\ae'
$out = Join-Path $root 'work\plugins-040-hosts'; New-Item -ItemType Directory -Force $out | Out-Null
$look = Join-Path $out 'look'; New-Item -ItemType Directory -Force $look | Out-Null
$bat = @"
@echo off
call "$vc" >nul
cd /d "$ae"
cl /nologo /utf-8 /O2 /EHsc /std:c++17 /openmp /MT LookTest.cpp LensCore.cpp /Fe"$out\LookTest.exe" /Fo"$out\\" || exit /b 1
set BRUXOS_DIRT_TEXTURE=$ae\bruxos_dirt.rgba
"$out\LookTest.exe" "$look" > "$out\look-test.txt" || exit /b 1
"@
$batFile = Join-Path $out 'look.cmd'; $bat | Out-File $batFile -Encoding ascii
cmd /c $batFile *>> $log
if ($LASTEXITCODE -ne 0) { Get-Content $log -Tail 40; Fail 'LookTest falhou (veja o log acima).' }
Get-Content (Join-Path $out 'look-test.txt')

Step '2/3 Compilando AE / Nuke / Resolve nos 3 idiomas e rodando HostTest (CUDA e CPU)'
& $py 'work\build_plugins_040.py' *>> $log
if ($LASTEXITCODE -ne 0) { Get-Content $log -Tail 60; Fail 'Compilação/HostTest falhou (veja o log acima).' }
Get-Content $log -Tail 18

Step '3/3 Empacotando 0.4.0'
& $py 'work\package_plugins_040.py' *>> $log
if ($LASTEXITCODE -ne 0) { Get-Content $log -Tail 40; Fail 'Empacotamento falhou.' }
Get-Content $log -Tail 12
Write-Host "`nPronto. Zips em outputs\Versao-Atual-1.2.17\ (Bruxosdovfx-Desfoque-*-0.4.0-*.zip e Bruxos-Plugins-Nativos-0.4.0-Windows.zip)." -ForegroundColor Green
Write-Host "Log: $log"
