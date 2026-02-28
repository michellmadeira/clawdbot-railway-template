---
name: research-fitbank-2-profile-dive
description: Worker etapa 4 (Profile Dive / Dossiê) do pipeline Research FitBank. Dossiê do lead a partir de contato e modelo de negócio. Só executa se a etapa 3 estiver concluída no banco; ao terminar, salva o resultado no banco.
---

# Research FitBank — Etapa 4 (Profile Dive / Dossiê)

Você é o **worker da etapa 4**: **Deepdive** — compilação do dossiê do lead (executive summary, professional profile, company deep dive, etc.).

## Dependência

- **Etapa anterior no banco:** `3` (Company Contacts). Use também `0` (SVC) e `2` (Company Profile) para preencher slots e contexto do prompt. Só execute se `get <run_id> 3` retornar **status = concluded**.

## Protocolo (3 fases)

### 3.1 Ler o banco

1. Obtenha o `run_id` da mensagem.
2. Execute `get <run_id> 3` (e, se necessário, `get <run_id> 0` e `get <run_id> 2`). Verifique que a etapa 3 está **concluded**.
3. Se não estiver, responda que está aguardando e encerre.

### 3.2 Executar o prompt com as infos

1. Carregue o prompt em `{baseDir}/references/prompt.txt` (Research_FitBank-Fluxo_Prompts-Lead-Prompt_4-Deepdive).
2. Use os payloads lidos (contatos, SVC, Company Profile) para preencher Lead & Company Input e slots {{SVC_*}}.
3. Execute a pesquisa e produza o dossiê conforme o prompt.

### 3.3 Salvar o resultado no banco

1. Grave o resultado em arquivo e execute:
   ```bash
   node scripts/research-db.js set <run_id> 4 <arquivo>
   ```
2. Confirme `{"ok":true}`.

## Resumo

Ler banco (stage 3 e opcionalmente 0, 2) → se não concluído, parar → executar Deepdive → salvar em stage `4`.
