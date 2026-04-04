$projectRoot = "c:\Users\Administrator\.vscode\cli\localtube"
$seedPath = Join-Path $projectRoot "data\library.seed.json"
$dataPath = Join-Path $projectRoot "data\library.json"

if (-not (Test-Path $seedPath)) {
  Write-Error "Seed file not found: $seedPath"
  exit 1
}

Copy-Item -LiteralPath $seedPath -Destination $dataPath -Force
Write-Output "LocalTube library reset from seed."
Write-Output "Source: $seedPath"
Write-Output "Target: $dataPath"
