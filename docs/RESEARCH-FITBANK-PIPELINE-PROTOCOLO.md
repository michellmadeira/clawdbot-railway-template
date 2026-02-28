# Research FitBank — Protocolo em 3 fases

Implementação do pipeline com **banco como handoff**: cada worker lê a etapa anterior no banco, só executa se estiver concluída, e salva o próprio resultado. O **agente Research** orquestra o fluxo em segundo plano; o **Craudião** usa esse agente quando o usuário pede uma pesquisa (roteamento ou delegação).

---

## 0. Arquitetura: Craudião + agente Research

- **Craudião** (agente principal): atende o usuário e **usa o agente Research** para pesquisas. Quando o usuário pede uma pesquisa, a conversa é roteada para o Research ou o Craudião delega a tarefa a ele.
- **Agente Research:** orquestrador dedicado, com workspace próprio e as **11 skills** (research-db-crud + as 10 etapas). Ele valida pelo banco (`list <run_id>`), aplica a skill da próxima etapa quando a anterior está concluded e repete até a etapa 9. Roda em segundo plano.
- **Skills** definem *o que fazer*: procedimento (3 fases) + prompt por etapa. As 11 skills ficam no workspace do **Research** (e podem também estar no Craudião se quiser). Ver [AGENTE-RESEARCH.md](AGENTE-RESEARCH.md) para estrutura e configuração do agente Research. A conformidade com a documentação oficial OpenClaw (agentes e skills) está verificada em [CONFORMIDADE-OPENCLAW-AGENTES-E-SKILLS.md](CONFORMIDADE-OPENCLAW-AGENTES-E-SKILLS.md) com evidências e links.
- **pesquisa-etapas** não faz parte deste pipeline. Para o Research FitBank usam-se apenas as 11 skills no agente Research.

### Quando faria sentido usar (sub-)agentes?

