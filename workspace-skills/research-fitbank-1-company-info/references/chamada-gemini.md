# Chamada Gemini — Etapa Company Info

Ao executar esta etapa, a **chamada à API Gemini** deve seguir esta estrutura (parâmetros e schema). O agente monta o request com o prompt em `references/prompt.txt` (substituindo o placeholder pelo domínio da run).

## Parâmetros da requisição

- **method:** POST
- **url:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`
- **authentication:** credencial Google (ex.: `GOOGLE_API_KEY` ou `GEMINI_API_KEY` no ambiente; no n8n era `googlePalmApi`).
- **Body (JSON):**

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "<conteúdo do prompt com o domínio preenchido>" }
      ]
    }
  ],
  "generationConfig": {
    "thinkingConfig": {
      "thinkingLevel": "LOW"
    },
    "responseMimeType": "application/json",
    "responseSchema": <ver schema abaixo>
  },
  "tools": [
    { "googleSearch": {} },
    { "urlContext": {} }
  ]
}
```

O campo `contents[0].parts[0].text` deve ser o texto do prompt (references/prompt.txt) com o domínio da run no lugar do placeholder (ex.: `{{ $json.dominio }}` → domínio real).

## Schema da resposta (responseSchema)

Usar este objeto como `generationConfig.responseSchema`:

```json
{
  "type": "OBJECT",
  "properties": {
    "domain": { "type": "STRING", "description": "Input domain normalized (no protocol/path)." },
    "name": { "type": "STRING", "nullable": true, "description": "Company name (common or legal)." },
    "linkedin_url": { "type": "STRING", "nullable": true, "description": "Canonical LinkedIn company page URL (validated against domain/branding)." },
    "description": { "type": "STRING", "nullable": true, "description": "One-sentence description (max ~300 chars)." },
    "primary_industry": { "type": "STRING", "nullable": true, "description": "Single best-fit industry label." },
    "size": {
      "type": "STRING",
      "nullable": true,
      "enum": ["1-10","11-50","51-200","201-500","501-1000","1001-5000","5001-10000","10000+"],
      "description": "Employee headcount range (allowed bins)."
    },
    "type": {
      "type": "STRING",
      "enum": ["Private","Public","Subsidiary","Nonprofit","Government","Partnership","Self-employed","Unknown"],
      "description": "Organization type (allowed values)."
    },
    "location": { "type": "STRING", "nullable": true, "description": "HQ location as City, State/Region when possible." },
    "country": { "type": "STRING", "nullable": true, "description": "HQ country name (e.g., Brazil, United States)." },
    "notes": { "type": "STRING", "nullable": true, "description": "Brief justification + sources checked + why any nulls." }
  },
  "required": ["domain","name","linkedin_url","description","primary_industry","size","type","location","country","notes"]
}
```

A resposta da API virá em JSON conforme esse schema. Gravar esse resultado no banco (stage 1) conforme o protocolo da skill.
