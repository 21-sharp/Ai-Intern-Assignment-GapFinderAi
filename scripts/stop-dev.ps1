$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $projectRoot '.gapfinder-dev.json'
$stopFile = Join-Path $projectRoot '.gapfinder-stop.json'

if (-not (Test-Path -LiteralPath $pidFile)) {
    Write-Host 'No GapFinder instance started by run.bat is recorded.'
    Write-Host 'If port 3000 is occupied, close the app that owns it from its own window.'
    exit 0
}

try {
    $record = Get-Content -LiteralPath $pidFile -Raw | ConvertFrom-Json
    $launcherId = [int]$record.launcherPid
    $nextId = [int]$record.nextPid
    $expectedRoot = [IO.Path]::GetFullPath($projectRoot).TrimEnd('\')
    if ([IO.Path]::GetFullPath([string]$record.projectRoot).TrimEnd('\') -ne $expectedRoot) {
        throw 'The PID file does not belong to this project folder.'
    }

    $expectedScript = [IO.Path]::GetFullPath((Join-Path $projectRoot 'scripts\dev-server.cjs'))
    $launcher = Get-CimInstance Win32_Process -Filter "ProcessId = $launcherId" -ErrorAction SilentlyContinue
    if (-not $launcher -or $launcher.CommandLine -notlike "*$expectedScript*") {
        Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
        Write-Host 'The recorded GapFinder launcher is no longer running.'
        exit 0
    }

    $expectedNext = [IO.Path]::GetFullPath((Join-Path $projectRoot 'node_modules\next\dist\bin\next'))
    $next = Get-CimInstance Win32_Process -Filter "ProcessId = $nextId" -ErrorAction SilentlyContinue
    if ($next -and $next.CommandLine -notlike "*$expectedNext*") {
        throw 'The recorded Next.js process does not match this project. Refusing to stop it.'
    }

    Set-Content -LiteralPath $stopFile -Value (@{ launcherPid = $launcherId } | ConvertTo-Json -Compress)
    if ($next) {
        & taskkill.exe /PID $nextId /T /F | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Windows could not stop the Next.js process tree.' }
    }

    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 100
        $launcher = Get-CimInstance Win32_Process -Filter "ProcessId = $launcherId" -ErrorAction SilentlyContinue
        if (-not $launcher) { break }
    }
    if ($launcher) {
        & taskkill.exe /PID $launcherId /T /F | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Windows could not stop the GapFinder launcher.' }
    }

    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $stopFile -Force -ErrorAction SilentlyContinue
    Write-Host 'GapFinder AI stopped.'
} catch {
    Write-Error "Could not safely stop GapFinder AI: $($_.Exception.Message)"
    exit 1
}
