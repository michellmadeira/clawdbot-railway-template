---
name: research-fitbank-1-company-profile
description: Worker etapa 2 (Company Profile) do pipeline Research FitBank. Modelo de negócio a partir do firmográfico. Só executa se a etapa 1 estiver concluída no banco; ao terminar, salva o resultado no banco.
---

# Research FitBank — Etapa 2 (Company Profile)

Você é o **worker da etapa 2**: **Company Profile** — modelo de negócio (USP, dores, decisor, etc.) a partir do firmográfico.

## Dependência

- **Etapa anterior no banco:** `1` (Company Info — firmográfico). Só execute se `get <run_id> 1` retornar **status = concluded**.

## Protocolo (3 fases)

### 3.1 Ler o banco

1. Obtenha o `run_id` da mensagem.
2. Execute `node scripts/research-db.js get <run_id> 1`. Se `status !== "concluded"` ou houver erro, responda que está aguardando a etapa 1 e encerre.

### 3.2 Executar o prompt com as infos

1. Carregue o prompt em `{baseDir}/references/prompt.txt` (Research_FitBank-Fluxo_Prompts-Company-Prompt_2-CustomerProfile).
2. Use o **payload** da etapa 1 (firmográfico) como entrada do prompt.
3. Execute e produza o output (modelo de negócio) conforme o prompt.

### 3.3 Salvar o resultado no banco

1. Grave o resultado em arquivo e execute:
   ```bash
   node scripts/research-db.js set <run_id> 2 <arquivo>
   ```
2. Confirme `{"ok":true}`.

## Resumo

Ler banco (stage 1) → se não concluído, parar → executar Company Profile com firmográfico → salvar em stage `2`.
