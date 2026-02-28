# Acessar arquivos do Railway via Cursor (Remote-SSH)

O Railway **não fornece** credenciais SSH clássicas (host + porta + usuário) para o seu serviço. O comando `railway ssh` do CLI usa um túnel próprio (WebSocket), então o Cursor não consegue usar "Connect to Host" com ele.

**Importante:** O **TCP Proxy do Railway não suporta o protocolo SSH**. Conexões SSH através do TCP Proxy falham com `kex_exchange_identification: read: Connection reset` — o proxy encerra a conexão durante o handshake. Ou seja, **Remote-SSH do Cursor para o container via TCP Proxy não funciona** no Railway.

Para ver e editar arquivos no volume `/data`, use uma das opções abaixo.

---

## Validar se é possível servir arquivos (WebDAV / explorador)

O app expõe uma rota que **lista o conteúdo de `/data` via HTTP** (com a mesma senha do `/setup`). Se essa rota responder no Railway, dá para evoluir para WebDAV ou explorador de arquivos.

**Como validar:**

1. Faça deploy e anote a URL do app (ex.: `https://clawdbot-railway-template-production-xxx.up.railway.app`).
2. No navegador ou no terminal, chame a API com autenticação Basic (usuário qualquer; senha = `SETUP_PASSWORD` do Railway):

   **Navegador:** abra  
   `https://SEU-APP.up.railway.app/setup/api/files?path=/data`  
   e use a senha do setup quando o browser pedir.

   **Terminal (PowerShell):**
   ```powershell
   $user = "qualquer"; $pass = "SUA_SETUP_PASSWORD"
   $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("${user}:${pass}"))
   Invoke-RestMethod -Uri "https://SEU-APP.up.railway.app/setup/api/files?path=/data" -Headers @{ Authorization = "Basic $b64" }
   ```

3. Se retornar JSON com `ok: true` e `entries` (lista de nomes e pastas), **está funcionando** — a infra permite servir dados do filesystem via HTTP; um WebDAV ou explorador em cima disso é viável.

---

## Opção recomendada: Railway CLI (`railway ssh`)

Não abre a pasta no Cursor, mas permite ver e editar arquivos no terminal:

```bash
railway link   # no diretório do projeto, se ainda não linkou
railway ssh    # abre shell no container
# Dentro do container:
ls -la /data
ls -la /data/workspace
nano /data/workspace/arquivo.md   # ou vi, cat, etc.
```

Para copiar arquivos do container para sua máquina (ou vice-versa), use `railway run` com redirecionamento ou ferramentas que funcionem dentro do shell.

---

## (Opcional) SSH + TCP Proxy — limitado no Railway

O repositório inclui suporte para rodar **sshd** no container e expor a porta 22 via **TCP Proxy**. Porém, **o TCP Proxy do Railway não é compatível com SSH**: a conexão é resetada no handshake. Ou seja, **Remote-SSH do Cursor não funcionará** com esse TCP Proxy.

Se no futuro o Railway passar a suportar SSH no TCP Proxy (ou você usar outro meio de acesso, ex.: Tailscale), os passos seriam:

### 1. Habilitar SSH no deploy (variáveis de ambiente)

No **Railway** → seu projeto → serviço do clawbot → **Variables**, adicione:

| Variável        | Valor (exemplo) | Obrigatório |
|-----------------|------------------|-------------|
| `SSH_USERNAME`  | `railway`        | Sim         |
| `SSH_PASSWORD`  | Uma senha forte  | Sim*        |
| `AUTHORIZED_KEYS` | Conteúdo da sua chave pública (opcional) | Não |

\* Se usar `AUTHORIZED_KEYS`, a autenticação por senha pode ser desativada (mais seguro).

Faça **redeploy** do serviço para a imagem com SSH ser usada.

### 2. Expor a porta 22 (TCP Proxy)

No Railway → serviço do clawbot → **Settings** → **Networking**:

