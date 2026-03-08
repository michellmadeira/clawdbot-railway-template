#!/usr/bin/env node
/**
 * Insere um registro na tabela sdria_redacao_svc_20260130 (apenas coluna svc).
 * id, createdate, updatedate são preenchidos por default/trigger.
 * Uso: RESEARCH_DB_URL=... node insert-svc.js <arquivo.json>
 */
import { readFileSync } from 'fs';
import pg from 'pg';

async function main() {
  const url = process.env.RESEARCH_DB_URL;
  if (!url) {
    console.error('RESEARCH_DB_URL não definida.');
    process.exit(1);
  }
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Uso: node insert-svc.js <arquivo.json>');
    process.exit(1);
  }
  const payload = JSON.parse(readFileSync(fileArg, 'utf8'));
  const svc = Array.isArray(payload) ? payload[0] : payload;
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const res = await client.query(
      'INSERT INTO sdria_redacao_svc_20260130 (svc) VALUES ($1::jsonb) RETURNING id, createdate',
      [JSON.stringify(svc)]
    );
    const row = res.rows[0];
    console.log(JSON.stringify({ id: Number(row.id), createdate: row.createdate }));
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
