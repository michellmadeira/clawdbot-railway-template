# OpenClaw: Agentes e pesquisa em etapas (documentação oficial resumida)

Resumo com base na documentação oficial do OpenClaw para usar **agentes** e **subagentes** em um fluxo de pesquisa em etapas, passando variáveis/resultados de uma etapa para a seguinte.

---

## 1. O que é “um agente” no OpenClaw

Cada **agente** é um “cérebro” isolado com:

- **Workspace** próprio: arquivos, `AGENTS.md`, `SOUL.md`, `USER.md`, notas, regras.
- **Estado (agentDir)**: auth, modelos, config (ex.: `~/.openclaw/agents/<agentId>/agent/`).
- **Sessões**: histórico de chat e roteamento em `~/.openclaw/agents/<agentId>/sessions/`.

Skills são por agente (pasta `skills/` do workspace) ou compartilhadas (`~/.openclaw/skills`).  
Um mesmo Gateway pode rodar **um agente** (padrão, `main`) ou **vários agentes** ao mesmo tempo, cada um com seu workspace e personalidade.

- Docs: [Multi-Agent Routing](https://docs.openclaw.ai/concepts/multi-agent.md)

---

## 2. Subagentes (sub-agents)

**Subagentes** são execuções em background disparadas por um agente. Eles:

- Rodam em sessão própria: `agent::subagent:<runId>`.
- Não bloqueiam o agente que os chamou.
- Ao terminar, fazem **announce**: enviam um resumo/resultado de volta para o chat do “requester”.

### Ferramenta principal: `sessions_spawn`

O agente usa a ferramenta **`sessions_spawn`** para criar um subagente:

- **`task`** (obrigatório): texto da tarefa/instrução que o subagente vai executar (aqui entram “variáveis” da etapa anterior).
- **`label?`**: rótulo para logs/UI.
- **`model?`**, **`thinking?`**: modelo e nível de “thinking” do subagente (podem ser mais baratos que o principal).
- **`runTimeoutSeconds?`**: tempo máximo de execução (0 = sem limite).
- **`thread?`**, **`mode?`**: para sessões ligadas a thread (ex.: Discord), com `mode: "session"` para reutilizar a mesma sessão.
- **`cleanup?`**: `keep` (padrão) ou `delete` após o announce.

Retorno é **sempre não bloqueante**: `{ status: "accepted", runId, childSessionKey }`. O resultado vem depois pelo **announce** no chat (Status, Result, notas, stats).

### Anúncio (announce)

Quando o subagente termina:

- OpenClaw roda um passo de **announce** na sessão do subagente.
- A resposta desse passo é enviada para o chat de quem pediu (formato normalizado: Status, Result, Notes, stats).
- Se o assistente responder exatamente `ANNOUNCE_SKIP`, nada é postado.

Ou seja: as “variáveis descobertas” em uma etapa podem ser **o conteúdo do Result** que volta no announce; o agente principal (ou o usuário) usa esse texto como contexto para a próxima etapa.

### Subagentes aninhados (orquestrador → trabalhadores)

Com `maxSpawnDepth: 2` (em `agents.defaults.subagents`), um subagente pode criar **outros** subagentes (orquestrador → workers). Resultados sobem em cadeia: worker anuncia para o orquestrador; orquestrador anuncia para o main.

- Docs: [Sub-Agents](https://docs.openclaw.ai/tools/subagents.md)

---

## 3. Session tools (ferramentas de sessão)

Além de `sessions_spawn`, o agente tem:

- **`sessions_list`**: lista sessões (main, group, cron, subagent, etc.), com filtros opcionais.
- **`sessions_history`**: lê o histórico (transcript) de uma sessão por `sessionKey` ou `sessionId`.
- **`sessions_send`**: envia uma **mensagem** para outra sessão e pode **esperar** a resposta:
  - **`sessionKey`**: sessão de destino (ex.: a do subagente, via `childSessionKey` do spawn).
  - **`message`**: conteúdo da mensagem (aqui você coloca o prompt da etapa 2 + contexto da etapa 1).
  - **`timeoutSeconds`**: se > 0, a ferramenta espera até N segundos pela conclusão e devolve `{ runId, status, reply }`.

Assim, dá para:
- **Criar** um subagente com `sessions_spawn` (etapa 1).
- Quando o announce da etapa 1 chegar, usar **`sessions_send`** para a **mesma** sessão do subagente (usando o `childSessionKey`) com a mensagem: “Contexto da etapa 1: <resultado>. Instruções da etapa 2: <prompt>”.
- O subagente roda de novo com histórico completo (etapa 1 + nova mensagem) e devolve o resultado; você repete para etapa 3, 4, etc.

- Docs: [Session Tools](https://docs.openclaw.ai/concepts/session-tool.md)

---

## 4. Dois jeitos de encadear etapas (variáveis → etapa seguinte)

### Opção A: Um subagente por etapa, contexto no `task`

- Agente principal (orquestrador):
  1. Dispara **etapa 1** com `sessions_spawn(task: "Seu prompt da etapa 1...")`.
  2. Quando o **announce** da etapa 1 chegar no chat, o orquestrador (na próxima vez que rodar) monta o `task` da etapa 2 com o resultado:  
     `task: "Contexto da etapa 1: <texto do Result>. Instruções etapa 2: <prompt etapa 2>"`
  3. Chama `sessions_spawn` de novo para a **etapa 2** (nova sessão de subagente).
  4. Repete para etapa 3, 4, etc., sempre colocando o resultado da etapa anterior dentro do `task` da próxima.

Variáveis descobertas em uma etapa = texto que você cola no `task` da etapa seguinte.

### Opção B: Uma sessão de subagente, várias mensagens (`sessions_send`)

- Agente principal:
  1. Cria **uma** sessão de subagente com `sessions_spawn` (etapa 1), com `mode: "session"` e `thread: true` se quiser sessão persistente.
  2. Guarda o `childSessionKey` devolvido.
  3. Quando o announce da etapa 1 chegar, usa **`sessions_send`** para esse `childSessionKey` com:  
     mensagem = “Contexto da etapa 1: <resultado>. Instruções da etapa 2: <prompt>”, e `timeoutSeconds > 0` para esperar a resposta.
  4. Usa a resposta (reply) como contexto e envia de novo com `sessions_send` para a **mesma** sessão (etapa 3, 4, …).

Aqui as “variáveis” ficam no histórico da sessão do subagente e na mensagem que você envia a cada etapa.

---

## 5. Configuração relevante (`openclaw.json`)

```json5
{
  "agents": {
    "defaults": {
      "subagents": {
        "maxConcurrent": 8,
        "maxSpawnDepth": 2,        // 2 = orquestrador pode spawnar workers
        "maxChildrenPerAgent": 5,
        "runTimeoutSeconds": 900,
        "archiveAfterMinutes": 60
      }
    }
  },
  "tools": {
    "subagents": {
      "tools": {
        "deny": ["gateway", "cron"]
        // "allow": ["read", "exec", ...]  // se quiser restringir
      }
    }
  }
}
```

Por agente você pode sobrescrever (ex.: `agents.list[].subagents`).  
Subagentes **não** recebem ferramentas de sessão por padrão; com `maxSpawnDepth >= 2`, o orquestrador (depth 1) recebe `sessions_spawn`, `sessions_list`, `sessions_history`, etc., para gerenciar os workers.

---

## 6. Limitações importantes

- **Subagente não recebe** por padrão: `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` — só `AGENTS.md` e `TOOLS.md` (injetados no contexto).
- **`sessions_spawn` é sempre não bloqueante**: não há “esperar subagente terminar” dentro da mesma chamada de ferramenta; o fluxo sequencial usa o announce (e, se quiser, `sessions_send` com timeout).
- Announce é **best-effort**: se o gateway reiniciar, anúncios pendentes podem se perder.
- Profundidade máxima de spawn é 5; para pipelines lineares (etapa 1 → 2 → 3), depth 1 já basta (um orquestrador que spawna um subagente por etapa ou uma sessão que recebe várias mensagens).

---

## 7. Referências oficiais

- [Multi-Agent Routing](https://docs.openclaw.ai/concepts/multi-agent.md) — vários agentes, workspace, bindings.
- [Sub-Agents](https://docs.openclaw.ai/tools/subagents.md) — spawn, announce, thread, nesting.
- [Session Tools](https://docs.openclaw.ai/concepts/session-tool.md) — `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`.
- Índice geral: https://docs.openclaw.ai/llms.txt

---

## 8. Encaixe com sua pesquisa em etapas

- **Prompts por etapa**: cada etapa pode ser um **prompt** que você coloca no `task` do `sessions_spawn` ou no `message` do `sessions_send`.
- **Variáveis da etapa N na etapa N+1**: inclua o resultado da etapa N (texto do announce ou do `sessions_send` reply) no `task` ou no `message` da etapa N+1.
- **Skill “pesquisa-etapas”**: pode descrever esse fluxo (orquestrador spawna subagente por etapa ou usa uma sessão + `sessions_send`) e apontar para os arquivos em `references/` como os prompts de cada etapa, para o agente montar os `task`/`message` com contexto.

Assim você usa agentes específicos (subagentes) para cada etapa e mantém a estrutura “variáveis descobertas em uma etapa → usadas na etapa imediatamente seguinte” conforme a documentação oficial.
