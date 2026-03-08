---
name: research-db-crud
description: Lê e grava estado do pipeline de research (run_id, etapa, payload, status) em banco. Use quando for executar ou orquestrar etapas do pipeline Research FitBank; sempre que um worker precisar puxar a etapa anterior ou salvar o resultado da própria etapa.
---

# Research DB — CRUD do pipeline

Esta skill permite ao agente **ler** e **gravar** o estado das etapas do pipeline de research em um banco de dados. As credenciais vêm de variáveis de ambiente do container (ex.: Railway).

## Variáveis de ambiente

- **`RESEARCH_DB_URL`** — URL de conexão Postgres (ex.: `postgresql://user:pass@host:5432/dbname`). Requer `pg` instalado no ambiente (`npm install pg`).
- **ou `RESEARCH_DB_PATH`** — Diretório para persistência em JSON (um arquivo `{run_id}.json` por run). Não precisa de banco; útil para testes ou ambiente simples.

O agente **não** deve pedir credenciais ao usuário; use sempre o script que lê essas variáveis.

## Tabelas que compõem o processo

### Tabela do script get/set/list (`research_runs`)

O script `research-db.js` usa a tabela **`research_runs`** (criada automaticamente se usar Postgres): uma linha por (run_id, stage) para handoff entre etapas do pipeline. Chave primária: `(run_id, stage)`.

**Por que `run_id`:** o handoff entre etapas exige um identificador único por “pesquisa” (uma execução do pipeline). Sem ele não dá para ter várias runs em paralelo nem saber de qual run ler/gravar. O padrão da skill (get/set/list por identificador + stage) segue o formato usual de OpenClaw skills (procedimento + script); o nome `run_id` é convenção nossa para esse identificador. Não é o `runId` do OpenClaw (que identifica uma execução de sub-agente em `sessions_spawn`). Pode ser UUID, slug ou o domínio. Com **RESEARCH_DB_PATH** (JSON), cada run vira arquivo `{run_id}.json`.

### Documentos ICP/GTM no workspace (HDzinho)

Os documentos de posicionamento FitBank por SVC ficam **apenas no HDzinho** em **`workspace/docs/fitbank-icp-gtm/`** (no container = `/data/workspace/docs/fitbank-icp-gtm/`). Pastas: `svc-1-bancos-fintechs`, `svc-2-erps`, `svc-3-mercado-capitais` (cada uma com arquivos `ICP_GTM-FitBank-*-YYYYMMDD.md`). Não há cópia no repo; editar direto no workspace. Ver `docs/FITBANK-ICP-GTM-HDINHO.md`.

### Tabelas de redação / SVC / leads (mesmo banco Postgres)

No mesmo banco (RESEARCH_DB_URL) existem as tabelas abaixo, consultadas/atualizadas pelo processo de redação e pelo pipeline. Schema obtido por consulta ao `information_schema` (para re-mapear: `RESEARCH_DB_URL=... node scripts/inspect-tables.js`).

| Tabela | Uso |
|--------|-----|
| **`sdria_redacao_svc_20260130`** | Service Context (SVC): um registro por SVC gerado (JSON em `svc`). |
| **`sdria_redacao_leads_20260130`** | Leads/empresas e etapas do funil (company, contatos, deepdive, pain, uvpmatch, casestudy, emailbuilder, competitors e respectivos `*_status`). Referência a empresa em `company_id`. |
| **`sdria_redacao_20251014`** | Run principal por domínio: profile, search, info (e `*_status`), mais `id_svc` e `transpose_status`. |

---

#### `sdria_redacao_svc_20260130`

| Coluna | Tipo | Null | Default | Descrição |
|--------|------|------|---------|-----------|
| id | bigint | NO | nextval(…) | PK. |
| svc | jsonb | NO | — | Payload do Service Context (JSON). |
| createdate | timestamp with time zone | YES | now() | |
| updatedate | timestamp with time zone | YES | now() | |

