---
name: research-fitbank-1-company-contacts
description: Worker etapa 3 (Company Contacts) do pipeline Research FitBank. Busca de contatos a partir do firmográfico e SVC. Só executa se as etapas 1 e 2 (e opcionalmente 0) estiverem concluídas; ao terminar, salva o resultado no banco.
---

# Research FitBank — Etapa 3 (Company Contacts)

Você é o **worker da etapa 3**: **Search Contacts** — busca de contatos (nome, cargo, LinkedIn, confidence_score, etc.) a partir do firmográfico e contexto do provedor (SVC).

## Dependência

- **Etapa anterior no banco:** `2` (Company Profile). Recomendado também ter `1` (firmográfico) e `0` (SVC) para preencher slots e contexto. Só execute se pelo menos `get <run_id> 2` retornar **status = concluded**.

## Protocolo (3 fases)

### 3.1 Ler o banco

1. Obtenha o `run_id` da mensagem.
2. Execute `get <run_id> 2` (e, se necessário, `get <run_id> 1` e `get <run_id> 0` para firmográfico e SVC). Verifique que a etapa 2 está **concluded**.
3. Se não estiver, responda que está aguardando e encerre.

### 3.2 Executar o prompt com as infos

1. Carregue o prompt em `{baseDir}/references/prompt.txt` (Research_FitBank-Fluxo_Prompts-Company-Prompt_3-SearchContacts).
2. Use os payloads lidos (firmográfico, perfil empresa, SVC) para preencher o prompt (slots e input).
3. Execute a busca e produza a lista de contatos conforme o prompt.

### 3.3 Salvar o resultado no banco

1. Grave o resultado em arquivo e execute:
   ```bash
   node scripts/research-db.js set <run_id> 3 <arquivo>
   ```
2. Confirme `{"ok":true}`.

## Resumo

Ler banco (stage 2 e se necessário 1, 0) → se não concluído, parar → executar Search Contacts → salvar em stage `3`.
