# Arquitetura: repositório GitHub vs drive persistente OpenClaw

## Resumo

| Onde | O que fica | Onde editar |
|------|-------------|-------------|
| **GitHub (este repo)** | Código-fonte do agente, Docker, inicialização, plugins da máquina/VPS. | Código, Dockerfile, server, config do deploy. |
| **Drive persistente (SSH/WebDAV)** | Workspace do OpenClaw: **skills**, **agents**, docs que o agente lê, memória. | **Sempre editar aqui** as skills, agentes e tudo que o Craudião/OpenClaw usa. |

**Não adianta editar skills e agentes no GitHub** — o agente roda no servidor e lê do **drive**. O repositório não é o lugar de “documentação pro agente”.

---

## Drive persistente (workspace OpenClaw)

- **O que é:** volume persistente conectado via SSH (ou WebDAV), que pertence ao OpenClaw. No Railway é o volume montado em `/data`; no seu ambiente pode aparecer como **Z:** (WebDAV) ou pasta remota via SSH.
- **Caminho do workspace:** `OPENCLAW_WORKSPACE_DIR` (ex.: `/data/workspace` no servidor, `Z:\workspace` no Windows com drive mapeado).
- **O que fica aí:**
  - **skills/** — todas as skills que o agente usa (research-db-crud, research-fitbank-0-svc, etc.). Cada skill é uma pasta com `SKILL.md`, `references/`, `scripts/` se houver.
  - **docs/** — documentação que o Craudião/agente lê (protocolo, agente Research, conformidade, etc.).
  - **AGENTS.md**, **SOUL.md**, **USER.md**, **MEMORY.md**, etc. — arquivos de contexto do agente.
- **Regra:** **fazer edição de skills, agentes e docs do agente sempre no drive.** É esse o conteúdo que o OpenClaw carrega.

---

## Repositório GitHub (este projeto)

- **O que é:** código-fonte do template — servidor (ex.: `src/server.js`), Docker, configuração do Railway, scripts de deploy/setup, exemplos de config.
- **O que fica aí:**
  - Código da aplicação (wrapper, /setup, WebDAV, etc.).
  - Dockerfile e config de inicialização do container/VPS.
  - Plugins e integrações da “máquina virtual” / VPS.
  - Opcionalmente, em `workspace-skills/`, uma **cópia de referência** das skills (para versionar ou repor no drive), mas **não é o lugar de edição** para o agente.
- **Regra:** não usar o repo para “documentar coisa pro agente”. Skills e agentes vivem e são editados no drive.

---

## Fluxo recomendado

1. **Editar skills / agentes / docs do agente:** abrir o **drive** (Z: ou conexão SSH em `/data/workspace`) e editar em `workspace/skills/`, `workspace/docs/`, etc.
2. **Editar código do projeto:** clonar o repo, alterar código, Docker, config, e dar commit/push no GitHub.
3. **Repor conteúdo no drive:** se precisar repor skills ou docs a partir do histórico (ex.: script `restore-critical-docs-to-workspace.ps1` ou cópia manual de `workspace-skills/` para o drive), fazer a cópia **para o drive**, não depender do GitHub como fonte ativa do que o agente lê.

---

## Referência rápida de caminhos

| Conteúdo | No servidor (Railway) | No Windows (drive mapeado Z:) |
|----------|------------------------|-------------------------------|
| Workspace raiz | `/data/workspace` | `Z:\workspace` |
| Skills | `/data/workspace/skills/` | `Z:\workspace\skills\` |
| Docs do agente | `/data/workspace/docs/` | `Z:\workspace\docs\` |
