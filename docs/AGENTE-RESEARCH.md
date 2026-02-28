# Agente Research — Orquestrador do pipeline em segundo plano

O **agente Research** é um agente OpenClaw dedicado a orquestrar o pipeline Research FitBank em segundo plano. O **Craudião** usa esse agente quando o usuário pede uma pesquisa: a conversa pode ser roteada para o Research (multi-agent) ou o Craudião delega a tarefa a ele. O Research tem acesso às **11 skills** (research-db-crud + as 10 etapas) e segue o protocolo de 3 fases.

A estrutura de agentes e skills segue a documentação oficial OpenClaw. Ver **[CONFORMIDADE-OPENCLAW-AGENTES-E-SKILLS.md](CONFORMIDADE-OPENCLAW-AGENTES-E-SKILLS.md)** para evidências e referências (Multi-Agent, Agent Workspace, Skills).

---

## 1. Papel do agente Research

- **Orquestrar** o pipeline: verificar estado da run no banco (`list <run_id>`), aplicar a skill da próxima etapa quando a anterior estiver concluded, repetir até a etapa 9.
- **Ter** as 11 skills no próprio workspace (`skills/`), incluindo **research-db-crud** para ler/gravar no banco.
- **Rodar** em segundo plano: o Craudião não precisa executar as etapas; o Research é o “cérebro” da pesquisa.

---

## 2. Estrutura do workspace do Research

O agente Research precisa de um **workspace próprio** (ex.: `/data/workspace-research` no Railway ou `Z:\workspace-research` no WebDAV). Estrutura mínima:

```
workspace-research/
├── AGENTS.md          # Instruções do agente (papel, uso das skills, protocolo)
├── skills/            # As 11 skills (research-db-crud + research-fitbank-0-svc … research-fitbank-2-profile-competitor)
│   ├── research-db-crud/
│   ├── research-fitbank-0-svc/
│   ├── …
│   └── research-fitbank-2-profile-competitor/
└── (opcional) SOUL.md, USER.md, etc.
```

- **AGENTS.md:** define o papel de orquestrador, que deve usar a skill research-db-crud para `list`/`get`/`set` e as skills de etapa 0–9 na ordem, seguindo o protocolo (ler banco → executar prompt → salvar banco). Pode referenciar `docs/RESEARCH-FITBANK-PIPELINE-PROTOCOLO.md` para detalhes.
- **skills/:** as mesmas 11 pastas do repositório `workspace-skills/`. Copiar do repo (ou rodar o script de instalação apontando para o workspace do Research).

---

## 3. Configuração no OpenClaw (multi-agent)

No `openclaw.json` (em geral em `/data/.openclaw/openclaw.json` ou `~/.openclaw/openclaw.json`), adicione o agente Research em **`agents.list`**:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "name": "Craudião",
        "workspace": "/data/workspace"
      },
      {
        "id": "research",
        "name": "Research",
        "workspace": "/data/workspace-research"
      }
    ]
  }
}
```

Ajuste os caminhos conforme o ambiente (Railway: `/data/workspace` e `/data/workspace-research`; local: paths absolutos ou `~/.openclaw/workspace` e `~/.openclaw/workspace-research`).

- **Roteamento:** para o Craudião “usar” o Research, é preciso que pedidos de pesquisa sejam atendidos pelo agente `research`. Isso pode ser feito por **binding** (ex.: canal ou comando que já aponta para o agente research), por **escolha do usuário** na UI, ou por **delegação** (Craudião envia a conversa/tarefa ao agente Research, se a API/ferramenta do Gateway permitir). Ver documentação do OpenClaw: [Multi-Agent Routing](https://docs.openclaw.ai/concepts/multi-agent).

---

## 4. Como o Craudião usa o Research

- **Opção A (roteamento):** usuário escolhe “Research” ou envia em um canal ligado ao agente Research. O Research recebe a mensagem (ex.: “Rodar pesquisa para domínio X”) e orquestra: grava `input`, depois aplica as skills 0–9 em sequência.
- **Opção B (delegação):** Craudião, ao receber “quero uma pesquisa para X”, delega ao agente Research (por exemplo via ferramenta de sessão ou roteamento interno). O Research orquestra em segundo plano e o resultado volta ao usuário (por announce, ou por sessão, conforme a implementação).

Em ambos os casos, o Research tem a **estrutura dele** (workspace, AGENTS.md, skills) e o **acesso ao banco** (variáveis RESEARCH_DB_URL ou RESEARCH_DB_PATH no ambiente do Gateway).

---

## 5. Resumo

| Item | Descrição |
|------|------------|
| **Agente** | Research (id: `research`) |
| **Workspace** | `/data/workspace-research` (ou equivalente) |
| **Skills** | 11: research-db-crud + research-fitbank-0-svc … research-fitbank-2-profile-competitor |
| **Papel** | Orquestrar o pipeline em segundo plano (list → próxima etapa → aplicar skill → repetir) |
| **Craudião** | Usa o Research roteando ou delegando pedidos de pesquisa |

O template do workspace do agente Research (AGENTS.md e instruções para copiar skills) fica em **`agent-research/`** no repositório; a configuração de exemplo do `openclaw.json` está neste doc e em `agent-research/openclaw.json.example`.

---

## 6. Inputs novos para o Craudião conferir

Para o Craudião validar a configuração e o fluxo, estes são os **inputs principais** do agente Research (podem ser usados como referência na conversa):

| Arquivo / contexto | Conteúdo |
|--------------------|----------|
| **agent-research/AGENTS.md** | Instruções do Research: papel, skills, fluxo de orquestração (receber pedido → list → aplicar próxima etapa → repetir). |
| **docs/RESEARCH-FITBANK-PIPELINE-PROTOCOLO.md** | Protocolo em 3 fases, tabela de etapas, como o Research controla o fluxo. |
| **docs/CONFORMIDADE-OPENCLAW-AGENTES-E-SKILLS.md** | Verificação de que agentes e skills seguem a doc oficial OpenClaw (com links). |
| **workspace-skills/** (11 skills) | research-db-crud + research-fitbank-0-svc … research-fitbank-2-profile-competitor; cada uma com SKILL.md e references/ ou scripts/. |

O Craudião pode ser solicitado a “conferir os inputs novos do agente Research” com base nesses arquivos.
