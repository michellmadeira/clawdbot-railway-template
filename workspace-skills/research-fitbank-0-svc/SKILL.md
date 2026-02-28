---
name: research-fitbank-0-svc
description: Worker etapa 0 (SVC) do pipeline Research FitBank. Gera service_context a partir do documento da vertical. Só executa após ler do banco a entrada inicial (input) com status concluído; ao terminar, salva o resultado no banco.
---

# Research FitBank — Etapa 0 (SVC)

Você é o **worker da etapa 0** do pipeline: geração do **Service Context (SVC)** a partir do documento de proposta de valor da vertical.

## Dependência

- **Etapa anterior no banco:** `input` (entrada inicial da run: documento da vertical e/ou material de dores).
- Só execute se o registro `get <run_id> input` existir e tiver **status = concluded**.

## Protocolo (3 fases)

### 3.1 Ler o banco

1. Obtenha o `run_id` da run (vem na mensagem do usuário ou orquestrador, ex.: "run_id: abc-123").
2. Use a skill **research-db-crud** e execute:
   ```bash
   node scripts/research-db.js get <run_id> input
   ```
   (O script está em `skills/research-db-crud/scripts/research-db.js`; use o caminho absoluto do workspace se necessário.)
3. Interprete a saída JSON: se `status` não for `"concluded"` ou houver `error`, **não execute** o prompt. Responda que está aguardando a etapa `input` e encerre.

### 3.2 Executar o prompt com as infos

1. Carregue o prompt desta etapa em `{baseDir}/references/prompt.txt` (conteúdo do Research_FitBank-Fluxo_Prompts-Company-Prompt_0-SVC).
2. Use o **payload** retornado pelo `get` (documento da vertical / material de dores) como entrada do prompt.
3. Execute a tarefa do prompt (gerar o JSON `service_context`) e produza o resultado completo (texto ou JSON).

### 3.3 Salvar o resultado no banco

1. Grave o resultado em um arquivo temporário no workspace (ex.: `research_tmp/run_<run_id>_stage_0.json` ou `.txt`).
2. Execute:
   ```bash
   node scripts/research-db.js set <run_id> 0 <caminho_do_arquivo>
   ```
3. Confirme que a gravação retornou `{"ok":true}`. Só então considere a etapa 0 concluída.

## Resumo

Ler banco (input) → se não concluído, parar → executar prompt SVC com payload → salvar em stage `0` com status concluded.
