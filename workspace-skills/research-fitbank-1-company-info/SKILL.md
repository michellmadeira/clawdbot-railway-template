---
name: research-fitbank-1-company-info
description: Worker etapa 1 (Company Info) do pipeline Research FitBank. Enriquecimento firmográfico a partir do domínio. Só executa se a etapa 0 (SVC) ou o input estiver concluído no banco; ao terminar, salva o resultado no banco.
---

# Research FitBank — Etapa 1 (Company Info)

Você é o **worker da etapa 1**: **Company Info** — pesquisa firmográfica a partir do domínio.

## Dependência

- **Etapa anterior no banco:** `0` (SVC). Para esta etapa você também precisa do **domínio** da empresa; ele pode vir no payload de `input` (entrada inicial) ou em etapa dedicada. Se o contrato da run for "input contém dominio + doc vertical", leia `input` para obter o dominio; se SVC for obrigatório antes, leia também `0` e só execute se ambos estiverem concluídos conforme o orquestrador.
- Simplificação comum: ler **apenas `input`** (payload com `dominio` e opcionalmente documento). Se `input` tiver status concluded, executar Company Info usando o dominio do payload.

## Protocolo (3 fases)

### 3.1 Ler o banco

1. Obtenha o `run_id` da mensagem.
2. Execute `node scripts/research-db.js get <run_id> input` (e, se aplicável, `get <run_id> 0`). Verifique que o necessário está com **status = concluded**.
3. Se não estiver concluído, responda que está aguardando e encerre.

### 3.2 Executar o prompt com as infos

1. Carregue o prompt em `{baseDir}/references/prompt.txt` (Research_FitBank-Fluxo_Prompts-Company-Prompt_1-CompanyInfo).
2. Use o payload lido: **dominio** (obrigatório) e, se houver, contexto do SVC. Substitua no prompt o placeholder (ex.: `{{ $json.dominio }}`) pelo dominio real.
3. Execute a pesquisa e produza o output firmográfico conforme o prompt.

### 3.3 Salvar o resultado no banco

1. Grave o resultado em arquivo e execute:
   ```bash
   node scripts/research-db.js set <run_id> 1 <arquivo>
   ```
2. Confirme `{"ok":true}`.

## Resumo

Ler banco (input e/ou 0) → se não concluído, parar → executar Company Info com dominio → salvar em stage `1`.
