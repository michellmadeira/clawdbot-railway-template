# Research FitBank — Versões dos prompts consideradas

Este documento registra quais arquivos de prompt da pasta **DFT-RESEARCH_FITBANK-FLUXO_PROMPTS-20260206** foram considerados e sincronizados para o drive (skills no workspace do OpenClaw).

Pasta de origem (referência):  
`C:\Users\...\MKTDirector\...\DFT-RESEARCH_FITBANK-20260206\DFT-RESEARCH_FITBANK-FLUXO_PROMPTS-20260206`

---

## Versões mais recentes utilizadas

| Etapa | Arquivo de origem | Skill no drive |
|-------|-------------------|----------------|
| 0 – SVC | **Research_FitBank-Fluxo_Prompts-Company-Prompt_0-SVC-20260210-v1.txt** | `research-fitbank-0-svc/references/prompt.txt` |
| 1 – Company Info | Research_FitBank-Fluxo_Prompts-Company-Prompt_1-CompanyInfo-20260206.txt | `research-fitbank-1-company-info/references/prompt.txt` |
| 2 – Customer Profile | Research_FitBank-Fluxo_Prompts-Company-Prompt_2-CustomerProfile-20260209.txt | `research-fitbank-1-company-profile/references/prompt.txt` |
| 3 – Search/Contacts | Research_FitBank-Fluxo_Prompts-Company-Prompt_3-SearchContacts-20260209.txt | `research-fitbank-1-company-contacts/references/prompt.txt` |
| 4 – Deepdive | Research_FitBank-Fluxo_Prompts-Lead-Prompt_4-Deepdive-20260209.txt | `research-fitbank-2-profile-dive/references/prompt.txt` |
| 5 – Pain Points | Research_FitBank-Fluxo_Prompts-Lead-Prompt_5-PainPoints-20260209.txt | `research-fitbank-2-profile-pain/references/prompt.txt` |
| 6 – UVP Match | Research_FitBank-Fluxo_Prompts-Lead-Prompt_6-UVPMatch-20260209.txt | `research-fitbank-2-profile-uvp/references/prompt.txt` |
| 7 – Case Study | Research_FitBank-Fluxo_Prompts-Lead-Prompt_7-CaseStudy-20260209.txt | `research-fitbank-2-profile-case/references/prompt.txt` |
| 8 – Email Builder | Research_FitBank-Fluxo_Prompts-Lead-Prompt_8-EmailBuilder-20260209.txt | `research-fitbank-2-profile-email/references/prompt.txt` |
| 9 – Competitors | Research_FitBank-Fluxo_Prompts-Lead-Prompt_9-Competitors-20260209.txt | `research-fitbank-2-profile-competitor/references/prompt.txt` |

---

## MetaPrompt (renderização SVC para etapas 3–7)

- **Arquivo considerado:** **Research_FitBank-Fluxo_Prompts-MetaPrompt_Verticais-20260209-v2-20260210.txt**
- **Cópia no drive:** `Z:\workspace\docs\Research_FitBank-Fluxo_Prompts-MetaPrompt_Verticais-20260209-v2-20260210.txt`
- Uso: skill futura “Gerar prompts-base por SVC” e processo de renderização dos placeholders `{{SVC_*}}` nos prompts 3–7 (ver **docs/RESEARCH-FITBANK-PLANO-METAPROMPT.md**).

---

## Revisão (B)

- **Prompt 0 – SVC:** a versão **20260210-v1** foi a considerada e está em uso no drive (substitui a versão anterior sem exaustividade/headings/catálogo inferred_generic).
- **MetaPrompt:** a versão **v2-20260210** foi a considerada e está no drive em `workspace/docs/`.
- **Prompts 1–9:** as versões **20260206** (Company Info) e **20260209** (demais) da pasta acima foram sincronizadas para as `references/prompt.txt` das respectivas skills no drive.

Quando houver novos arquivos na pasta (ex.: v2, 20260211), repetir a sincronização para as skills correspondentes e atualizar esta tabela.