**Inserir SVC (só coluna `svc`; id e datas por default/trigger):** use o script `scripts/insert-svc.js`. Exemplo: `RESEARCH_DB_URL=... node scripts/insert-svc.js scripts/svc-payload-fitbank-erpbank.json` ou, com variáveis do Railway: `railway run node workspace-skills/research-db-crud/scripts/insert-svc.js workspace-skills/research-db-crud/scripts/svc-payload-fitbank-erpbank.json`. O script aceita um JSON (objeto ou array de um elemento) e faz `INSERT INTO sdria_redacao_svc_20260130 (svc) VALUES ($1) RETURNING id, createdate`.

---

#### Tabela 3 — `sdria_redacao_leads_20260130`

Leads/empresas e etapas do funil. Estrutura para escrita (transpose e demais etapas):

| Coluna | Tipo | Null | Default |
|--------|------|------|---------|
| id | integer | NO | nextval(…) |
| createdate | timestamp without time zone | YES | now() |
| updatedate | timestamp without time zone | YES | now() |
| company_name | text | YES | |
| description | text | YES | |
| primary_industry | text | YES | |
| size | text | YES | |
| country | text | YES | |
| domain | text | YES | |
| company_linkedin_url | text | YES | |
| unique_selling_proposition_usp | text | YES | |
| target_company_headcount | text | YES | |
| pain_points_they_solve_for_customers | text | YES | |
| industry_they_target | text | YES | |
| targeted_job_titles | text | YES | |
| first_name | text | YES | |
| last_name | text | YES | |
| title | text | YES | |
| linkedin_url | text | YES | |
| deepdive | jsonb | YES | |
| deepdive_status | text | YES | |
| painpoints | jsonb | YES | |
| painpoints_status | text | YES | |
| uvpmatch | jsonb | YES | |
| uvpmatch_status | text | YES | |
| casestudy | jsonb | YES | |
| casestudy_status | text | YES | |
| emailbuilder | jsonb | YES | |
| emailbuilder_status | text | YES | |
| competitors | jsonb | YES | |
| competitors_status | text | YES | |
| reasoning | text | YES | |
| company_id | integer | YES | (FK para empresa/run) |

---

#### Tabela 2 — `sdria_redacao_20251014`

Run principal por domínio (profile, search, info e status). Estrutura para leitura/escrita:

| Coluna | Tipo | Null | Default |
|--------|------|------|---------|
| id | integer | NO | nextval(…) |
| dominio | text | YES | |
| createddate | timestamp without time zone | YES | now() |
| updatedate | timestamp without time zone | YES | now() |
| profile | jsonb | YES | |
| profile_status | text | YES | |
| search | jsonb | YES | |
| search_status | text | YES | |
| info | jsonb | YES | |
| info_status | text | YES | |
| transpose_status | text | YES | |
| id_svc | text | YES | (referência ao SVC) |

---

### Transpose: mapeamento do campo `search` → Tabela 3 (`sdria_redacao_leads_20260130`)

O campo **`search`** da Tabela 2 é um JSON (lista de leads). Ao gravar na Tabela 3, use este mapeamento de campos (referência do fluxo n8n):

| Coluna na Tabela 3 | Origem no JSON / contexto |
|--------------------|---------------------------|
| first_name | item do lead (contact) |
| last_name | item do lead (contact) |
| title | item do lead (contact) |
| linkedin_url | item do lead (contact) |
| company_name | info.data.name |
| description | info.data.description |
| domain | info.data.domain |
| country | info.data.country |
| size | info.data.size |
| primary_industry | info.data.primary_industry |
| company_linkedin_url | info.data.linkedin_url |
| unique_selling_proposition_usp | profile.data['Unique Selling Proposition (USP)'] (n8n: campo USP do Profile; não confundir com Key Pain Points) |
| industry_they_target | profile.data['Primary Target Industry'] |
| targeted_job_titles | profile.data['Primary Decision-Maker (Job Title)'] |
| target_company_headcount | profile.data['Target Company Headcount'] |
| pain_points_they_solve_for_customers | profile.data['Key Pain Points Solved'] |
| reasoning | item do lead |
| company_id | id da linha na Tabela 2 (sdria_redacao_20251014) da empresa/run |

