#!/usr/bin/env node
/**
 * Lista colunas das tabelas de redação/SVC/leads (information_schema).
 * Uso: RESEARCH_DB_URL=postgresql://... node inspect-tables.js
 * Saída: JSON por tabela (para documentar no SKILL).
 */
const tables = [
  'sdria_redacao_svc_20260130',
  'sdria_redacao_leads_20260130',
  'sdria_redacao_20251014'
];

async function main() {
  const url = process.env.RESEARCH_DB_URL;
  if (!url) {
    console.error('RESEARCH_DB_URL não definida.');
    process.exit(1);
  }
  const { default: pg } = await import('pg');
  const { Client } = pg;
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const result = await client.query(
      `SELECT table_name, column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ANY($1)
       ORDER BY table_name, ordinal_position`,
      [tables]
    );
    const byTable = {};
    for (const row of result.rows) {
      const tn = row.table_name;
      if (!byTable[tn]) byTable[tn] = { table_name: tn, columns: [] };
      byTable[tn].columns.push({
        column_name: row.column_name,
        data_type: row.data_type,
        is_nullable: row.is_nullable,
        column_default: row.column_default
      });
    }
    console.log(JSON.stringify(Object.values(byTable), null, 2));
  } finally {
    await client.end();
  }
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
