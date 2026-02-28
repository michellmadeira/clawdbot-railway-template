# Abre a pasta /data do Railway no Cursor via Remote-SSH
# Duplo clique ou: powershell -ExecutionPolicy Bypass -File abrir-railway-remoto.ps1

$cursor = "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe"
$uri = "vscode-remote://ssh-remote+railway-clawbot/data"

if (-not (Test-Path $cursor)) {
    Write-Host "Cursor nao encontrado em: $cursor"
    exit 1
}

Start-Process -FilePath $cursor -ArgumentList "--folder-uri", $uri
Write-Host "Abrindo Cursor em railway-clawbot /data ... Use a senha SSH_PASSWORD do Railway se pedir."
