$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$localPython = Join-Path $PSScriptRoot '.venv/Scripts/python.exe'
$sessionPython = Join-Path $PSScriptRoot '../../work/venv/Scripts/python.exe'
if (Test-Path -LiteralPath $sessionPython) {
    & $sessionPython server.py --open
} else {
    if (-not (Test-Path -LiteralPath $localPython)) {
        python -m venv .venv
        if ($LASTEXITCODE -ne 0) { throw 'Instale Python 3.13 para iniciar.' }
        & $localPython -m pip install -r requirements.txt
        if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar dependências.' }
    }
    & $localPython server.py --open
}
