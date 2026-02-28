# Publica os .md da pasta docs/ do repo na pasta docs/ do workspace (drive).
# Repositorio = codigo-fonte apenas. A documentacao critica para o Craudiao (AGENTE-RESEARCH,
# RESEARCH-FITBANK-PIPELINE-PROTOCOLO, CONFORMIDADE-OPENCLAW-AGENTES-E-SKILLS, etc.) nao esta
# no repo; deve ser mantida em workspace/docs/ no drive. Este script publica o que existir em docs/.
# Uso: com o drive Z: (WebDAV) conectado: .\scripts\deploy-docs-to-workspace.ps1
# Destino: Z:\workspace\docs\ (ou OPENCLAW_WORKSPACE_DOCS se definido)

$ErrorActionPreference = "Stop"
$src = Join-Path (Join-Path $PSScriptRoot "..") "docs"
$dest = if ($env:OPENCLAW_WORKSPACE_DOCS) { $env:OPENCLAW_WORKSPACE_DOCS } else { "Z:\workspace\docs" }

if (-not (Test-Path "Z:\")) {
    Write-Error "Drive Z: nao encontrado. Conecte o WebDAV (workspace do agente) e tente novamente."
}
if (-not (Test-Path $src)) {
    Write-Error "Pasta origem nao encontrada: $src"
}

if (-not (Test-Path $dest)) {
    [void][System.IO.Directory]::CreateDirectory($dest)
}

$count = 0
Get-ChildItem $src -Filter "*.md" -File | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction Stop
    $target = Join-Path $dest $_.Name
    Set-Content -Path $target -Value $content -NoNewline -ErrorAction Stop
    $count++
    Write-Host "  $($_.Name)"
}

Write-Host ""
Write-Host "Concluido: $count arquivos em $dest"
Write-Host "A documentacao no workspace (drive) e a que o Craudiao acessa."
