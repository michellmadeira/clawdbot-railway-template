# Instala todas as skills de workspace-skills em Z:\workspace\skills (Open Cloud).
# Executar quando o drive Z: (WebDAV) estiver conectado e funcionando.
# Uso: .\scripts\install-workspace-skills.ps1

$ErrorActionPreference = "Stop"
$src = Join-Path (Join-Path $PSScriptRoot "..") "workspace-skills"
$dest = "Z:\workspace\skills"

if (-not (Test-Path "Z:\")) {
    Write-Error "Drive Z: nao encontrado. Conecte o WebDAV (Open Cloud) e tente novamente."
}
if (-not (Test-Path $src)) {
    Write-Error "Pasta origem nao encontrada: $src"
}

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

# Pipeline Research FitBank: 1 CRUD + 10 etapas (pesquisa-etapas não faz parte do pipeline)
$folders = @(
    "research-db-crud",
    "research-fitbank-0-svc",
    "research-fitbank-1-company-info",
    "research-fitbank-1-company-profile",
    "research-fitbank-1-company-contacts",
    "research-fitbank-2-profile-dive",
    "research-fitbank-2-profile-pain",
    "research-fitbank-2-profile-uvp",
    "research-fitbank-2-profile-case",
    "research-fitbank-2-profile-email",
    "research-fitbank-2-profile-competitor"
)

foreach ($name in $folders) {
    $from = Join-Path $src $name
    $to   = Join-Path $dest $name
    if (-not (Test-Path $from)) {
        Write-Warning "Pulando (nao existe): $name"
        continue
    }
    Write-Host "Instalando: $name ..."
    if (-not (Test-Path $to)) { New-Item -ItemType Directory -Path $to -Force | Out-Null }
    $count = 0
    $basePath = (Get-Item $from).FullName.TrimEnd('\')
    Get-ChildItem $from -Recurse -File -Force | ForEach-Object {
        $full = $_.FullName
        if (-not $full.StartsWith($basePath, [StringComparison]::OrdinalIgnoreCase)) { return }
        $rel = $full.Substring($basePath.Length).TrimStart('\', '/').Replace('/', '\')
        $target = Join-Path $to $rel
        $targetDir = [System.IO.Path]::GetDirectoryName($target)
        if ($targetDir -and -not (Test-Path $targetDir)) {
            [void][System.IO.Directory]::CreateDirectory($targetDir)
        }
        $content = Get-Content $_.FullName -Raw -ErrorAction Stop
        Set-Content -Path $target -Value $content -NoNewline -ErrorAction Stop
        $count++
    }
    Write-Host "  OK ($count arquivos)"
}

Write-Host ""
Write-Host "Concluido. Skills em: $dest"
Get-ChildItem $dest -Directory -Name | ForEach-Object { Write-Host "  - $_" }
