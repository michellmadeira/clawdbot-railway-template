# Scripts do repositório (não são do OpenClaw)

Estes scripts rodam **no seu ambiente** (ou em CI), não dentro do OpenClaw. Servem para publicar/sincronizar conteúdo com o drive (Z:) ou para operações do próprio repo.

| Script | Uso |
|--------|-----|
| `install-workspace-skills.ps1` | Copia `workspace-skills/` → `Z:\workspace\skills\` (instala as 11 skills do pipeline). |
| `deploy-docs-to-workspace.ps1` | Copia `docs/*.md` do repo → `Z:\workspace\docs\`. |
| `restore-critical-docs-to-workspace.ps1` | Restaura docs críticos para o drive a partir do Git. |
| `sync-prompts-base-to-drive.mjs` | Sincroniza prompts-base para o drive. |
| `write-chamada-gemini-to-drive.mjs` | Escreve chamada Gemini no drive. |
| `extract-n8n-gemini.mjs` / `n8n-extracted.json` | Extração/ferramentas n8n (não é skill do agente). |
| `bump-openclaw-ref.mjs` | Atualiza referência ao OpenClaw no projeto. |
| `smoke.js` | Teste de fumaça (ex.: `npm run smoke`). |

**Lembrete:** Os scripts e skills que o **OpenClaw executa** ficam no **drive** (Z:\workspace\skills\, Z:\workspace\docs\). Este diretório é só ferramentas do repo.
