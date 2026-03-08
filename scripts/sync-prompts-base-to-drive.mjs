#!/usr/bin/env node
/**
 * Copia os 5 prompts-base (etapas 3–7) das skills do drive para workspace/prompts-base/.
 * Uso: node scripts/sync-prompts-base-to-drive.mjs [DIR_DRIVE]
 * Ex.: node scripts/sync-prompts-base-to-drive.mjs Z:\workspace
 * Se DIR_DRIVE não for passado, usa process.env.WORKSPACE_DRIVE ou Z:\workspace.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const DIR_DRIVE = process.argv[2] || process.env.WORKSPACE_DRIVE || 'Z:\\workspace';
const SKILLS = join(DIR_DRIVE, 'skills');
const PROMPTS_BASE = join(DIR_DRIVE, 'prompts-base');

const MAP = [
  { n: 3, skill: 'research-fitbank-1-company-contacts' },
  { n: 4, skill: 'research-fitbank-2-profile-dive' },
  { n: 5, skill: 'research-fitbank-2-profile-pain' },
  { n: 6, skill: 'research-fitbank-2-profile-uvp' },
  { n: 7, skill: 'research-fitbank-2-profile-case' },
];

if (!existsSync(SKILLS)) {
  console.error('Pasta de skills não encontrada:', SKILLS);
  process.exit(1);
}

if (!existsSync(PROMPTS_BASE)) {
  mkdirSync(PROMPTS_BASE, { recursive: true });
  console.log('Criada pasta:', PROMPTS_BASE);
}

for (const { n, skill } of MAP) {
  const src = join(SKILLS, skill, 'references', 'prompt.txt');
  const dest = join(PROMPTS_BASE, `prompt_${n}.txt`);
  if (!existsSync(src)) {
    console.warn('Origem não encontrada:', src);
    continue;
  }
  const content = readFileSync(src, 'utf8');
  writeFileSync(dest, content, 'utf8');
  console.log(`OK prompt_${n}.txt (${content.length} bytes) <- ${skill}`);
}

console.log('Concluído. Verifique', PROMPTS_BASE);
