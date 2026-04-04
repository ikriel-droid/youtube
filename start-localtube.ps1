$projectRoot = "c:\Users\Administrator\.vscode\cli\localtube"
$productionStarter = Join-Path $projectRoot "start-localtube-production.ps1"

if (-not (Test-Path $productionStarter)) {
  Write-Error "Production starter not found: $productionStarter"
  exit 1
}

Write-Output "Starting LocalTube with the stable production runner."
Write-Output "If you want hot reload for editing, run: cmd /c npm run dev"

powershell -ExecutionPolicy Bypass -File $productionStarter