- **Vários agentes (multi-agent, outro workspace/persona):** quando você quiser **outro “cérebro”** com workspace próprio, SOUL/AGENTS diferentes, ferramentas diferentes (ex.: um agente “Pesquisador SVC” só para etapa 0, com skills e memória dedicadas). O OpenClaw suporta vários agentes no mesmo Gateway; o roteamento pode ser por binding ou pelo usuário. Ver [OPENCLAW-AGENTES-E-PESQUISA-ETAPAS.md](OPENCLAW-AGENTES-E-PESQUISA-ETAPAS.md) e [Multi-Agent Routing](https://docs.openclaw.ai/concepts/multi-agent.md).
- **Sub-agentes (`sessions_spawn`):** quando quiser **execução em background**, não bloqueante: o Craudião dispara uma tarefa (ex.: “rodar etapa 2 para run_id X”) e segue; o resultado volta por **announce**. Útil para paralelismo ou para não travar o chat. O `runId` que o OpenClaw devolve aí é da *execução* do sub-agente, não o nosso `run_id` do pipeline. Ver [Sub-Agents](https://docs.openclaw.ai/tools/subagents.md), [Session Tools](https://docs.openclaw.ai/concepts/session-tool.md).

Hoje o pipeline usa **banco como handoff** (get/set/list por `run_id`); o Craudião pode aplicar as skills em sequência na mesma sessão ou, se quiser, usar `sessions_spawn` para uma etapa e usar o nosso `run_id` dentro do `task` para o sub-agente saber qual run atender.

---

## 1. Variáveis de ambiente (container Railway)

| Variável | Uso |
|----------|-----|
| **`RESEARCH_DB_URL`** | URL Postgres (ex.: `postgresql://user:pass@host:5432/dbname`). Definir nas variáveis de ambiente do serviço no Railway. Requer `pg` instalado no ambiente onde o script roda (`npm install pg`). |
| **ou `RESEARCH_DB_PATH`** | Diretório para persistência em JSON (um arquivo `{run_id}.json` por run). Não precisa de banco. |

Credenciais ficam **apenas** como variáveis de ambiente no container; nunca commitar a URL real (ver `.env.example` no repositório).

---

## 2. Schema do banco e tabelas do processo

A skill **research-db-crud** documenta em detalhe todas as tabelas (ver `workspace-skills/research-db-crud/SKILL.md`): a tabela **`research_runs`** (usada pelo script get/set/list) e as tabelas de redação/SVC/leads **`sdria_redacao_svc_20260130`**, **`sdria_redacao_leads_20260130`**, **`sdria_redacao_20251014`** (campos e tipos descritos na skill). Resumo da tabela do script:

### Tabela `research_runs`

| Coluna     | Tipo      | Descrição |
|------------|-----------|-----------|
| run_id     | string    | Identificador **desta** run do pipeline (uma pesquisa: input → etapas 0–9). Convenção nossa; não é o `runId` do OpenClaw (que identifica uma execução de sub-agente em `sessions_spawn`). Pode ser UUID, slug ou ID do domínio. |
| stage      | string    | `input`, `0`, `1`, …, `9`. |
| payload    | text      | Conteúdo (JSON ou texto) da etapa. |
| status     | string    | `pending` \| `concluded` \| `failed` |
| updated_at | timestamp | Última atualização. |

**Estágios:** `input` = entrada inicial (dominio + documento vertical). `0` = SVC, `1` = Company Info, `2` = Company Profile, `3` = Company Contacts, `4` = Profile Dive, `5` = Pain, `6` = UVP, `7` = Case, `8` = Email, `9` = Competitor.

---

## 3. Protocolo de cada worker (3 fases)

Todo worker de etapa N segue:

### 3.1 Ler o banco

- Obter `run_id` da mensagem (orquestrador ou usuário).
- Chamar o script da skill **research-db-crud**: `get <run_id> <stage_anterior>`.
- **Stage anterior:** etapa 0 → `input`; etapa 1 → `0`; etapa 2 → `1`; …; etapa 9 → depende (Competitors usa `1`).
- Se a saída não tiver **status = concluded** (ou houver `error`), **não executar**; responder que está aguardando a etapa anterior e encerrar.

### 3.2 Executar o prompt com as infos

- Carregar o prompt da etapa em `{baseDir}/references/prompt.txt` (conteúdo copiado do DFT-RESEARCH_FITBANK-FLUXO_PROMPTS).
- Usar o **payload** (e outros payloads já lidos, ex.: SVC) para preencher placeholders e slots do prompt.
- Executar a pesquisa / tarefa do prompt e gerar o resultado completo.

### 3.3 Salvar o resultado no banco

- Gravar o resultado em arquivo no workspace.
- Chamar `set <run_id> <sua_stage> <arquivo>` via script da skill research-db-crud.
- Confirmar que a saída contém `{"ok":true}`. Só então a etapa está **concluded** para o próximo worker.

---

## 4. Skills criadas

### 4.1 CRUD no banco

| Skill | Descrição |
|------|-----------|
| **research-db-crud** | Lê e grava estado do pipeline (get/set/list por run_id e stage). Script em `scripts/research-db.js`; credenciais via env. |

### 4.2 Skills por etapa (10 etapas)

| # | Skill | Etapa | Depende de (stage anterior) |
|---|-------|--------|-----------------------------|
| 0 | research-fitbank-0-svc | SVC | `input` |
| 1 | research-fitbank-1-company-info | Company Info | `input` (e opcionalmente `0`) |
| 2 | research-fitbank-1-company-profile | Company Profile | `1` |
| 3 | research-fitbank-1-company-contacts | Company Contacts | `2` (e 1, 0 conforme prompt) |
| 4 | research-fitbank-2-profile-dive | Profile Dive | `3` |
| 5 | research-fitbank-2-profile-pain | Pain Points | `4` |
| 6 | research-fitbank-2-profile-uvp | UVP Match | `5` |
| 7 | research-fitbank-2-profile-case | Case Study | `6` |
| 8 | research-fitbank-2-profile-email | Email Builder | `7` |
| 9 | research-fitbank-2-profile-competitor | Competitors | `1` |

Cada uma está em `workspace-skills/<nome>/` com `SKILL.md` (protocolo em 3 fases) e `references/prompt.txt` (placeholder; substituir pelo prompt real do DFT-RESEARCH_FITBANK-FLUXO_PROMPTS).

---

## 5. Agente Research controla o fluxo (Craudião usa ele)

O **agente Research** (workspace próprio, 11 skills) é quem orquestra. O Craudião usa esse agente (roteamento ou delegação) quando o usuário pede pesquisa.

1. **Criar a run e a entrada inicial**  
   O Research (ou o usuário via script) grava no banco o payload da etapa `input` (ex.: `{ "dominio": "exemplo.com", "documento_vertical": "..." }`) com `status = concluded` para a run_id escolhida. Isso pode ser feito manualmente via script (`set <run_id> input <arquivo>`) ou por um fluxo de “nova pesquisa” que você definir.

2. **Verificar o que já está concluído**  
   O Research usa a skill research-db-crud:
   ```bash
   node scripts/research-db.js list <run_id>
   ```
   A saída lista cada stage e seu `status`. Só aplicar a etapa N se a etapa anterior (conforme a tabela acima) estiver com `status = concluded`.

3. **Aplicar a etapa N**
   O Research aplica a skill da etapa N (research-fitbank-0-svc, …, research-fitbank-2-profile-competitor) para esse `run_id`, seguindo o protocolo (ler banco → executar prompt → salvar). Não é mais o Craudião quem aplica; é o Research. Exemplo de pedido ao Research (no chat ou via API):
   - “Executar etapa N para run_id &lt;run_id&gt;” ou
   - “Usar skill research-fitbank-&lt;N&gt;-... para run_id &lt;run_id&gt;”.

4. **Repetir até a etapa 9**  
   O Research chama `list <run_id>` quando precisar e aplica a próxima etapa quando a anterior aparecer como concluded. Ver [AGENTE-RESEARCH.md](AGENTE-RESEARCH.md) para estrutura do agente e configuração no `openclaw.json`.

---

## 6. Resumo do fluxo

- **Craudião** usa o **agente Research** (roteamento ou delegação) quando o usuário pede pesquisa.
- **Input:** Research (ou usuário) grava `input` com status concluded (dominio + doc vertical).
- **Etapa 0:** Research aplica a skill 0 (lê `input`, gera SVC, salva em `0`).
- **Etapa 1–9:** Research aplica a skill correspondente (lê etapa anterior, executa prompt, salva no stage).
- **Validação:** o Research usa `list <run_id>` para ver quais etapas estão concluded e aplica a próxima.

Nenhuma etapa executa sem que a etapa da qual depende esteja **concluded** no banco; o agente Research garante a ordem validando pelo banco. Estrutura do agente Research: [AGENTE-RESEARCH.md](AGENTE-RESEARCH.md) e pasta `agent-research/` no repositório.
