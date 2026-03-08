# Lentidão do OpenClaw – o que os logs mostram

## 1. Script sem permissão de execução

Nos logs aparece:

```text
[tools] exec failed: sh: 1: ./scripts/gerador_dossie_super_robusto.sh: Permission denied
Command not executable (permission denied)
```

**Onde:** esse script fica no workspace do OpenClaw (ex.: `/data/workspace` no Railway, ou `Z:\workspace` se estiver montado). Não faz parte do template do repositório.

**Efeito:** quando o agente (ou uma skill) tenta rodar esse script, a execução falha. O agente pode insistir, dar timeout ou demorar até desistir, o que deixa a resposta lenta.

**O que fazer:** dar permissão de execução ao script no volume persistente. Por exemplo, via SSH no Railway:

```bash
chmod +x /data/workspace/scripts/gerador_dossie_super_robusto.sh
```

Ou, se o script estiver em outro caminho sob o workspace, use o caminho correto. Se você versionar scripts no repo e copiar para o volume no deploy, garanta que eles sejam criados já com `chmod +x` no Dockerfile ou no entrypoint.

---

## 2. Gateway “did not become ready in time”

O wrapper espera o gateway do OpenClaw ficar “ready” em **45 segundos** (antes era 20s). Em cold start lento (Telegram, DNS, etc.), o gateway pode demorar mais que 20s para responder ao health check; aí o wrapper marcava falha mesmo com o gateway subindo em seguida.

**O que foi feito:** o timeout em `src/server.js` foi aumentado para 45s (`waitForGatewayReady` e a chamada em `ensureGateway()`), para reduzir falso “gateway failed to start” em cold start.

---

## 3. Outras causas possíveis

- **Compaction:** sessões longas podem disparar compactação (resumo do histórico). Enquanto roda, a resposta pode demorar.
- **Rate limit (429):** se a API do Gemini devolver 429, o OpenClaw pode fazer retry e a resposta atrasa. Ver `docs/GEMINI-429-QUAL-CHAMADA-EXAUSTA.md` se isso voltar a aparecer nos logs.
- **Modelo/cota:** uso de modelo mais pesado ou cota no limite pode aumentar latência.

Se a lentidão continuar, vale buscar nos logs por `exec failed`, `Permission denied`, `429`, `RESOURCE_EXHAUSTED` e `compaction` na janela de tempo em que a resposta ficou lenta.
