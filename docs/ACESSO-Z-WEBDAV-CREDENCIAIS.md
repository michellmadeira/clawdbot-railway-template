# Acesso ao drive Z: (WebDAV) e credenciais

Este doc concentra **onde estão as credenciais**, **como desmontar/remontar o Z:** e **como resetar a senha**, para não precisar refazer o processo toda vez.

**Railway vs WebDAV (não confundir):**
- **Railway** = infraestrutura geral onde rodam os **containers** (projeto, ambiente, serviço, variáveis, deploy). Acesso a essa infra é via **Railway CLI** (`railway ssh`, `railway status`, etc.) ou Dashboard.
- **WebDAV** = forma de acessar o **“HD” do container** (volume persistente em `/data`): o app expõe a rota `/dav`; no Windows mapeamos como drive **Z:**. Ou seja: Railway é *onde* está o container; WebDAV é *como* acessamos o disco desse container.

---

## Para o agente (Cursor)

**Quando o usuário disser que “reconectou” ou que “o bagulho ficou zoado” (Z: sumiu, workspace não vê os arquivos do Railway):**

1. **Desconectar** qualquer mapeamento antigo do Z: (no terminal):
   ```powershell
   net use Z: /delete /y
   ```
2. **Conectar de novo** e abrir o Cursor com o workspace certo:
   ```powershell
   cd C:\repositorios\clawdbot-railway-template
   .\conectar-webdav-e-abrir.ps1
   ```
   O script obtém `SETUP_PASSWORD` do Railway (`railway variables --json`), mapeia o WebDAV em Z: e abre `openclaw.code-workspace` (que inclui Z: como pasta "Railway /data (WebDAV)").

**Credenciais:** não estão no repo; estão no Railway (Variables → `SETUP_PASSWORD`). O script lê na hora. Se a URL do app mudar: `$env:WEBDAV_URL = "https://.../dav"` antes de rodar o script.

**Referência:** este arquivo (`docs/ACESSO-Z-WEBDAV-CREDENCIAIS.md`) e o script `conectar-webdav-e-abrir.ps1` na raiz do repo.

---

## Quem “criou” as credenciais?

As credenciais **não ficam no repositório**. Elas são definidas por você no **Railway** (variáveis de ambiente do serviço). O script `conectar-webdav-e-abrir.ps1` só **lê** a senha do Railway na hora de mapear o drive — não a armazena em arquivo.

- **WebDAV (drive Z:)** → usa a variável **`SETUP_PASSWORD`** do Railway (mesma senha do `/setup` e do painel).
- **SSH** (se um dia for usado fora do Railway) → usaria **`SSH_USERNAME`** e **`SSH_PASSWORD`** (ou **`AUTHORIZED_KEYS`**). No Railway, o TCP Proxy **não suporta SSH**; o acesso ao “HDzinho” é via **WebDAV**, não SSH.

---

## Onde as credenciais estão

| O quê        | Onde | Variável (Railway)     |
|-------------|------|------------------------|
| Senha /setup e WebDAV | Railway → projeto → serviço → **Variables** | `SETUP_PASSWORD` |
| Usuário WebDAV       | Fixo no script                          | usuário `u` (qualquer; a senha é o que importa) |
| URL do WebDAV        | Script `conectar-webdav-e-abrir.ps1`    | `$webdavUrl` (ou env `WEBDAV_URL`, se definido) |

Nada disso fica commitado no Git. O script obtém `SETUP_PASSWORD` em tempo de execução com `railway variables --json`.

---

## Acesso ao container via Railway CLI (`railway ssh`)

Aqui falamos da **infra Railway** (rodar comandos dentro do container). O **acesso ao “HD”** (arquivos em `/data`) é pelo **WebDAV → drive Z:** (acima), não pelo SSH.

Para rodar comandos **dentro do container** (ex.: `openclaw status`, `openclaw logs`, `openclaw health`, diagnósticos), use o **Railway CLI** com `railway ssh`. Credenciais e IDs **não ficam no repositório** (cada deploy tem seu próprio projeto/ambiente/serviço).

**Se o projeto já estiver linkado** (você rodou `railway link` na pasta do repo):

```powershell
cd C:\repositorios\clawdbot-railway-template
railway ssh -- openclaw status --plain --no-color
railway ssh -- openclaw logs --limit 100 --plain --no-color
railway ssh -- openclaw health --plain --no-color
```

**Se não estiver linkado** (ex.: agente Cursor em outra máquina, CI, ou primeiro uso): use os IDs explícitos do seu projeto no Railway:

```powershell
railway ssh --project=<PROJECT_ID> --environment=<ENV_ID> --service=<SERVICE_ID> -- openclaw status --plain --no-color
```

**Onde obter os IDs:**

- **Railway Dashboard** → seu projeto → serviço (ex.: clawbot) → a URL ou **Settings** costumam exibir project/environment/service IDs.
- Numa pasta já linkada: `railway status` mostra project, environment e service em uso.

**Comandos úteis dentro do container (via `railway ssh -- ...`):**

| Objetivo | Comando |
|----------|--------|
| Status geral | `openclaw status --plain --no-color` |
| Saúde do gateway e canais | `openclaw health --plain --no-color` |
| Últimas linhas de log | `openclaw logs --limit 200 --plain --no-color` |
| Diagnóstico (doctor) | `openclaw doctor` |
| Restart só do gateway | Não use `kill`; use **`/setup` → Debug console → `gateway.restart`** (ver seção abaixo). |

