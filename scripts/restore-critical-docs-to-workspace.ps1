# Repoe no drive (workspace) os 5 docs criticos que nao ficam no repo.
# Uso: com o drive Z: conectado, apos um clone ou para repor: .\scripts\restore-critical-docs-to-workspace.ps1 [commit]
# Se [commit] nao for passado, usa HEAD~1 (commit anterior ao que removeu os docs do repo).

param([string]$Commit = "HEAD~1")

$ErrorActionPreference = "Stop"
$dest = if ($env:OPENCLAW_WORKSPACE_DOCS) { $env:OPENCLAW_WORKSPACE_DOCS } else { "Z:\workspace\docs" }
$names = @(
    "AGENTE-RESEARCH.md",
    "CONFORMIDADE-OPENCLAW-AGENTES-E-SKILLS.md",
    "OPENCLAW-AGENTES-E-PESQUISA-ETAPAS.md",
    "RESEARCH-FITBANK-CONTEXTO-E-FLUXO.md",
    "RESEARCH-FITBANK-PIPELINE-PROTOCOLO.md"
)

if (-not (Test-Path "Z:\")) { Write-Error "Drive Z: nao encontrado. Conecte o WebDAV e tente novamente." }
if (-not (Test-Path $dest)) { [void][System.IO.Directory]::CreateDirectory($dest) }

$count = 0
foreach ($n in $names) {
    $content = git show "${Commit}:docs/$n" 2>$null
    if ($content) {
        Set-Content -Path (Join-Path $dest $n) -Value $content -NoNewline
        $count++
        Write-Host "  $n"
    }
}
Write-Host ""
Write-Host "Concluido: $count arquivos em $dest (commit $Commit)"
