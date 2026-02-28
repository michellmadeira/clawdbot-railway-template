# Análise do contexto: Research FitBank — fluxo de prompts e coreografia

Documento de análise do material em:
- **Projeto:** `MKTDIRECTOR-RESEARCH_IA-20251112`
- **Fluxo utilizado:** `DFT-RESEARCH_FITBANK-20260206`  
- **Prompts do pipeline:** `DFT-RESEARCH_FITBANK-FLUXO_PROMPTS-20260206`

Objetivo: entender a coreografia (quem consome o quê) e preparar a implantação da skill OpenClaw.

---

## 1. Visão geral do pipeline

O pipeline é uma **pesquisa em 9+ etapas encadeadas**, em dois blocos:

- **A) Company (etapas 0–3):** contexto do serviço (SVC), info da empresa, perfil, busca de contatos.
- **B) Lead (etapas 4–9):** dossiê do lead, dores, UVP match, case study, message builder, competidores.

Cada etapa tem **input** (dados da etapa anterior ou do usuário) e **output** (estrutura fixa). O output de uma etapa é o input da seguinte.

---

## 2. Estrutura de inputs/outputs (do arquivo Exemplo_Clay_z3leads-Estrutura)

| Etapa | Nome           | Input principal                                      | Output principal   |
|-------|----------------|------------------------------------------------------|--------------------|
| **1** | Company Info   | domínio (`domain`)                                   | Firmográfico       |
| **2** | Customer Profile | Firmográfico (domain, linkedin_url, description, industry) | Modelo de negócio (USP, dores, decisor, etc.) |
| **3** | Search Contacts | Firmográfico + FitBank (proposta valor, pilares, keywords) | Lista de contatos (first_name, title, linkedin_url, confidence_score, etc.) |
| **4** | Deepdive (Dossiê) | Contato + modelo negócio + FitBank                  | Dossiê (executive_summary, professional_profile, company_deep_dive, etc.) |
| **5** | Pain Points   | Dossiê + FitBank (core problem/solutions)          | Dores (strategicInsights, identifiedPainPoint, identifiedOpportunity) |
| **6** | UVP Match     | Dossiê + Dores + FitBank (persona, UVP arsenal)      | Proposta de valor (bestMatchedUVP, conversationAngle, analysis) |
| **7** | Case Study    | Dores + FitBank (case library)                       | Estudo de caso (matchedCaseStudy, reasoningForMatch) |
| **8** | Email/Message Builder | Dossiê + Dores + Proposta valor + Estudo de caso | Mensagens (message_1, message_2, subject_line, research_insights) |
| **9** | Competitors   | Firmográfico                                        | Top 3 competidores |

Ou seja: **um consome a informação do anterior**; a ordem é fixa e a coreografia está bem definida.

---

## 3. Pasta do fluxo utilizado (`DFT-RESEARCH_FITBANK-FLUXO_PROMPTS-20260206`)

### 3.1 Arquivos de prompt (ordem da coreografia)

**Bloco 0 – Service Context (SVC)**  
- `Research_FitBank-Fluxo_Prompts-Company-Prompt_0-SVC-20260210.txt` (e variante `-v1`)  
- `Research_FitBank-Fluxo_Prompts-Company-Prompt_0-SVC_1_ERP-20260210.txt` (e `-v1`)  

Geração do **service_context** (JSON) a partir de “material de dores” / documento da vertical. Esse contexto alimenta os **slots {{SVC_*}}** nos prompts downstream.

**Company**  
- `Research_FitBank-Fluxo_Prompts-Company-Prompt_1-CompanyInfo-20260206.txt`  
  - Input: `{{ $json.dominio }}`  
  - Output: firmográfico (name, linkedin_url, description, primary_industry, size, type, location, country, notes).  
- `Research_FitBank-Fluxo_Prompts-Company-Prompt_2-CustomerProfile-20260209.txt`  
  - Input: firmográfico (e info da empresa).  
  - Output: modelo de negócio (USP, target industry, pain points, etc.).  