Cada item da lista em `search` gera uma linha na Tabela 3. Os campos de empresa (info.data) e perfil (profile.data) podem vir da mesma run ou da linha correspondente na Tabela 2.

## Schema (tabela `research_runs`)

| Coluna     | Tipo      | Descrição |
|------------|-----------|-----------|
| run_id     | string    | Identificador da run (ex.: UUID ou slug). |
| stage      | string    | Etapa: `input`, `0`, `1`, …, `9` (ver mapeamento abaixo). |
| payload    | text      | Conteúdo (JSON ou texto) produzido ou consumido pela etapa. |
| status     | string    | `pending` \| `concluded` \| `failed` |
| updated_at | timestamp | Última atualização. |

**Estágios:** `input` = entrada inicial da run (ex.: dominio + documento vertical). `0` = SVC, `1` = Company Info, `2` = Company Profile, `3` = Company Contacts, `4` = Profile Dive, `5` = Pain, `6` = UVP, `7` = Case, `8` = Email, `9` = Competitor.

## Script (uso via `exec`)

O script fica em `{baseDir}/scripts/research-db.js`. Chamar com Node (ambiente tem `node` e variáveis já configuradas).

### 1) Ler etapa anterior (obrigatório antes de executar)

```bash
node scripts/research-db.js get <run_id> <stage>
```

- **run_id:** identificador da run (ex.: passado pelo orquestrador).
- **stage:** etapa a ler (`input`, `0`, `1`, …, `9`).

**Saída (stdout):** JSON em uma linha, por exemplo:

```json
{"payload":"...","status":"concluded","updated_at":"2026-02-28T12:00:00.000Z"}
```

Se a etapa não existir ou não estiver concluída: `status` diferente de `concluded` ou `{"error":"..."}`. **Só prosseguir com a execução do prompt se `status === "concluded"`.**

### 2) Gravar resultado da etapa (após executar o prompt)

```bash
node scripts/research-db.js set <run_id> <stage> <arquivo_com_payload>
```

- **run_id:** mesmo da run.
- **stage:** número/ID da **sua** etapa (`0`–`9`).
- **arquivo_com_payload:** caminho do arquivo cujo conteúdo é o payload a salvar (texto ou JSON). O script lê o conteúdo do arquivo e grava na linha (run_id, stage) com `status=concluded`.

Alternativa (payload via stdin):

```bash
cat resultado.json | node scripts/research-db.js set <run_id> <stage>
```

### 3) Listar estado da run (orquestrador / validação)

```bash
node scripts/research-db.js list <run_id>
```

**Saída:** JSON com lista de etapas e status, por exemplo:

```json
{"run_id":"abc-123","stages":[{"stage":"input","status":"concluded","updated_at":"..."},{"stage":"0","status":"concluded","updated_at":"..."}]}
```

Use para validar quais etapas já estão concluídas antes de disparar a próxima.

## Protocolo do worker (cada etapa)

1. **Ler banco:** `get <run_id> <stage_anterior>`. Se `stage` for `0`, stage anterior é `input`; se for `1`, é `0`; etc.
2. **Decidir:** Se a saída tiver `status !== "concluded"` ou der erro, **não executar**; responder que está aguardando a etapa anterior.
3. **Executar:** Rodar o prompt da sua etapa usando o `payload` lido (e, se aplicável, outros payloads já gravados, ex.: SVC).
4. **Salvar:** Gravar o resultado com `set <run_id> <sua_stage> <arquivo_resultado>`.

O orquestrador usa `list <run_id>` para ver o que já está concluído e disparar a próxima etapa quando fizer sentido.

---

## Workers (etapas 1–9 com injeção de contexto)

Os scripts do motor de workers (worker-lib.js, worker-company-info.js, worker-stage-2.js … worker-stage-9.js) e a documentação (PROTOCOLO_WORKERS.md, BLUEPRINT_WORKERS.md, DEPENDENCIAS_WORKERS.md, resposta/auditoria) ficam no **workspace do OpenClaw** (drive Z: ou `/data/workspace`), em `workspace/skills/research-db-crud/scripts/` e `workspace/docs/`. Este repositório não mantém cópia desses arquivos para evitar redundância; a versão canônica é a do drive.
