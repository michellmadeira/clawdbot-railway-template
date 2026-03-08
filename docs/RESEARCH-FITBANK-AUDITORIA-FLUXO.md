# Research FitBank — Auditoria do fluxo (4 capacidades)

Auditoria do fluxo em relação às quatro capacidades: **incluir/ler domínio**, **incluir/ler SVC**, **incluir/ler set de prompts** e **execução de pesquisa** (a partir do set de prompts).

---

## 1. Incluir/ler domínio para execução do fluxo

**Capacidade:** O fluxo deve permitir **incluir** novos domínios e **ler** domínios existentes para decidir sobre o que executar a pesquisa.

| Aspecto | Evidência |
|--------|-----------|
| **Incluir** | Skill **research-db-crud** (drive: `workspace/skills/research-db-crud/SKILL.md`): instrução para INSERT na tabela **`sdria_redacao_20251014`** preenchendo **apenas** o campo **`dominio`** (ex.: `empresa.com`). Demais campos (id, datas, profile, search, info, status, id_svc, etc.) são default/trigger ou preenchidos pelas etapas. |
| **Ler** | Mesma tabela **`sdria_redacao_20251014`**: consulta por `id` ou `dominio` para obter a run (domínio) a processar. O agente/orquestrador usa a skill para listar ou buscar registros e escolher sobre qual domínio rodar o fluxo. |
| **Para execução do fluxo** | O domínio é a unidade de run: cada linha em `sdria_redacao_20251014` representa um domínio; as etapas 1.1–1.3 (Company Info, Profile, Contacts) leem/gravam nessa tabela por run (id ou dominio). |

**Conclusão:** ✅ **Capaz.** Incluir via INSERT com `dominio`; ler via SELECT na mesma tabela; execução do fluxo usa essa run (domínio) como referência.

---

## 2. Incluir/ler SVC para execução do fluxo (a partir de prompt de geração de SVC)

**Capacidade:** O fluxo deve permitir **incluir** (gerar e gravar) SVC e **ler** SVC existente, usando o **prompt de geração de SVC**, para uso na execução.

| Aspecto | Evidência |
|--------|-----------|
| **Prompt de geração de SVC** | Skill **research-fitbank-0-svc** (drive: `workspace/skills/research-fitbank-0-svc/`): carrega o prompt em **`references/prompt.txt`** (Research_FitBank-Fluxo_Prompts-Company-Prompt_0-SVC-20260210-v1). Chamada Gemini conforme `references/chamada-gemini.md`. |
| **Incluir (gerar e gravar)** | Etapa 0 grava o JSON `service_context` na tabela **`sdria_redacao_svc_20260130`**, campo **`svc`**. Inserção apenas com `svc`; `id`, `createdate`, `updatedate` por trigger. Documentado em **research-fitbank-0-svc** → seção 3.3. |
| **Ler** | Consulta à tabela **`sdria_redacao_svc_20260130`** por `id` (ou registro mais recente) para obter o campo **`svc`** (JSON). Usado pelo gerador de set de prompts (item 3) e indiretamente pelas etapas 3–7 via set já renderizado. A run em `sdria_redacao_20251014` tem **`id_svc`** que referencia o `id` do SVC. |
| **Para execução do fluxo** | O SVC gravado (por id) é usado para: (a) gerar o set de prompts em `prompts-rendered/<id_svc>/`; (b) associar a run ao SVC via `id_svc` em `sdria_redacao_20251014`, de modo que a execução use o set correto. |

**Conclusão:** ✅ **Capaz.** Incluir via skill 0-SVC (prompt em `references/prompt.txt`); ler via tabela `sdria_redacao_svc_20260130`; execução usa SVC através do set de prompts e do `id_svc` da run.

---

## 3. Incluir/ler set de prompts para execução do fluxo (a partir de metaprompt de geração de set de prompts)

**Capacidade:** O fluxo deve permitir **incluir** (gerar e gravar) o set de prompts por SVC e **ler** esse set, usando o **metaprompt de geração de set de prompts**, para a execução usar sempre o set correspondente ao SVC.

| Aspecto | Evidência |
|--------|-----------|
| **Metaprompt de geração** | Skill **research-fitbank-metaprompt-render** (drive: `workspace/skills/research-fitbank-metaprompt-render/`): base no arquivo **Research_FitBank-Fluxo_Prompts-MetaPrompt_Verticais-20260209-v2-20260210** em `references/` e em `workspace/docs/`. Aplica FASE 1 (substituir `{{SVC_*}}` pelo `service_context`). Prompts-base em **`workspace/prompts-base/`** (prompt_3.txt … prompt_7.txt) preenchidos. |
| **Incluir (gerar e gravar)** | A skill lê o SVC da tabela `sdria_redacao_svc_20260130`, lê os 5 prompts-base, aplica o metaprompt e grava em **`workspace/prompts-rendered/<id_svc>/`** os arquivos **prompt_3.txt** … **prompt_7.txt**. Cada SVC tem seu próprio subdiretório (ex.: id_svc=1 → `prompts-rendered/1/`). |
| **Ler** | As etapas 3–7 (skills company-contacts, profile-dive, profile-pain, profile-uvp, profile-case) obtêm **`id_svc`** da run (tabela `sdria_redacao_20251014.id_svc`) e carregam o prompt em **`workspace/prompts-rendered/<id_svc>/prompt_X.txt`**. Se o set não existir, a skill orienta a rodar antes **research-fitbank-metaprompt-render**. |
| **Para execução do fluxo** | A execução de pesquisa (item 4) usa **somente** o set da pasta `prompts-rendered/<id_svc>/` para as etapas 3–7, garantindo coerência (ex.: SVC ERP → set de prompts de ERP). |

