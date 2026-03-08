# Research FitBank — Fluxo de trabalho e funções

Resumo do fluxo e das quatro capacidades do pipeline, com tabelas, pastas e skills envolvidas.

---

## Visão geral (4 capacidades)

| # | Capacidade | Onde | Status |
|---|------------|------|--------|
| 1 | **Adicionar novos domínios** | Tabela `sdria_redacao_20251014` | Documentado na skill **research-db-crud**; agente usa a skill para INSERT apenas com `dominio`. |
| 2 | **Gerar um SVC** | Tabela `sdria_redacao_svc_20260130` | Skill **research-fitbank-0-svc**; grava JSON em `svc` (id/dates por trigger). |
| 3 | **Gerador de set de prompts** | Pasta por SVC: `workspace/prompts-rendered/<id_svc>/` | Skill **research-fitbank-metaprompt-render**; gera e armazena os 5 prompts (3–7) já customizados com o SVC, **organizados em pasta com referência ao SVC** (`id_svc` = id do registro em `sdria_redacao_svc_20260130`). |
| 4 | **Executar cada etapa a partir do set de prompts** | Set na pasta + banco | **Agente de execução** usa sempre o **set correspondente ao SVC da run** (ex.: SVC de ERP → set de prompts de ERP em `prompts-rendered/<id_svc>/`), garantindo coerência. Etapas 3–7 leem o prompt em `prompts-rendered/<id_svc>/prompt_X.txt`; leem/gravam `sdria_redacao_20251014` e `sdria_redacao_leads_20260130`. |

---

## 1. Adicionar novos domínios

- **Tabela:** `sdria_redacao_20251014`
- **Função:** Inserir um novo domínio para ser processado pelo pipeline.
- **Quem faz:** Agente (Craudião/Research) usando a skill **research-db-crud**.
- **Regra:** Na inserção, preencher **apenas** o campo **`dominio`** (ex.: `empresa.com`). Os campos `id`, `createddate`, `updatedate` e os de processamento (`profile`, `search`, `info`, `*_status`, `transpose_status`, `id_svc`) são default/trigger ou preenchidos pelas etapas.
- **Referência:** `research-db-crud` → seção "Tabela 2" e "Instrução para escrita de domínio".

---

## 2. Gerar um SVC

- **Tabela:** `sdria_redacao_svc_20260130`
- **Função:** Produzir o Service Context (JSON) a partir do documento de proposta de valor da vertical e persistir no banco.
- **Quem faz:** Skill **research-fitbank-0-svc** (acionada esporadicamente, quando o contexto de serviço muda).
- **Entrada:** Material de dores / documento da vertical (ex.: via `research_runs` ou fornecido pelo usuário).
- **Saída:** JSON com `service_context` gravado no campo **`svc`**. Os campos `id`, `createdate`, `updatedate` são preenchidos por trigger; na inserção informar só **svc**.
- **Uso posterior:** O `id` (ou um `vertical_id`) desse registro será usado para (3) gerar o set de prompts e (4) escolher qual set usar nas etapas 3–7.

---

## 3. Gerador de set de prompts (armazena organizado por SVC)

- **Pasta:** `workspace/prompts-rendered/<id_svc>/` no drive. **Referência ao SVC:** `id_svc` = `id` (PK) do registro em `sdria_redacao_svc_20260130` (ex.: SVC ERP com id 1 → pasta `prompts-rendered/1/`).
- **Função:** A partir de um SVC já gravado, gerar/atualizar os **5 prompts** das etapas **3, 4, 5, 6 e 7** com os placeholders `{{SVC_*}}` já substituídos e **armazená-los nessa pasta**, para o agente de execução usar o set correto (SVC ERP → set ERP).
- **Quem faz:** Skill **research-fitbank-metaprompt-render** (no drive: `workspace/skills/research-fitbank-metaprompt-render/`).
- **Entrada:** `service_context` lido de `sdria_redacao_svc_20260130` (por `id`) + os 5 prompts-base (em `workspace/prompts-base/` ou nas skills das etapas 3–7).
- **Saída:** 5 arquivos em `prompts-rendered/<id_svc>/`: `prompt_3.txt` … `prompt_7.txt` (sem placeholders `{{SVC_*}}`).
- **Quando rodar:** Sempre que houver SVC novo ou atualizado. Não em toda run de pesquisa.