1. Em **TCP Proxy**, clique em **Add TCP Proxy** (ou equivalente).
2. **Internal port:** `22`.
3. Salve. O Railway vai gerar um **domínio** e uma **porta** (ex.: `clawbot.proxy.rlwy.net` e `30899`).

Anote: **Host** = domínio (sem porta), **Port** = número exibido.

### 3. Configurar o Cursor (arquivo SSH)

No seu PC, edite o arquivo de config do SSH:

- **Windows:** `C:\Users\<seu_usuario>\.ssh\config`
- **macOS/Linux:** `~/.ssh/config`

Adicione um bloco como o abaixo (ou use o arquivo `ssh-config-railway.example` deste repo como modelo). Substitua:

- `SEU_HOST_RAILWAY` pelo domínio do TCP Proxy (ex.: `clawbot.proxy.rlwy.net`)
- `PORTA_RAILWAY` pela porta exibida no Railway (ex.: `30899`)
- `SEU_USUARIO` pelo valor de `SSH_USERNAME` (ex.: `railway`)

```ssh-config
Host railway-clawbot
  HostName SEU_HOST_RAILWAY
  Port PORTA_RAILWAY
  User SEU_USUARIO
  # Se usar senha, o Cursor vai pedir na primeira conexão.
  # Se usar chave, descomente e ajuste o caminho:
  # IdentityFile "C:\Users\michel.madeira\.ssh\id_rsa"
```

Exemplo preenchido:

```ssh-config
Host railway-clawbot
  HostName mainline.proxy.rlwy.net
  Port 30899
  User railway
```

### 4. Conectar no Cursor

1. `Ctrl+Shift+P` (ou Cmd+Shift+P no Mac).
2. **Remote-SSH: Connect to Host...**
3. Escolha **railway-clawbot** (ou o nome que você usou em `Host`).
4. Nova janela abre conectada ao container.
5. **File → Open Folder** e digite: `/data`

Pronto: você verá e poderá editar os arquivos em `/data` (incluindo `/data/.openclaw`, config, sessões, etc.).

---

## Onde fica o host e a porta no Railway

- **Dashboard** do projeto → clique no **serviço** (clawbot).
- **Settings** → **Networking** → **TCP Proxy**.
- O endereço aparece como `alguma-coisa.proxy.rlwy.net:12345` → host = `alguma-coisa.proxy.rlwy.net`, porta = `12345`.

---

## Segurança

- Use senha forte ou, de preferência, `AUTHORIZED_KEYS` com chave pública.
- O TCP Proxy é público: qualquer um que descubra o host/porta pode tentar conectar. Não use usuário/senha fracos.
- Se quiser desativar SSH, remova as variáveis `SSH_*` e faça redeploy (o entrypoint volta ao comportamento sem SSH).

---

## Troubleshooting: “Preguntó el SO, elegí Linux y falló”

Si ves `kex_exchange_identification: read: Connection reset`: **es esperado**. El TCP Proxy de Railway **no soporta SSH**; la conexión se corta en el handshake. Usa `railway ssh` (ver opción recomendada arriba).

1. _(removido: usar railway ssh)_ – La primera vez el Cursor descarga e instala el “server” en el remoto; a veces hay timeout o fallo de red. Prueba de nuevo.
2. **Red del container** – El container en Railway debe poder hacer HTTPS de salida (para descargar el server del Cursor). Si hay restricciones de red, puede fallar.
3. **Alternativa sin Remote-SSH** – Usa el CLI de Railway y edita por terminal:
   ```bash
   railway ssh
   # ya dentro del container:
   cd /data
   nano /data/workspace/archivo.md   # o vi, etc.
   ```
   O desde tu máquina: `railway ssh -- cat /data/.openclaw/openclaw.json` para leer archivos.

---

## Sem SSH no container (só CLI)

Se não quiser expor SSH no serviço, continue usando no terminal:

```bash
railway ssh -- cat /data/.openclaw/openclaw.json
railway ssh -- ls -la /data
```

Isso não integra com o gestor de arquivos do Cursor, mas permite ler e editar (por exemplo com `railway ssh` e depois `nano` ou `vi`).
