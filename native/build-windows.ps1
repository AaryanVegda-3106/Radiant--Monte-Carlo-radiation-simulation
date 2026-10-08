$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    & g++ -O3 -std=c++11 -fopenmp -c radiant.cpp -o radiant.o
    if ($LASTEXITCODE -ne 0) { throw 'C++ compilation failed' }
    # Explicitly link the installed dynamic OpenMP runtime. This also supports
    # older MinGW installations whose -fopenmp linker spec expects libpthread.
    & g++ radiant.o -o radiant.exe -lgomp -lpsapi
    if ($LASTEXITCODE -ne 0) { throw 'OpenMP linking failed' }
    Write-Output "Built $PSScriptRoot/radiant.exe"
} finally { Pop-Location }
