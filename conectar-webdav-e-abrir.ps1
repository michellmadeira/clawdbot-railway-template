# Mapeia WebDAV (Railway /data) como drive e abre Cursor com projeto local + pasta remota no mesmo workspace.
# Requer: Railway CLI logado e projeto linkado (railway link).

$ErrorActionPreference = "Stop"
$webdavUrl = "https://clawdbot-railway-template-production-da0f.up.railway.app/dav"
$driveLetter = "Z:"
$user = "u"

# 1) Obter senha do Railway (mesma do /setup)
Write-Host "Obtendo SETUP_PASSWORD do Railway..."
$vars = railway variables --json 2>$null
if (-not $vars) { Write-Error "Falha ao obter variaveis. Rode: railway link" }
$json = $vars | ConvertFrom-Json
$pass = $json.SETUP_PASSWORD
if (-not $pass) { Write-Error "SETUP_PASSWORD nao encontrado nas variaveis do Railway." }

# 2) Desconectar drive Z: se ja existir (evita prompt)
$null = cmd /c "net use $driveLetter /delete /y 2>nul"

# 3) Mapear WebDAV (Windows usa URL HTTPS diretamente em versoes recentes)
Write-Host "Mapeando WebDAV em $driveLetter..."
net use $driveLetter $webdavUrl /user:${user} $pass /persistent:yes
if ($LASTEXITCODE -ne 0) {
  Write-Host "Se falhou: no Windows, Basic Auth para WebDAV HTTPS pode precisar de:"
  Write-Host "  Regedit: HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters"
  Write-Host "  BasicAuthLevel = 2 (DWORD)"
  Write-Host "  Depois: reiniciar servico WebClient (services.msc) ou reiniciar o PC."
  exit 1
}

# 4) Abrir Cursor com o workspace openclaw (ja inclui openclaw + clawdbot-railway-template + Z: WebDAV)
$openclawWorkspace = Join-Path (Split-Path $PSScriptRoot -Parent) "openclaw\openclaw.code-workspace"
if (-not (Test-Path $openclawWorkspace)) {
  $openclawWorkspace = Join-Path $PSScriptRoot "..\openclaw\openclaw.code-workspace"
}
if (-not (Test-Path $openclawWorkspace)) { Write-Error "Workspace nao encontrado: $openclawWorkspace" }
Write-Host "Abrindo workspace: $openclawWorkspace"

$cursorExe = "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe"
if (-not (Test-Path $cursorExe)) { Write-Error "Cursor nao encontrado: $cursorExe" }
Start-Process -FilePath $cursorExe -ArgumentList $openclawWorkspace
Write-Host "Cursor aberto (openclaw + clawdbot-railway-template + Railway /data em Z:)."