- `Research_FitBank-Fluxo_Prompts-Company-Prompt_3-SearchContacts-20260209.txt`  
  - Input: firmográfico + FitBank (proposta valor, pilares, perfil lead, keywords).  
  - Output: contatos (first_name, last_name, title, linkedin_url, confidence_score, reasoning, key_evidence_source).  

**Lead**  
- `Research_FitBank-Fluxo_Prompts-Lead-Prompt_4-Deepdive-20260209.txt`  
  - Slots: `{{SVC_PROVIDER_IDENTITY}}`, `{{SVC_OFFERINGS_BY_VERTICAL}}`, `{{SVC_RESEARCH_FOCUS_AREAS}}`, `{{SVC_STRATEGIC_LENS}}`.  
  - Input: Lead & Company (nome, cargo, empresa, domínio, LinkedIn, descrição empresa) + “SERVICE ICP CONTEXT” (modelo negócio).  
  - Output: dossiê completo.  
- `Research_FitBank-Fluxo_Prompts-Lead-Prompt_5-PainPoints-20260209.txt`  
  - Slots: `{{SVC_CORE_PROBLEM_FOCUS}}`, `{{SVC_CORE_SOLUTIONS}}`.  
  - Input: prospectGeneralInfo + **FULL DOSSIER** (Company Deep Dive, Executive Summary, Strategic Analysis, etc.).  
  - Output: strategicInsights (identifiedPainPoint, identifiedOpportunity, reasoning, confidenceLevel).  
- `Research_FitBank-Fluxo_Prompts-Lead-Prompt_6-UVPMatch-20260209.txt`  
  - Input: contato + dossiê + dores + FitBank (persona, UVP arsenal).  
  - Output: bestMatchedUVP, conversationAngle, analysis.  
- `Research_FitBank-Fluxo_Prompts-Lead-Prompt_7-CaseStudy-20260209.txt`  
  - Slot: `{{SVC_CASE_LIBRARY}}`.  
  - Input: contato + modelo negócio + dores.  
  - Output: matchedCaseStudy, reasoningForMatch.  
- `Research_FitBank-Fluxo_Prompts-Lead-Prompt_8-EmailBuilder-20260209.txt`  
  - Slot: `{{SVC_LANGUAGE_RULES}}` (e contexto do serviço).  
  - Input: contato + dossiê + dores + proposta de valor + estudo de caso.  
  - Output: message_1, message_2 (subject_line, full_message, research_insights, pain_point_targeted, sequence_strategy).  
- `Research_FitBank-Fluxo_Prompts-Lead-Prompt_9-Competitors-20260209.txt`  
  - Input: firmográfico.  
  - Output: top 3 competidores.  

**Meta prompt (compilador por vertical)**  
- `Research_FitBank-Fluxo_Prompts-MetaPrompt_Verticais-20260209.txt` (e `-v1`, `-v2`)  

Lê um **Documento de Proposta de Valor** por vertical, gera **service_context** e **SVC_RENDER_MAP**, e **renderiza** os prompts 3–7 substituindo apenas os slots `{{SVC_*}}`. Não altera o resto do texto (guardrails de idempotência e proibição de edição fora dos slots).

---

## 4. Slots de Service Context ({{SVC_*}})

Definidos no plano e no MetaPrompt; usados em várias etapas:

- `{{SVC_PROVIDER_IDENTITY}}` — identidade/posicionamento do provedor.  
- `{{SVC_OFFERINGS_BY_VERTICAL}}` — ofertas por vertical.  
- `{{SVC_STRATEGIC_LENS}}` — lente estratégica (priorizar/ignorar).  
- `{{SVC_PERSONA_TARGETING}}` — Best/Good/Fair/Avoid (cargos).  
- `{{SVC_KEYWORDS}}` — termos para SearchContacts.  
- `{{SVC_CORE_PROBLEM_FOCUS}}` / `{{SVC_CORE_SOLUTIONS}}` — dores e soluções (Pain Points).  
- `{{SVC_UVP_ARSENAL}}` — UVPs por persona (UVP Match).  
- `{{SVC_CASE_LIBRARY}}` — cases (Case Study).  
- `{{SVC_RESEARCH_FOCUS_AREAS}}` — foco de pesquisa (Deepdive e outros).  
- `{{SVC_LANGUAGE_RULES}}` — tom e restrições (Message Builder).  
- `{{SVC_CASE_MATCH_DRIVERS}}` — drivers para match de case.  

