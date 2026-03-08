# Research FitBank — Plano: Metaprompt e prompts-base por SVC

## Objetivo

Com base num **SVC específico** (já gerado pela etapa 0 e persistido em `sdria_redacao_svc_20260130`), **customizar os placeholders {{SVC_*}}** dos prompts das **etapas 3, 4, 5, 6 e 7** do fluxo de research, de forma **determinística e fora do tempo de execução** das etapas.

Referência do processo: **Research_FitBank-Fluxo_Prompts-MetaPrompt_Verticais-20260209-v2-20260210** (arquivo no drive em `workspace/docs/` ou na skill dedicada).

---

## Contexto

- **Etapas 3–7** usam prompts que contêm placeholders `{{SVC_*}}` (ex.: `{{SVC_PROVIDER_IDENTITY}}`, `{{SVC_CASE_LIBRARY}}`).
- O **metaprompt** define um processo em duas fases:
  - **FASE 0:** extrair/materializar `service_context` a partir do material de dores (já coberto pela etapa 0 – SVC).
  - **FASE 1:** para cada prompt 3, 4, 5, 6 e 7, **substituir apenas** os `{{SVC_*}}` pelos valores do `service_context` vigente, sem alterar mais nada (idempotente).
- O usuário não quer que essa substituição seja feita **em tempo de execução** de cada etapa; quer **prompts-base já renderizados por SVC**, consumidos pelas skills na hora de executar.

---

## Proposta de execução

### 1. Skill “Gerar prompts-base por SVC” (metaprompt render)

- **Nome sugerido:** `research-fitbank-metaprompt-render` (ou `gerar-prompts-base-por-svc`).
- **Quando executar:** sempre que houver um **SVC novo ou atualizado** (ex.: após rodar a etapa 0, ou quando o humano alterar o documento de proposta de valor da vertical). **Não** em toda run de pesquisa.
- **Entradas:**
  - `service_context` (JSON) — lido da tabela `sdria_redacao_svc_20260130` (por `id` ou pelo registro mais recente da vertical) ou recebido como output da etapa 0.
  - Os **5 prompts-base com placeholders** (prompts 3, 4, 5, 6 e 7) — arquivos em `references/` da própria skill ou em pasta compartilhada (ex.: `workspace/prompts-base/`).
- **Processo:** seguir o MetaPrompt v2-20260210 (FASE 1): para cada prompt 3, 4, 5, 6 e 7, substituir **somente** cada `{{SVC_*}}` pelo valor correspondente do `service_context`. Sem truncar, sem alterar texto fora dos slots. Idempotente.
- **Saída:** 5 arquivos de prompt **já renderizados** (sem placeholders), gravados em local estável, por SVC/vertical:
  - Ex.: `workspace/prompts-rendered/<vertical_id>/prompt_3.txt`, `prompt_4.txt`, …, `prompt_7.txt`
  - Ou por `id_svc`: `workspace/prompts-rendered/<id_svc>/prompt_3.txt`, …
- **Convenção:** usar um identificador estável (ex.: `vertical_id` ou `id` do registro em `sdria_redacao_svc_20260130`) para o subdiretório, de forma que as etapas 3–7 saibam qual conjunto de prompts usar.

### 2. Skills das etapas 3, 4, 5, 6 e 7 consumindo prompts renderizados

- **Comportamento desejado:** na execução, a skill da etapa **não** monta o prompt em tempo de execução substituindo `{{SVC_*}}`. Ela **lê o prompt já renderizado** para o SVC da run.
- **Onde está o prompt:**
  - Se existir `prompts-rendered/<id_svc_ou_vertical>/prompt_X.txt` → usar esse arquivo.
  - Se não existir (ex.: primeira vez, ou SVC sem render prévio), a skill pode **avisar** que é preciso rodar antes a skill “Gerar prompts-base por SVC” para esse SVC/vertical, e opcionalmente usar o prompt-base com placeholders apenas como fallback (não recomendado para produção).
- **Identificação do SVC da run:** a run (por domínio/empresa) deve ter associado um `id_svc` (ou equivalente) que aponta para o registro em `sdria_redacao_svc_20260130`; com isso, as skills 3–7 sabem qual pasta `prompts-rendered/<id>` usar.

### 3. Onde guardar o MetaPrompt e os prompts-base

- **MetaPrompt (instrução):** manter o arquivo **Research_FitBank-Fluxo_Prompts-MetaPrompt_Verticais-20260209-v2-20260210** no **drive** (ex.: `Z:\workspace\docs\` ou `references/` da skill `research-fitbank-metaprompt-render`), para o agente/skill seguir o processo.
- **Prompts-base 3–7 (com placeholders):** manter na skill de metaprompt ou em `workspace/prompts-base/` no drive, como fonte para a renderização. Assim não se mistura com os prompts já renderizados.

### 4. Resumo do fluxo

1. **Etapa 0 (SVC)** gera o JSON `service_context` e grava em `sdria_redacao_svc_20260130.svc`.
2. **Skill “Gerar prompts-base por SVC”** é acionada (manual ou após etapa 0): lê o SVC, lê os 5 prompts-base (3–7), aplica o MetaPrompt (FASE 1), grava os 5 arquivos em `prompts-rendered/<id_svc_ou_vertical>/`.
3. **Etapas 3, 4, 5, 6 e 7**, ao executar: leem o prompt correspondente em `prompts-rendered/<id_svc_ou_vertical>/prompt_X.txt` (já com SVC injetado), não em tempo de execução.

---

## Implementado

- [x] Skill **research-fitbank-metaprompt-render** criada no drive; gera e armazena o set em **`workspace/prompts-rendered/<id_svc>/`** (referência ao SVC: `id_svc` = `id` do registro em `sdria_redacao_svc_20260130`).
- [x] Convenção: pasta `prompts-rendered/<id_svc>/` e `prompts-base/` no drive; cada SVC tem seu set (prompt_3.txt … prompt_7.txt).
- [x] Skills 3–7 ajustadas para obter `id_svc` da run (`sdria_redacao_20251014.id_svc`) e carregar o prompt em `prompts-rendered/<id_svc>/prompt_X.txt`; se não existir, avisar para rodar a skill de gerador de set.
- [x] MetaPrompt v2-20260210 no drive em `workspace/docs/`; skill referencia `workspace/docs/` e `references/README.md`.