---

## 4. Executar cada etapa a partir do set de prompts (coerência SVC → set)

- **Função:** O **agente de execução** roda cada etapa **sempre usando o set de prompts que corresponde ao SVC da run**: ex.: SVC de ERP executa o set de prompts de ERP (coerência). Para isso, a run tem `id_svc` em `sdria_redacao_20251014`; as etapas 3–7 leem o prompt em **`workspace/prompts-rendered/<id_svc>/prompt_X.txt`** e leem/gravam no banco.
- **Tabelas:**
  - **`sdria_redacao_20251014`:** run por domínio (profile, search, info, status, **`id_svc`**). O campo **`id_svc`** indica qual set usar; etapas 1.1–1.3 leem/gravam aqui (e `research_runs`).
  - **`sdria_redacao_leads_20260130`:** leads e resultados por lead (deepdive, pain, uvpmatch, casestudy, emailbuilder, competitors, etc.), ligados por `company_id`.
- **Regra de coerência:** Para cada run, obter **`id_svc`** (tabela `sdria_redacao_20251014`). Etapas **3–7** usam **somente** os prompts em `prompts-rendered/<id_svc>/`. Se o set não existir, avisar para rodar antes a skill **research-fitbank-metaprompt-render** para esse SVC.
- **Skills:** 1.1–1.3 (Company Info, Profile, Contacts) e 2.4–2.9 (Deepdive, Pain, UVP, Case, Email, Competitor); etapas 3–7 já estão ajustadas para carregar o prompt da pasta por `id_svc`.
- **Transpose:** Após Contacts (search), ler `search` (JSON) de `sdria_redacao_20251014` e inserir leads em `sdria_redacao_leads_20260130` (mapeamento na **research-db-crud**).

---

## Ordem do fluxo (em linhas gerais)

1. **Adicionar domínio** → INSERT em `sdria_redacao_20251014` com `dominio`.
2. **Gerar SVC** (quando necessário) → Etapa 0 grava em `sdria_redacao_svc_20260130.svc`.
3. **Gerar/atualizar set de prompts** → Skill metaprompt lê o SVC, gera os 5 arquivos em `prompts-rendered/<id_svc>/`.
4. **Associar run ao SVC** → Na run por domínio, preencher `id_svc` em `sdria_redacao_20251014` (ou por convenção) para que as etapas saibam qual set usar.
5. **Executar etapas** → Cada etapa (1.1–1.3, 2.4–2.9) lê o que precisar do banco, usa o prompt correto (do set da pasta para 3–7) e grava o resultado nas tabelas acima.

---

## O que está implementado hoje

- **1. Adicionar domínios:** Documentado na skill **research-db-crud**; agente usa a skill para INSERT com `dominio`.
- **2. Gerar SVC:** Skill **research-fitbank-0-svc** implementada; grava em `sdria_redacao_svc_20260130`.
- **3. Gerador de set de prompts:** Skill **research-fitbank-metaprompt-render** criada no drive; gera e armazena o set em **`workspace/prompts-rendered/<id_svc>/`** (referência ao SVC). Prompts-base em `workspace/prompts-base/` ou nas skills 3–7.
- **4. Executar etapas:** Skills 1.1–1.3 e 2.4–2.9 leem/gravam no banco. Etapas **3–7** estão ajustadas para obter **`id_svc`** da run e carregar o prompt em **`prompts-rendered/<id_svc>/prompt_X.txt`**, garantindo que o agente de execução use sempre o set do SVC correspondente (coerência).

---

## Referências

- **Auditoria do fluxo (4 capacidades):** **docs/RESEARCH-FITBANK-AUDITORIA-FLUXO.md** — incluir/ler domínio, SVC, set de prompts; execução de pesquisa.
- Tabelas e escrita de domínio: **research-db-crud** (no drive: `workspace/skills/research-db-crud/SKILL.md`).
- Plano do metaprompt e pasta de prompts: **docs/RESEARCH-FITBANK-PLANO-METAPROMPT.md**.
- Versões dos prompts: **docs/RESEARCH-FITBANK-PROMPTS-VERSOES.md**.
