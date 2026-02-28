# Conformidade com a documentação OpenClaw (agentes e skills)

Este documento confere se a estrutura de **agentes** e **skills** do projeto segue a documentação oficial do OpenClaw, com referências às fontes.

---

## 1. Skills — estrutura recomendada

### 1.1 Fonte oficial

- **Skills (formato e localização):** [docs.openclaw.ai/skills](https://docs.openclaw.ai/skills)
- **Creating Skills:** [docs.openclaw.ai/tools/creating-skills](https://docs.openclaw.ai/tools/creating-skills)

### 1.2 O que a documentação exige

| Requisito | Fonte | Nosso uso |
|-----------|--------|-----------|
| Skill = **diretório** contendo `SKILL.md` | *"A skill is a directory containing a SKILL.md file"* (Creating Skills) | Cada skill em `workspace-skills/<nome>/` com `SKILL.md` ✓ |
| **YAML frontmatter** com pelo menos `name` e `description` | *"SKILL.md must include at least"* `name` e `description* (Skills) | Todas as skills têm `---`, `name:`, `description:` no frontmatter ✓ |
| Instruções em **Markdown** após o frontmatter | *"Markdown for instructions"* (Creating Skills); *"instructions and tool definitions to the LLM"* | Corpo do SKILL.md em Markdown ✓ |
| Skills no workspace: pasta **`skills/`** do agente | *"Workspace skills: `/skills`"*; *"Per-agent skills live in `/skills` for that agent only"* (Skills) | Instalamos em `Z:\workspace\skills\` ou `/data/workspace/skills/` (Craudião) e `/data/workspace-research/skills/` (Research) ✓ |
| Uso de `{baseDir}` nas instruções (opcional) | *"Use `{baseDir}` in instructions to reference the skill folder path"* (Skills) | Skills referem `{baseDir}/references/`, `scripts/` onde aplicável ✓ |
| Scripts/recursos opcionais no diretório da skill | *"optionally some scripts or resources"* (Creating Skills) | research-db-crud tem `scripts/research-db.js`; etapas têm `references/prompt.txt` ✓ |

### 1.3 Precedência de carregamento (oficial)

1. Workspace `/skills` (maior precedência)  
2. Managed/local `~/.openclaw/skills`  
3. Bundled skills  

Nosso fluxo: as 11 skills ficam no **workspace** de cada agente que as usa (Craudião e/ou Research), portanto em `workspace/skills/` — alinhado à doc.

---

## 2. Agentes (multi-agent) — estrutura recomendada

### 2.1 Fontes oficiais

- **Multi-Agent Routing:** [docs.openclaw.ai/concepts/multi-agent](https://docs.openclaw.ai/concepts/multi-agent)
- **Agent Workspace:** [docs.openclaw.ai/concepts/agent-workspace](https://docs.openclaw.ai/concepts/agent-workspace)

### 2.2 O que a documentação exige

| Requisito | Fonte | Nosso uso |
|-----------|--------|-----------|
| Cada agente = **workspace** + **agentDir** + **sessões** | *"An agent is a fully scoped brain with its own: Session store, State directory (agentDir), Workspace"* (Multi-Agent) | Research: workspace próprio (`/data/workspace-research`); agentDir e sessões geridos pelo OpenClaw por `agentId` ✓ |
| **agents.list[]** com `id`, `workspace` (e opcionalmente `name`, `agentDir`) | *"list: [ { id: \"main\", workspace: \"...\" }, { id: \"research\", workspace: \"...\" } ]"* (Multi-Agent, exemplos) | `agent-research/openclaw.json.example`: `id`, `name`, `workspace` ✓ |
| Workspace com **AGENTS.md** (instruções operacionais) | *"Operating instructions for the agent and how it should use memory. AGENTS.md — Loaded at the start of every session"* (Agent Workspace) | `agent-research/AGENTS.md` com papel e fluxo do Research ✓ |
| Workspace pode ter **skills/** (skills por agente) | *"Workspace-specific skills. skills/ (optional)"* (Agent Workspace); *"Skills are per-agent via each workspace's skills/ folder"* (Multi-Agent) | Doc do Research: copiar as 11 skills para `workspace-research/skills/` ✓ |
| Arquivos opcionais: SOUL.md, IDENTITY.md, USER.md, TOOLS.md, etc. | *"SOUL.md — Persona, tone and boundaries"*, *"IDENTITY.md — Agent name, vibe, emoji"*, etc. (Agent Workspace) | Research usa só AGENTS.md no template; demais arquivos podem ser adicionados conforme necessidade ✓ |

### 2.3 Roteamento (bindings)

A doc diz que mensagens são roteadas ao agente via **bindings** em `openclaw.json` (match por channel, accountId, peer, etc.). Para o Craudião “usar” o Research, é preciso configurar bindings (ou roteamento equivalente) para que pedidos de pesquisa atinjam o agente `research`. Isso fica na configuração do deploy (fora do repo); em [AGENTE-RESEARCH.md](AGENTE-RESEARCH.md) está indicado.

---

## 3. Resumo

- **Skills:** formato (SKILL.md com frontmatter `name` + `description` e corpo em Markdown), uso de diretório com scripts/references e instalação em `workspace/skills/` estão em linha com [docs.openclaw.ai/skills](https://docs.openclaw.ai/skills) e [docs.openclaw.ai/tools/creating-skills](https://docs.openclaw.ai/tools/creating-skills).
- **Agentes:** agente Research com workspace próprio, AGENTS.md e skills em `skills/`, e entrada em `agents.list` com `id` e `workspace` estão em linha com [docs.openclaw.ai/concepts/multi-agent](https://docs.openclaw.ai/concepts/multi-agent) e [docs.openclaw.ai/concepts/agent-workspace](https://docs.openclaw.ai/concepts/agent-workspace).

Qualquer ajuste futuro (ex.: SOUL.md ou IDENTITY.md para o Research) pode seguir o [Agent Workspace file map](https://docs.openclaw.ai/concepts/agent-workspace).
