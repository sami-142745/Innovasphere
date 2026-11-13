param(
    [string]$MySqlImage = 'mysql:8.0',
    [int]$MySqlPort = 3307,
    [int]$BackendPort = 8099,
    [int]$FrontendPort = 5174
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot 'backend-spring'
$frontendDir = Join-Path $repoRoot 'frontend'
$containerName = 'innovasphere-e2e-mysql'
$backend = $null

function Wait-Http([string]$Url, [int]$TimeoutSeconds, [System.Diagnostics.Process]$Process) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if ($Process -and $Process.HasExited) {
            throw "Backend exited before becoming healthy (exit code $($Process.ExitCode))."
        }
        $ready = $false
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            $ready = $response.StatusCode -ge 200 -and $response.StatusCode -lt 300
        } catch {
            $ready = $false
        }
        if ($ready) {
            return
        }
        Start-Sleep -Seconds 2
    }
    throw "Timed out waiting for $Url."
}

function Wait-MySql([int]$TimeoutSeconds) {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        & cmd /c "docker exec $containerName mysqladmin ping -h 127.0.0.1 -ue2e -pe2e-pass --silent >nul 2>&1"
        if ($LASTEXITCODE -eq 0) {
            return
        }
        Start-Sleep -Seconds 2
    }
    throw 'Timed out waiting for the temporary MySQL container.'
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker is required for the real-API browser suite.'
}

$busy = Get-NetTCPConnection -LocalPort $BackendPort -State Listen -ErrorAction SilentlyContinue
if ($busy) {
    throw "Port $BackendPort is already in use; stop the process or pass -BackendPort."
}

try {
    & cmd /c "docker rm -f $containerName >nul 2>&1"
    $runCommand = "docker run --rm -d --name $containerName -e MYSQL_DATABASE=innovasphere_e2e " +
        "-e MYSQL_USER=e2e -e MYSQL_PASSWORD=e2e-pass -e MYSQL_RANDOM_ROOT_PASSWORD=yes " +
        "-p ${MySqlPort}:3306 $MySqlImage"
    & cmd /c "$runCommand >nul 2>&1"
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not start the temporary MySQL container.'
    }
    Wait-MySql 90

    $env:DB_HOST = '127.0.0.1'
    $env:DB_PORT = "$MySqlPort"
    $env:DB_NAME = 'innovasphere_e2e'
    $env:DB_USERNAME = 'e2e'
    $env:DB_PASSWORD = 'e2e-pass'
    $env:PORT = "$BackendPort"
    $env:JWT_SECRET = 'aW5ub3Zhc3BoZXJlLWUyZS1zZWNyZXQta2V5LTAwMTIzNDU2Nzg5YWJjZGVmMDEyMzQ1Njc4OQ=='
    $env:SEED_ENABLED = 'false'
    $env:APP_CORS_ALLOWED_ORIGINS = "http://localhost:$FrontendPort,http://127.0.0.1:$FrontendPort"

    $backendLog = Join-Path $env:TEMP 'innovasphere-e2e-backend.log'
    $backendErr = Join-Path $env:TEMP 'innovasphere-e2e-backend.err.log'
    Remove-Item $backendLog, $backendErr -ErrorAction SilentlyContinue

    $backend = Start-Process -FilePath (Join-Path $backendDir 'mvnw.cmd') `
        -ArgumentList 'spring-boot:run' `
        -WorkingDirectory $backendDir `
        -RedirectStandardOutput $backendLog `
        -RedirectStandardError $backendErr `
        -PassThru -WindowStyle Hidden

    Wait-Http "http://127.0.0.1:$BackendPort/api/health" 150 $backend

    Push-Location $frontendDir
    try {
        $env:E2E_FRONTEND_PORT = "$FrontendPort"
        $env:E2E_BACKEND_PORT = "$BackendPort"
        & npx playwright test -c playwright.integration.config.ts
        if ($LASTEXITCODE -ne 0) {
            throw "Playwright real-API suite failed with exit code $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }
} catch {
    if (Test-Path (Join-Path $env:TEMP 'innovasphere-e2e-backend.log')) {
        Write-Host '--- backend log (tail) ---'
        Get-Content (Join-Path $env:TEMP 'innovasphere-e2e-backend.log') -Tail 60
    }
    throw
} finally {
    if ($backend -and -not $backend.HasExited) {
        & cmd /c "taskkill /PID $($backend.Id) /T /F >nul 2>&1"
    }
    & cmd /c "docker rm -f $containerName >nul 2>&1"
}
