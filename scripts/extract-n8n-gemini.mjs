#!/usr/bin/env node
/**
 * Lê os 10 JSONs do n8n e extrai, de cada um, os parameters do HTTP Request (Gemini)
 * e o responseSchema (do node "Edit Fields - schema" ou inline no jsonBody).
 * Saída: um JSON com array { index, name, url, bodyTemplate, schema }.
 */

import fs from 'fs';
import path from 'path';

const dir = process.argv[2] || 'C:\\Users\\michel.madeira\\OneDrive\\OS\\Downloads\\MKTDirector\\MKTDIRECTOR-RESEARCH_IA-20251112\\DFT-RESEARCH_FITBANK-20260206\\DFT-RESEARCH_FITBANK-FLUXO_PROMPTS-20260206-n8n';

const fileToIndex = [
  'dft-BuscaAI-Company-Prompt_0-SVC-202601229.json',
  'dft-BuscaAI-Company-Prompt_1-CompanyInfo-202601229 copy.json',
  'dft-BuscaAI-Company-Prompt_2-CustomerProfile-20260127 copy.json',
  'dft-BuscaAI-Company-Prompt_3-SearchContacts-20260128 copy.json',
  'dft-BuscaAI-Lead-Prompt_1-Deepdive-20260129.json',
  'dft-BuscaAI-Lead-Prompt_2-PainPoints-20260130 copy.json',
  'dft-BuscaAI-Lead-Prompt_3-UVPMatch-20260130 copy.json',
  'dft-BuscaAI-Lead-Prompt_4-CaseStudy-20260130 copy.json',
  'dft-BuscaAI-Lead-Prompt_5-EmailBuilder-20260130 copy.json',
  'dft-BuscaAI-Lead-Prompt_6-Competitors-20260130 copy.json',
];

const names = ['SVC', 'CompanyInfo', 'CustomerProfile', 'SearchContacts', 'Deepdive', 'PainPoints', 'UVPMatch', 'CaseStudy', 'EmailBuilder', 'Competitors'];

const out = [];

for (let i = 0; i < fileToIndex.length; i++) {
  const f = fileToIndex[i];
  const fp = path.join(dir, f);
  if (!fs.existsSync(fp)) {
    out.push({ index: i, name: names[i], error: 'file not found', file: f });
    continue;
  }
  const raw = fs.readFileSync(fp, 'utf8');
  let w;
  try {
    w = JSON.parse(raw);
  } catch (e) {
    out.push({ index: i, name: names[i], error: e.message, file: f });
    continue;
  }
  const httpNode = w.nodes.find((n) => n.type === 'n8n-nodes-base.httpRequest' && (n.name || '').includes('Gemini'));
  const schemaNode = w.nodes.find((n) => (n.name || '') === 'Edit Fields - schema');

  let schema = null;
  if (schemaNode?.parameters?.assignments?.assignments) {
    const a = schemaNode.parameters.assignments.assignments.find((x) => x.name === 'schema');
    if (a?.value) schema = a.value;
  }
  const url = httpNode?.parameters?.url?.replace(/^=/, '') || '';
  const jsonBody = httpNode?.parameters?.jsonBody || '';
  const bodyTemplate = jsonBody.replace(/=\s*/, '').replace(/\{\{\s*\$node\[[^\]]+\]\.json\.schema\s*\}\}/g, '<responseSchema>').replace(/\{\{\s*JSON\.stringify\([^)]+\)\s*\}\}/g, '<prompt_text>');

  out.push({
    index: i,
    name: names[i],
    file: f,
    url,
    bodyTemplate: bodyTemplate.slice(0, 500) + (bodyTemplate.length > 500 ? '...' : ''),
    hasSchema: !!schema,
    schema: schema || null,
  });
}

const outPath = path.join(process.cwd(), 'scripts', 'n8n-extracted.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('Written to', outPath);
