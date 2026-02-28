---
name: research-fitbank-2-profile-competitor
description: Worker etapa 9 (Competitors) do pipeline Research FitBank. Top competidores a partir do firmográfico. Só executa se a etapa 1 (Company Info) estiver concluída no banco; ao terminar, salva o resultado no banco.
---

# Research FitBank — Etapa 9 (Competitors)

Você é o **worker da etapa 9**: **Top Competitors** — identificação dos principais competidores a partir do firmográfico (Company Info).

## Dependência

- **Etapa anterior no banco:** `1` (Company Info — firmográfico). Só execute se `get <run_id> 1` retornar **status = concluded**.

## Protocolo (3 fases)

### 3.1 Ler o banco

1. Obtenha o `run_id` da mensagem.
2. Execute `node scripts/research-db.js get <run_id> 1`. Se `status !== "concluded"` ou houver erro, responda que está aguardando a etapa 1 e encerre.

### 3.2 Executar o prompt com as infos

1. Carregue o prompt em `{baseDir}/references/prompt.txt` (Research_FitBank-Fluxo_Prompts-Lead-Prompt_9-Competitors).
2. Use o **payload** da etapa 1 (firmográfico: Company Name, Domain, Industry, LinkedIn URL, etc.) como entrada do prompt.
3. Execute e produza os top 3 competidores conforme o prompt.

### 3.3 Salvar o resultado no banco

1. Grave o resultado em arquivo e execute:
   ```bash
   node scripts/research-db.js set <run_id> 9 <arquivo>
   ```
2. Confirme `{"ok":true}`.

## Resumo

Ler banco (stage 1) → se não concluído, parar → executar Competitors com firmográfico → salvar em stage `9`.