**Importante:** Não commitar no Git os IDs reais (`PROJECT_ID`, `ENV_ID`, `SERVICE_ID`) nem tokens de sessão. Quem for usar pode guardar em variáveis de ambiente locais ou no Cursor (ex.: `RAILWAY_PROJECT_ID`, etc.) e montar o comando na hora. O doc **RAILWAY-SSH-CURSOR.md** descreve que o Railway não oferece SSH clássico e que o Cursor não conecta por Remote-SSH; o acesso é via `railway ssh` no terminal.

---

## Desconectar o Z: (desmontar)

No PowerShell (ou CMD), na pasta do projeto ou em qualquer lugar:

```powershell
net use Z: /delete /y
```

Se der “conexão não encontrada”, o Z: já estava desmontado.

---

## Conectar o Z: de novo (remontar e abrir Cursor)

1. **Railway CLI** instalado e logado; projeto linkado:
   ```powershell
   cd C:\repositorios\clawdbot-railway-template
   railway link
   ```

2. Rodar o script (ele desmonta Z: se existir, busca `SETUP_PASSWORD` no Railway, monta o WebDAV em Z: e abre o Cursor):
   ```powershell
   .\conectar-webdav-e-abrir.ps1
   ```

Se a URL do app mudou (outro deploy/domínio), defina a variável de ambiente antes de rodar, ou edite o script:

```powershell
$env:WEBDAV_URL = "https://SEU-DOMINIO.up.railway.app/dav"
.\conectar-webdav-e-abrir.ps1
```

(O script usa `WEBDAV_URL` se existir; senão usa o valor fixo dentro dele.)

---

## Resetar a credencial (senha do /setup e do WebDAV)

A senha é a **`SETUP_PASSWORD`** no Railway. Para “resetar”:

1. Railway → seu projeto → serviço do clawbot → **Variables**.
2. Edite **`SETUP_PASSWORD`**: coloque uma nova senha forte e salve.
3. Não é obrigatório redeploy só por trocar senha; na próxima vez que rodar `conectar-webdav-e-abrir.ps1` ele já usará a nova senha (ele lê as variáveis atuais do Railway).

Depois de trocar a senha, use a nova ao:
- abrir `/setup` no navegador,
- mapear o drive Z: (o script já pega a nova senha do Railway).

---

## Estrutura no servidor (WebDAV)

- **Rota:** `https://SEU-APP.up.railway.app/dav`
- **Autenticação:** Basic Auth — usuário qualquer (ex.: `u`), senha = **`SETUP_PASSWORD`**.
- **Raiz do WebDAV:** equivale ao diretório **`/data`** no container (onde fica o estado do OpenClaw, workspace, etc.).

O código do WebDAV está em **`src/server.js`** (middleware em `/dav`, mesma checagem de senha que `/setup`).

---

## Z: = /data em tempo real (atualizar sem deploy)

Quando o **Z: está montado**, o drive **é** o volume `/data` do servidor. O que você grava em **Z:\** já está em **/data** no container — **não precisa fazer deploy** para atualizar. Se ao copiar/gravar der “dispositivo não funciona”, desconecte o Z: (`net use Z: /delete /y`), monte de novo (`.\conectar-webdav-e-abrir.ps1`) e tente outra vez. Os ICP/GTM ficam só no HD (Z:); não há cópia no repo. Para atualizar: edite em `Z:\workspace\docs\fitbank-icp-gtm\` (svc-1, svc-2, svc-3).

---

## Restart só do gateway OpenClaw (não do container)

Para “ressuscitar” o gateway (ex.: UI mostrando “Saúde Offline” / “disconnected (1006)”), **não** reinicie o ambiente inteiro. Use **apenas** o restart do gateway:

1. **Pela UI:** abra `https://SEU-APP.up.railway.app/setup` → card **Debug console** → Command: **`gateway.restart`** → Run.
2. **Por API (dentro do container ou de um script):**  
   `POST /setup/api/console/run` com Basic Auth (usuário qualquer, senha = `SETUP_PASSWORD`) e body `{"cmd":"gateway.restart"}`.

**Não use** `kill 1` nem “restart do serviço” na Railway para isso — isso reinicia o container todo; o correto é só o gateway (processo filho do wrapper em `src/server.js`).

---

## Resumo rápido

| Ação | Comando / Onde |
|------|----------------|
| Desmontar Z: | `net use Z: /delete /y` |
| Montar Z: e abrir Cursor | `.\conectar-webdav-e-abrir.ps1` (no repo, com `railway link` feito) |
| Ver/alterar senha | Railway → Variables → `SETUP_PASSWORD` |
| URL diferente | Definir `$env:WEBDAV_URL` ou editar `$webdavUrl` no script |
| Restart do **gateway** OpenClaw | `/setup` → Debug console → `gateway.restart` (não reiniciar o container) |
| Comandos no container (logs, status, health) | `railway ssh -- openclaw …` (com projeto linkado) ou `railway ssh --project=… --environment=… --service=… -- openclaw …`; IDs no Dashboard / `railway status`, **não** no repo |

Documentado para não precisar refazer o processo; referência: `conectar-webdav-e-abrir.ps1`, `src/server.js` (WebDAV + `requireSetupAuth`) e `docs/RAILWAY-SSH-CURSOR.md`.
