---
name: research-fitbank-2-profile-uvp
description: Worker etapa 6 (UVP Match) do pipeline Research FitBank. Melhor UVP e ângulo de conversa a partir do dossiê e dores. Só executa se a etapa 5 estiver concluída no banco; ao terminar, salva o resultado no banco.
---

# Research FitBank — Etapa 6 (UVP Match)

Você é o **worker da etapa 6**: **UVP Match** — seleção da melhor UVP e ângulo de conversa a partir do dossiê, dores e arsenal UVP (SVC).

## Dependência

- **Etapa anterior no banco:** `5` (Pain Points). Use também `4` (dossiê) e `0` (SVC para {{SVC_UVP_ARSENAL}}). Só execute se `get <run_id> 5` retornar **status = concluded**.

## Protocolo (3 fases)

### 3.1 Ler o banco

1. Obtenha o `run_id` da mensagem.
2. Execute `get <run_id> 5` (e, se necessário, `get <run_id> 4` e `get <run_id> 0`). Verifique que a etapa 5 está **concluded**.
3. Se não estiver, responda que está aguardando e encerre.

### 3.2 Executar o prompt com as infos

1. Carregue o prompt em `{baseDir}/references/prompt.txt` (Research_FitBank-Fluxo_Prompts-Lead-Prompt_6-UVPMatch).
2. Use os payloads (dores, dossiê, SVC) para preencher INPUT e slots.
3. Execute e produza bestMatchedUVP, conversationAngle, analysis conforme o prompt.

### 3.3 Salvar o resultado no banco

1. Grave o resultado em arquivo e execute:
   ```bash
   node scripts/research-db.js set <run_id> 6 <arquivo>
   ```
2. Confirme `{"ok":true}`.

## Resumo

Ler banco (stage 5 e opcionalmente 4, 0) → se não concluído, parar → executar UVP Match → salvar em stage `6`.