O **Prompt 0 (SVC)** gera o JSON `service_context` a partir do material da vertical. O **MetaPrompt_Verticais** usa esse contrato para preencher os slots e renderizar os prompts-alvo (3–7 ou conforme definido).

---

## 5. Como a coreografia se encaixa na skill OpenClaw

- **Ordem fixa:** executar as etapas na sequência 0 → 1 → 2 → … → 9 (ou subconjunto definido), respeitando a documentação oficial do OpenClaw (um passo consome o output do anterior).  
- **Variáveis entre etapas:**  
  - Output da etapa N vira **input** da etapa N+1 (ex.: firmográfico → Customer Profile; dossiê → Pain Points; dores + proposta → Message Builder).  
  - O **service_context** (gerado no 0 e opcionalmente pelo MetaPrompt) é injetado nos prompts via slots; não é “variável entre etapas” no mesmo sentido que firmográfico/dossiê/dores, mas é **contexto compartilhado** por várias etapas.  
- **Dois modos de uso possíveis:**  
  1. **Subagente por etapa:** cada etapa é um `sessions_spawn` com `task` = prompt renderizado + input (output da etapa anterior). O orquestrador monta o `task` com o resultado do announce da etapa anterior.  
  2. **Uma sessão, várias mensagens:** uma única sessão de subagente recebe, via `sessions_send`, mensagens sequenciais: “Contexto: [output etapa N]. Instruções: [prompt etapa N+1].”  

Em ambos os casos, o importante é: **respeitar a documentação oficial** (Session Tools, Sub-Agents), **manter a ordem da coreografia** e **garantir que as variáveis descobertas em uma etapa sejam passadas explicitamente para a seguinte** (no `task` ou no `message`).

---

## 6. Bases e documentação de apoio (na mesma pasta)

- **Base-Exemplo_Clay_z3leads-20251112:** prompts originais do exemplo z3leads (Company 1–3, Lead 1–6).  
- **Base-FitBank_GTM-20260209:** ICP/GTM por vertical (ERP, MercadoCapitais, MercadoFinanceiro) em `.md`.  
- **DFT-RESEARCH_FITBANK-PLANO_ADAPTAÇÃO-20260206.txt:** plano de adaptação (blocos 0–6), contrato de service context, slots, QA e meta prompt.  
- **Entendimento_do_fluxo_exemplo_de_Research_z3leads_06022026.pdf:** documentação do fluxo exemplo.  
- **Exemplo_Clay_z3leads-Estrutura-20260205.txt:** estrutura de inputs/outputs por etapa (fonte da tabela acima).  

---

## 7. Implementação: protocolo em 3 fases e banco

Foi implementado o pipeline com **banco como handoff** e workers em 3 fases (ler banco → executar prompt → salvar banco). Detalhes em **[RESEARCH-FITBANK-PIPELINE-PROTOCOLO.md](RESEARCH-FITBANK-PIPELINE-PROTOCOLO.md)**.

Resumo:

- **Skill research-db-crud:** get/set/list por `run_id` e `stage`; credenciais via `RESEARCH_DB_URL` (Postgres) ou `RESEARCH_DB_PATH` (JSON em diretório).
- **10 skills de etapa** (0 SVC até 9 Competitor): cada uma com protocolo (3.1 ler banco, 3.2 executar prompt com as infos, 3.3 salvar resultado no banco). Só executam se a etapa anterior estiver com **status = concluded** no banco.
- **Orquestrador:** valida com `list <run_id>` e dispara a próxima etapa (mensagem ao agente com run_id e número da etapa). A entrada inicial da run é gravada em `input` com status concluded.
