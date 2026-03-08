# Qual chamada está "exausta" (429 RESOURCE_EXHAUSTED)

Objetivo: identificar **exatamente** qual recurso/quota do Google está batendo no limite quando o OpenClaw mostra "⚠️ API rate limit reached".

---

## 1. A chamada que falha

**Uma única família de chamada** está gerando o 429 nos logs:

| Campo | Valor |
|-------|--------|
| **API** | `generativelanguage.googleapis.com` |
| **Método** | `POST` |
| **Endpoint** | `/v1beta/models/{model}:generateContent` |
| **Modelo** | `gemini-3-flash-preview` |
| **Credencial** | `GOOGLE_API_KEY` (conversa) — chave usada pelo agente principal do OpenClaw (Telegram/UI) |
| **Uso** | Resposta do assistente em conversas (incl. tools `googleSearch` / `urlContext` quando habilitadas) |

Ou seja: **a chamada exausta é sempre `generateContent` para o modelo `gemini-3-flash-preview`**, feita pelo runtime do OpenClaw quando ele tenta gerar a próxima mensagem do assistente. Os workers de research (FitBank) usam `GOOGLE_API_KEY_RESEARCH` e outro fluxo; quando o erro aparece no Telegram, é essa chamada de **conversa** que está recebendo 429.

---

## 2. O que o Google devolve (e o que a gente guarda)

O corpo do 429 pode incluir um array `error.details` com **qual quota** foi excedida, por exemplo:

```json
{
  "error": {
    "code": 429,
    "message": "Resource has been exhausted (e.g. check quota).",
    "status": "RESOURCE_EXHAUSTED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "RATE_LIMIT_EXCEEDED",
        "metadata": {
          "quota_metric": "generativelanguage.googleapis.com/generate_content_requests",
          "quota_limit_value": "5",
          "consumer": "projects/..."
        }
      }
    ]
  }
}
```

**Problema:** nos JSONL de sessão do OpenClaw (`Z:\.openclaw\agents\main\sessions\*.jsonl`), o `errorMessage` guardado hoje contém só:

- `code`: 429  
- `message`: "Resource has been exhausted (e.g. check quota)."  
- `status`: "RESOURCE_EXHAUSTED"  

Ou seja, **não estamos persistindo `error.details`** (nem headers como `retry-after`, `x-ratelimit-remaining-requests`). Por isso não dá para afirmar, só pelos logs atuais, se o limite excedido é RPM, TPM, RPD ou Search Grounding.

---

## 3. Mapeamento para as cotas do Google Cloud (FitBank Michel)

No painel **APIs e serviços → Generative Language API → Cotas e limites do sistema**, as cotas que **se aplicam a essa chamada** (generateContent, modelo gemini-3-flash) são:

| Quota (resumo) | Dimensão | O que pode estar exausto |
|----------------|----------|---------------------------|
| Request limit per model per day (free tier) | `model: gemini-3-flash` | Limite diário de **requisições** (ex.: 20/dia no free tier). |
| Request limit per model per minute (paid tier 1) | `model: gemini-3-flash` | Limite de **requisições por minuto** (ex.: 1.000/min). |
| GenerateContent Input token count per model per minute | `model: gemini-3-flash` | Limite de **tokens de entrada por minuto** (ex.: 1M/min). |
| GenerateContent **free tier** input token count per model per day | `model: gemini-3-flash` | Limite diário de **tokens** (free tier); uso alto (ex.: 306k) pode indicar proximidade do limite. |
| **Search Grounding** involved request per project per day | (projeto) | Requisições que usam **grounding com busca** (ex.: tool `googleSearch`). Uso 862 pode estar perto do limite se for "limitado". |
| GenerateContent **search request** usage | `model: gemini-3-flash` | Requisições **com search** por modelo. |

A **chamada que está exausta** consome:

- **generateContent** → conta em RPM, RPD e TPM do modelo `gemini-3-flash` / `gemini-3-flash-preview`.
- Se o agente usar **tools** `googleSearch` / `urlContext` → também conta para **Search Grounding** e **GenerateContent search request**.

Para **restabelecer** e organizar:

1. No console, ver qual dessas cotas tem **valor "limitado"** e **uso alto** (ex.: Search Grounding 862, ou free tier input tokens 306k).
2. Se aparecer **"O pico de uso em 7 dias é maior que 90%"** com valor 2, abrir a lista de cotas e identificar as **duas** que pico > 90% — essas são as candidatas a serem o recurso exausto em picos.

---

## 4. Como passar a saber qual recurso exausto na próxima vez

Para não depender só do console e conseguir ver **no nosso sistema** qual quota deu 429:

1. **Logar o 429 completo no OpenClaw**  
   Onde o cliente Google (SDK ou fetch) trata a resposta do `generateContent`, ao receber status 429:
   - guardar o **body inteiro** da resposta (incl. `error.details`);
   - guardar headers úteis: `retry-after`, `x-ratelimit-limit-*`, `x-ratelimit-remaining-*`, `x-ratelimit-reset-*`.
   Isso pode ser feito no código do OpenClaw que persiste o `errorMessage` na sessão (ex.: incluir `rawResponse` ou `details` no objeto de erro logado).

2. **Teste manual com curl**  
   Reproduzir a mesma chamada (mesmo modelo, mesmo tipo de body, com/sem tools) e, ao receber 429, inspecionar:
   - `response.body.error.details[].metadata.quota_metric`;
   - headers de rate limit.

Com isso, na próxima ocorrência você consegue dizer com precisão: **a chamada exausta é generateContent para gemini-3-flash-preview, e o recurso exausto é a quota X** (RPM, TPM, RPD ou Search Grounding).

---

## 5. Resumo

- **Chamada exausta:** `POST .../models/gemini-3-flash-preview:generateContent` com `GOOGLE_API_KEY` (conversa).
- **Recurso exausto:** algum limite da tabela acima (RPM, TPM, RPD ou Search/search request); o 429 não traz o nome da quota nos logs atuais.
- **Próximo passo para identificar:** (1) cruzar no console as cotas com uso/pico alto e (2) passar a logar `error.details` e headers de rate limit quando der 429.
