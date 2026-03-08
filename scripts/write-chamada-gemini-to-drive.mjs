#!/usr/bin/env node
/**
 * Lê n8n-extracted.json, monta o chamada-gemini.md para cada etapa
 * e grava em Z:\workspace\skills\<skill>\references\chamada-gemini.md
 */

import fs from 'fs';
import path from 'path';

const extractedPath = path.join(process.cwd(), 'scripts', 'n8n-extracted.json');
const data = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));

const skillDirs = [
  'research-fitbank-0-svc',
  'research-fitbank-1-company-info',
  'research-fitbank-1-company-profile',
  'research-fitbank-1-company-contacts',
  'research-fitbank-2-profile-dive',
  'research-fitbank-2-profile-pain',
  'research-fitbank-2-profile-uvp',
  'research-fitbank-2-profile-case',
  'research-fitbank-2-profile-email',
  'research-fitbank-2-profile-competitor',
];

const customerProfileSchema = `{
  "type": "object",
  "properties": {
    "Company Analyzed": { "type": "string" },
    "Website": { "type": "string" },
    "Unique Selling Proposition (USP)": { "type": "string" },
    "Primary Target Industry": { "type": "array", "items": { "type": "string" } },
    "Target Company Headcount": { "type": "string" },
    "Primary Decision-Maker (Job Title)": { "type": "array", "items": { "type": "string" } },
    "Key Pain Points Solved": { "type": "array", "items": { "type": "string" } }
  },
  "required": [
    "Company Analyzed",
    "Website",
    "Unique Selling Proposition (USP)",
    "Primary Target Industry",
    "Target Company Headcount",
    "Primary Decision-Maker (Job Title)",
    "Key Pain Points Solved"
  ]
}`;

const baseDrive = 'Z:\\workspace\\skills';

for (let i = 0; i < data.length; i++) {
  const item = data[i];
  let schema = item.schema;
  if (item.name === 'CustomerProfile' && !schema) schema = customerProfileSchema;
  else if (schema && typeof schema === 'string' && schema.startsWith('=')) schema = schema.slice(1);

  const url = item.url || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
  const contentsNote = item.name === 'SVC'
    ? 'Dois blocos em contents: primeiro role "model" (prompt principal), segundo role "user" (material de dores). Use o texto do prompt em cada parts[].text.'
    : 'Um bloco em contents: role "user", parts[0].text = conteúdo do prompt (references/prompt.txt) com placeholders preenchidos.';

  let bodyBlock = `- **contents:** ${contentsNote}
- **generationConfig:** thinkingConfig.thinkingLevel "LOW", responseMimeType "application/json", responseSchema (ver schema abaixo).
- **tools:** [ { "googleSearch": {} }, { "urlContext": {} } ]`;

  let md = `# Chamada Gemini — Etapa ${item.name}

Ao executar esta etapa, a **chamada à API Gemini** deve seguir esta estrutura (parâmetros e schema). O agente monta o request com o(s) prompt(s) da etapa (substituindo placeholders conforme o payload da run).

## Parâmetros da requisição

- **method:** POST
- **url:** \`${url}\`
- **authentication:** credencial Google (ex.: GOOGLE_API_KEY ou GEMINI_API_KEY no ambiente).
- **Body (JSON):** structure:
${bodyBlock}

O campo \`contents[].parts[].text\` deve conter o(s) texto(s) do prompt desta etapa (ex.: references/prompt.txt) com os dados da run preenchidos.

## Schema da resposta (responseSchema)

Usar este objeto como \`generationConfig.responseSchema\`:

\`\`\`json
${typeof schema === 'string' ? schema.trim() : JSON.stringify(schema, null, 2)}
\`\`\`

A resposta da API virá em JSON conforme esse schema. Gravar esse resultado no banco (stage correspondente) conforme o protocolo da skill.
`;

  const skillDir = skillDirs[i];
  const refDir = path.join(baseDrive, skillDir, 'references');
  const outPath = path.join(refDir, 'chamada-gemini.md');
  if (!fs.existsSync(refDir)) fs.mkdirSync(refDir, { recursive: true });
  fs.writeFileSync(outPath, md, 'utf8');
  console.log('OK', outPath);
}

console.log('Done. 10 files written to Z:\\workspace\\skills\\*\\references\\chamada-gemini.md');
