$projectRoot = "c:\Users\Administrator\.vscode\cli\localtube"
$logOut = Join-Path $projectRoot "localtube-prod.log"
$logErr = Join-Path $projectRoot "localtube-prod.err.log"

$connection = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -ne $connection) {
  Stop-Process -Id $connection.OwningProcess -Force
  Start-Sleep -Seconds 1
}

foreach ($file in @($logOut, $logErr)) {
  if (Test-Path $file) {
    Remove-Item $file -Force
  }
}

Push-Location $projectRoot
cmd /c npm run build
$buildExitCode = $LASTEXITCODE
Pop-Location

if ($buildExitCode -ne 0) {
  Write-Output "LocalTube production build failed."
  exit 1
}

$startProcess = Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c", "npm run start" `
  -WorkingDirectory $projectRoot `
  -RedirectStandardOutput $logOut `
  -RedirectStandardError $logErr `
  -WindowStyle Hidden `
  -PassThru

$ready = $false
for ($attempt = 0; $attempt -lt 20; $attempt++) {
  Start-Sleep -Seconds 1
  try {
    $status = (Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000).StatusCode
    Write-Output "LocalTube production started successfully. Status=$status"
    Write-Output "Open http://127.0.0.1:3000"
    $ready = $true
    break
  } catch {
    if ($startProcess.HasExited) {
      break
    }
  }
}

if (-not $ready) {
  Write-Output "LocalTube production did not start cleanly."
  if (Test-Path $logErr) {
    Write-Output "--- stderr ---"
    Get-Content -Path $logErr -Tail 60
  }
  if (Test-Path $logOut) {
    Write-Output "--- stdout ---"
    Get-Content -Path $logOut -Tail 60
  }
}
