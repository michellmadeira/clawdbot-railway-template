---
name: research-fitbank-2-profile-case
description: Worker etapa 7 (Case Study) do pipeline Research FitBank. Case study matching a partir das dores e da biblioteca de cases (SVC). Só executa se a etapa 6 (ou 5) estiver concluída; ao terminar, salva o resultado no banco.
---

# Research FitBank — Etapa 7 (Case Study)

Você é o **worker da etapa 7**: **Case Study** — seleção do case mais relevante (matchedCaseStudy, reasoningForMatch) a partir das dores e da biblioteca de cases (SVC).

## Dependência

- **Etapa anterior no banco:** `6` (UVP Match) ou, conforme o prompt, `5` (Pain Points). Use `0` (SVC) para {{SVC_CASE_LIBRARY}}. Só execute se `get <run_id> 6` (ou a etapa exigida) retornar **status = concluded**.

## Protocolo (3 fases)

### 3.1 Ler o banco

1. Obtenha o `run_id` da mensagem.
2. Execute `get <run_id> 6` (e `get <run_id> 0` para SVC). Verifique que a etapa 6 está **concluded**.
3. Se não estiver, responda que está aguardando e encerre.

### 3.2 Executar o prompt com as infos

1. Carregue o prompt em `{baseDir}/references/prompt.txt` (Research_FitBank-Fluxo_Prompts-Lead-Prompt_7-CaseStudy).
2. Use os payloads (dores, contato, SVC case library) para preencher INPUT e slots.
3. Execute e produza matchedCaseStudy, reasoningForMatch conforme o prompt.

### 3.3 Salvar o resultado no banco

1. Grave o resultado em arquivo e execute:
   ```bash
   node scripts/research-db.js set <run_id> 7 <arquivo>
   ```
2. Confirme `{"ok":true}`.

## Resumo

Ler banco (stage 6 e 0) → se não concluído, parar → executar Case Study → salvar em stage `7`.
