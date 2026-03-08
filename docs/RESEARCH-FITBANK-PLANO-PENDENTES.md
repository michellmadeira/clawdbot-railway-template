# Research FitBank — Planejamento (pendentes)

As **skills** ficam no **drive do SSH** (workspace do agente); é o **Craudião OpenClaw** que as executa. Nada aqui é código a rodar fora desse contexto.

---

## 1. Chamada Gemini com parâmetros certos (URL + ground with Google Search) — feito

- Estrutura da chamada (parameters + schema) documentada em **research-fitbank-1-company-info/references/chamada-gemini.md**: método POST, URL `gemini-3-flash-preview`, body com `contents`, `generationConfig` (thinkingLevel LOW, responseMimeType application/json, responseSchema), `tools` com `googleSearch` e `urlContext`. Schema da resposta (domain, name, linkedin_url, description, primary_industry, size, type, location, country, notes) incluído. A skill Company Info foi atualizada para referenciar esse arquivo ao executar a etapa.

---

## 2. Domínio: da tabela OU indicado pelo usuário

- A consulta pode partir de:
  - **Domínio já na tabela** (`sdria_redacao_20251014.dominio`), ou
  - **Domínio que o usuário indicar** (e que deve ser **adicionado na tabela**).
- **Objetivo:** adequar agente/skills para as **duas** possibilidades (usar domínio existente ou inserir novo e usar).

---

## 3. Transpose: do campo `search` (JSON) para a tabela de leads

- **Função transpose:** ler o conteúdo do campo **`search`** (JSON com a lista de leads encontrados) e inserir na tabela **`sdria_redacao_leads_20260130`** na estrutura correta.
- **Objetivo:** ter uma **skill** que faça isso: ler a lista de leads do JSON e adicionar na tabela com os campos correspondentes.

---

## 4. Metaprompt: prompts-base renderizados por SVC (etapas 3–7)

- Com base num SVC específico, customizar os placeholders `{{SVC_*}}` dos prompts das etapas 3, 4, 5, 6 e 7 **fora do tempo de execução**.
- **Plano detalhado:** ver **docs/RESEARCH-FITBANK-PLANO-METAPROMPT.md** (skill “Gerar prompts-base por SVC”, consumo pelas skills 3–7 dos prompts já renderizados em `prompts-rendered/<id_svc_ou_vertical>/`).
- Referência do processo: **Research_FitBank-Fluxo_Prompts-MetaPrompt_Verticais-20260209-v2-20260210** (versão considerada: v2-20260210).

---

Quando tiveres o exemplo da chamada (n8n/cURL), podemos fechar o ponto 1 e depois os pontos 2 e 3 na skill/drive.
