---
name: research-fitbank-2-profile-pain
description: Worker etapa 5 (Pain Points) do pipeline Research FitBank. Dores e oportunidades a partir do dossiê. Só executa se a etapa 4 estiver concluída no banco; ao terminar, salva o resultado no banco.
---

# Research FitBank — Etapa 5 (Pain Points)

Você é o **worker da etapa 5**: **Pain Points** — análise de dores e oportunidades do prospect a partir do dossiê e da lente estratégica (SVC).

## Dependência

- **Etapa anterior no banco:** `4` (Profile Dive / Dossiê). Use também `0` (SVC) para {{SVC_CORE_PROBLEM_FOCUS}} e {{SVC_CORE_SOLUTIONS}}. Só execute se `get <run_id> 4` retornar **status = concluded**.

## Protocolo (3 fases)

### 3.1 Ler o banco

1. Obtenha o `run_id` da mensagem.
2. Execute `get <run_id> 4` (e `get <run_id> 0` para SVC). Verifique que a etapa 4 está **concluded**.
3. Se não estiver, responda que está aguardando e encerre.

### 3.2 Executar o prompt com as infos

1. Carregue o prompt em `{baseDir}/references/prompt.txt` (Research_FitBank-Fluxo_Prompts-Lead-Prompt_5-PainPoints).
2. Use o payload da etapa 4 (dossiê) e o SVC para preencher INPUT DOSSIER e CONTEXT.
3. Execute e produza strategicInsights (identifiedPainPoint, identifiedOpportunity, etc.) conforme o prompt.

### 3.3 Salvar o resultado no banco

1. Grave o resultado em arquivo e execute:
   ```bash
   node scripts/research-db.js set <run_id> 5 <arquivo>
   ```
2. Confirme `{"ok":true}`.

## Resumo

Ler banco (stage 4 e 0) → se não concluído, parar → executar Pain Points → salvar em stage `5`.
