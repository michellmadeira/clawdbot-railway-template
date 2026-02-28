# Workspace do agente Research

Este diretório é o **template** do workspace do agente **Research** (orquestrador do pipeline Research FitBank). O Craudião usa esse agente para rodar pesquisas em segundo plano.

## Conteúdo

- **AGENTS.md** — Instruções do agente (papel, uso das skills, fluxo de orquestração).
- **openclaw.json.example** — Exemplo de entrada em `agents.list` para o OpenClaw (Craudião + Research).

## Como usar

1. **Criar o workspace do Research** no ambiente onde o OpenClaw roda (ex.: Railway `/data/workspace-research` ou WebDAV `Z:\workspace-research`):
   - Copie o conteúdo de `agent-research/` (pelo menos `AGENTS.md`) para esse workspace.
   - Crie a pasta `skills/` e copie para dentro as **11 skills** do repositório (`workspace-skills/research-db-crud`, `workspace-skills/research-fitbank-0-svc`, …, `workspace-skills/research-fitbank-2-profile-competitor`). Pode usar o mesmo script de instalação ajustando o destino, ou copiar manualmente.

2. **Configurar o OpenClaw** para reconhecer o agente Research: edite `openclaw.json` (em geral em `/data/.openclaw/openclaw.json`) e adicione o agente conforme `openclaw.json.example`. Ajuste os caminhos de `workspace` se necessário.

3. **Roteamento:** configure o Gateway/UI para que pedidos de pesquisa sejam atendidos pelo agente `research` (binding, escolha do usuário ou delegação pelo Craudião). Ver [docs/AGENTE-RESEARCH.md](../docs/AGENTE-RESEARCH.md).

4. **Variáveis de ambiente:** o container onde o OpenClaw roda precisa de `RESEARCH_DB_URL` (ou `RESEARCH_DB_PATH`) para a skill research-db-crud funcionar.

Documentação completa: [docs/AGENTE-RESEARCH.md](../docs/AGENTE-RESEARCH.md), [docs/RESEARCH-FITBANK-PIPELINE-PROTOCOLO.md](../docs/RESEARCH-FITBANK-PIPELINE-PROTOCOLO.md) e [docs/CONFORMIDADE-OPENCLAW-AGENTES-E-SKILLS.md](../docs/CONFORMIDADE-OPENCLAW-AGENTES-E-SKILLS.md) (estrutura de agentes e skills conforme doc OpenClaw).
