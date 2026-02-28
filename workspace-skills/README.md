# Skills do workspace OpenClaw

Estas pastas são skills no formato [OpenClaw / AgentSkills](https://docs.openclaw.ai/skills). Para o agente enxergá-las, elas precisam estar em **`/skills`** dentro do workspace do agente.

## Arquitetura: Craudião + agente Research

Não há vários "agents" configurados — só o **Craudião** (um agente). O que existe são **skills**. Não há “skills soltas”:

- **Research** (agente dedicado) orquestra: usa a skill **research-db-crud** para ver o estado da run (`list <run_id>`) e **aplica a skill da próxima etapa** quando a anterior está concluída.
- **Cada etapa 0–9** é uma **skill** que o Research **aplica** (research-fitbank-0-svc, research-fitbank-1-company-info, etc.). Cada uma segue o protocolo em 3 fases: ler banco → executar prompt → salvar banco.

O Craudião acompanha o estado via banco. Resumo: as **skills** são “o que fazer” (procedimento + prompt); os **agentes** são “quem executa” (sub-agentes invocados pelo Craudião com a tarefa de rodar aquela etapa para um `run_id`). O Craudião acompanha a execução via banco e decide qual etapa aplicar em seguida. Ou seja: **1 agente** (Craudião) e **11 skills** (1 CRUD + 10 etapas).

## Skills do pipeline (11 no total)

| Pasta | Uso |
|-------|-----|
| **research-db-crud** | CRUD do pipeline no banco (get/set/list por run_id e stage). Referência às tabelas do processo no próprio SKILL.md. Credenciais: RESEARCH_DB_URL ou RESEARCH_DB_PATH. |
| **research-fitbank-0-svc** … **research-fitbank-2-profile-competitor** | Uma skill por etapa (0–9). Cada uma é aplicada na execução daquela etapa (ler banco → executar prompt → salvar banco). |

A pasta **pesquisa-etapas** não faz parte deste pipeline: é um fluxo genérico (prompts em `references/` na ordem). Para o Research FitBank use apenas as 11 skills acima; o script de instalação não inclui pesquisa-etapas.

A documentação de protocolo e do agente Research fica no **workspace do agente (drive)**, em `docs/` (ex.: `Z:\workspace\docs\` ou `/data/workspace/docs/`): AGENTE-RESEARCH.md, RESEARCH-FITBANK-PIPELINE-PROTOCOLO.md, CONFORMIDADE-OPENCLAW-AGENTES-E-SKILLS.md. Não está no repositório (repo = código-fonte apenas).

## Onde instalar

| Ambiente | Caminho do workspace | Onde colar as skills |
|----------|----------------------|----------------------|
| Railway (/data) | `/data/workspace` | `/data/workspace/skills/` (research-db-crud + research-fitbank-0-svc … research-fitbank-2-profile-competitor) |
| WebDAV (Z:) | `Z:\workspace` | `Z:\workspace\skills\` |
| Agente Research (Railway) | `/data/workspace-research` | `/data/workspace-research/skills/` (copiar as 11 skills para o workspace do Research) |

**Script de instalação (quando Z: estiver conectado):** na raiz do repo:
```powershell
.\scripts\install-workspace-skills.ps1
```
Instala as **11 skills do pipeline** em `Z:\workspace\skills`. A pasta `pesquisa-etapas` fica em workspace-skills mas não é copiada por padrão.

## Depois de instalar

1. **Substituir os prompts**  
   Edite os arquivos em `references/` e coloque o conteúdo real de cada etapa (ou renomeie/adicione arquivos `01-*.md`, `02-*.md`, etc.).

2. **Fazer o agente recarregar as skills**  
   - Mande algo como: “refresh skills” ou “atualizar skills”, ou  
   - Reinicie o gateway (ex.: pelo /setup ou reinício do serviço).

Documentação oficial: [Creating Skills](https://docs.openclaw.ai/tools/creating-skills), [Skills (locations and format)](https://docs.openclaw.ai/skills).
