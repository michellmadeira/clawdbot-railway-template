# Modelo dedicado para compactação (model.compact)

## Por que não usar `model.compact` no JSON?

No `openclaw.json`, o bloco `agents.defaults.model` aceita apenas:

- **`primary`** (string): modelo principal (conversa)
- **`fallbacks`** (array de strings): modelos de fallback

Se você adicionar **`compact`** (ex.: `"compact": "google/gemini-2.5-flash-lite"`), o OpenClaw rejeita a config com:

```text
agents.defaults.model: Invalid input
```

Motivo: o schema Zod do OpenClaw (em **v2026.3.2** e no **main** atual) usa `.strict()` no objeto `model`. Só as chaves `primary` e `fallbacks` existem em `AgentModelSchema` / `AgentModelListConfig`. Qualquer chave extra (como `compact`) é considerada inválida.

O PR que adiciona `model.compact` é o [openclaw/openclaw#11970](https://github.com/openclaw/openclaw/pull/11970). Ele ainda **não está** em nenhuma tag nem em `main`, então não há release oficial que suporte essa chave.

## O que fazer hoje: modelo único (leve) para tudo

Para usar um modelo mais leve tanto na conversa quanto na compactação:

- Deixe **só** `primary` no `model`, com o modelo leve, por exemplo:
  - `"primary": "google/gemini-2.5-flash-lite"`

Assim, conversa e compactação usam o mesmo modelo. É o que está em uso agora e evita o erro de config.

## Quando `model.compact` estiver disponível

Quando existir uma versão do OpenClaw que inclua o PR #11970 (nova tag ou merge em `main`):

1. Atualizar o `Dockerfile` para usar essa versão (ex.: nova tag em `OPENCLAW_GIT_REF`).
2. No `openclaw.json`, você poderá usar:

   ```json
   "model": {
     "primary": "google/gemini-2.5-flash-lite",
     "compact": "google/gemini-2.5-flash-lite"
   }
   ```

   - `primary`: conversa.
   - `compact`: modelo usado **só** para compactação (resumo do histórico). Pode ser outro, mais leve/barato.

Não adicione `compact` antes de usar uma ref do OpenClaw que realmente inclua esse suporte, senão a config continuará inválida.