**Conclusão:** ✅ **Capaz.** Incluir via skill metaprompt-render (metaprompt em `references/Research_FitBank-Fluxo_Prompts-MetaPrompt_Verticais-20260209-v2-20260210.txt`); ler via pasta `prompts-rendered/<id_svc>/`; execução usa esse set (etapas 3–7 carregam `prompt_X.txt` dessa pasta).

---

## 4. Execução de pesquisa (a partir do set de prompts)

**Capacidade:** A **execução de pesquisa** deve rodar a partir do **set de prompts** (e do domínio/SVC já incluídos/lidos), lendo e gravando no banco.

| Aspecto | Evidência |
|--------|-----------|
| **Set de prompts** | Etapas **3–7** usam o prompt em **`workspace/prompts-rendered/<id_svc>/prompt_X.txt`** (X = 3, 4, 5, 6, 7). O `id_svc` vem de **`sdria_redacao_20251014.id_svc`** da run. Etapas 1.1 (Company Info), 1.2 (Profile), 1.3 (Contacts) usam prompts próprios em `references/prompt.txt` (sem SVC na pasta; Company Info e Profile não usam slots SVC no mesmo formato). |
| **Leitura do banco** | Cada skill segue o protocolo: (3.1) obter run_id e, para 3–7, **id_svc**; ler estado das etapas anteriores (research_runs e/ou tabelas `sdria_redacao_20251014`, `sdria_redacao_leads_20260130`) via **research-db-crud** (get/list). |
| **Escrita no banco** | Resultados gravados em **`sdria_redacao_20251014`** (profile, search, info, status) e em **`sdria_redacao_leads_20260130`** (deepdive, pain, uvpmatch, casestudy, emailbuilder, competitors, etc.), além de **research_runs** para handoff. Transpose: leitura de `search` (JSON) em `sdria_redacao_20251014` e inserção em `sdria_redacao_leads_20260130` (mapeamento na research-db-crud). |
| **Skills** | **1.1** research-fitbank-1-company-info, **1.2** research-fitbank-1-company-profile, **1.3** research-fitbank-1-company-contacts, **2.4** research-fitbank-2-profile-dive, **2.5** research-fitbank-2-profile-pain, **2.6** research-fitbank-2-profile-uvp, **2.7** research-fitbank-2-profile-case, **2.8** research-fitbank-2-profile-email, **2.9** research-fitbank-2-profile-competitor. Etapas 3–7 documentadas para carregar prompt de `prompts-rendered/<id_svc>/`. |

**Conclusão:** ✅ **Capaz.** Execução de pesquisa usa o set de prompts (pasta por id_svc para etapas 3–7), lê e grava em `sdria_redacao_20251014` e `sdria_redacao_leads_20260130`, com orquestração e handoff via research_runs e research-db-crud.

---

## Resumo da auditoria

| # | Capacidade | Incluir | Ler | Para execução do fluxo | Status |
|---|------------|---------|-----|-------------------------|--------|
| 1 | Domínio | INSERT em `sdria_redacao_20251014` com `dominio` (research-db-crud) | SELECT na mesma tabela por id/dominio | Run por domínio; etapas 1.1–1.3 leem/gravam aqui | ✅ |
| 2 | SVC | Etapa 0 (prompt SVC) grava em `sdria_redacao_svc_20260130.svc` | SELECT por id (ou último) na tabela SVC | id_svc na run; geração do set; coerência set↔SVC | ✅ |
| 3 | Set de prompts | Metaprompt-render grava em `prompts-rendered/<id_svc>/` | Etapas 3–7 leem `prompts-rendered/<id_svc>/prompt_X.txt` | Execução usa somente esse set para 3–7 | ✅ |
| 4 | Execução de pesquisa | — | Domínio + SVC + set (já incluídos/lidos) | Etapas 1.1–2.9 com prompts (set para 3–7); leitura/gravação no banco | ✅ |

O fluxo está **capaz** de: (1) incluir/ler domínio, (2) incluir/ler SVC a partir do prompt de geração de SVC, (3) incluir/ler set de prompts a partir do metaprompt de geração de set de prompts, e (4) executar a pesquisa a partir do set de prompts e do banco.

---

## Referências

- Fluxo e funções: **docs/RESEARCH-FITBANK-FLUXO-E-FUNCOES.md**
- Tabelas e domínio: **workspace/skills/research-db-crud/SKILL.md**
- SVC: **workspace/skills/research-fitbank-0-svc/SKILL.md**
- Set de prompts: **workspace/skills/research-fitbank-metaprompt-render/SKILL.md**
- Prompts-base: **workspace/prompts-base/** (prompt_3.txt … prompt_7.txt)
- Set renderizado: **workspace/prompts-rendered/<id_svc>/**
- Sincronizar prompts-base: **scripts/sync-prompts-base-to-drive.mjs**
