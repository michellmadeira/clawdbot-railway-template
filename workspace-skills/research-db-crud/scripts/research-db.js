#!/usr/bin/env node
/**
 * Research pipeline DB — get/set/list por run_id e stage.
 * Credenciais: RESEARCH_DB_URL (Postgres) ou RESEARCH_DB_PATH (diretório para JSON por run).
 * Uso:
 *   node research-db.js get <run_id> <stage>
 *   node research-db.js set <run_id> <stage> [arquivo_com_payload]
 *   node research-db.js list <run_id>
 */

const fs = require('fs');
const path = require('path');

const [,, cmd, runId, stage, fileArg] = process.argv;

function usage() {
  console.error('Uso: research-db.js get <run_id> <stage>');
  console.error('      research-db.js set <run_id> <stage> [arquivo_com_payload]');
  console.error('      research-db.js list <run_id>');
  process.exit(1);
}

function out(obj) {
  console.log(JSON.stringify(obj));
}

function err(msg) {
  out({ error: msg });
  process.exit(1);
}

// ----- JSON file store (RESEARCH_DB_PATH = directory)
function getJsonPath() {
  const p = process.env.RESEARCH_DB_PATH;
  if (!p) return null;
  return path.resolve(p);
}

function jsonGet(runId, stage) {
  const dir = getJsonPath();
  if (!dir) return null;
  const file = path.join(dir, `${runId}.json`);
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const s = data.stages && data.stages[stage];
  if (!s) return null;
  return { payload: s.payload ?? '', status: s.status ?? 'pending', updated_at: s.updated_at };
}

function jsonSet(runId, stage, payload) {
  const dir = getJsonPath();
  if (!dir) return false;
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${runId}.json`);
  let data = { run_id: runId, stages: {} };
  if (fs.existsSync(file)) {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.stages) data.stages = {};
  }
  data.stages[stage] = { payload, status: 'concluded', updated_at: new Date().toISOString() };
  fs.writeFileSync(file, JSON.stringify(data, null, 0), 'utf8');
  return true;
}

function jsonList(runId) {
  const dir = getJsonPath();
  if (!dir) return null;
  const file = path.join(dir, `${runId}.json`);
  if (!fs.existsSync(file)) return { run_id: runId, stages: [] };
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const stages = (data.stages && Object.entries(data.stages).map(([stage, v]) => ({
    stage,
    status: v.status ?? 'pending',
    updated_at: v.updated_at
  }))) || [];
  stages.sort((a, b) => String(a.stage).localeCompare(String(b.stage)));
  return { run_id: runId, stages };
}

// ----- Postgres (RESEARCH_DB_URL)
async function pgGet(runId, stage) {
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.RESEARCH_DB_URL });
  await client.connect();
  try {
    const r = await client.query(
      'SELECT payload, status, updated_at FROM research_runs WHERE run_id = $1 AND stage = $2',
      [runId, stage]
    );
    if (r.rows.length === 0) return null;
    const row = r.rows[0];
    return {
      payload: row.payload ?? '',
      status: row.status ?? 'pending',
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null
    };
  } finally {
    await client.end();
  }
}

async function pgSet(runId, stage, payload) {
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.RESEARCH_DB_URL });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO research_runs (run_id, stage, payload, status, updated_at)
       VALUES ($1, $2, $3, 'concluded', now())
       ON CONFLICT (run_id, stage) DO UPDATE SET
         payload = EXCLUDED.payload, status = 'concluded', updated_at = now()`,
      [runId, stage, payload]
    );
  } finally {
    await client.end();
  }
}

async function pgList(runId) {
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.RESEARCH_DB_URL });
  await client.connect();
  try {
    const r = await client.query(
      'SELECT stage, status, updated_at FROM research_runs WHERE run_id = $1 ORDER BY stage',
      [runId]
    );
    return {
      run_id: runId,
      stages: r.rows.map(row => ({
        stage: row.stage,
        status: row.status ?? 'pending',
        updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null
      }))
    };
  } finally {
    await client.end();
  }
}

async function ensureTable() {
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.RESEARCH_DB_URL });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS research_runs (
        run_id TEXT NOT NULL,
        stage TEXT NOT NULL,
        payload TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (run_id, stage)
      );
    `);
  } finally {
    await client.end();
  }
}

const usePg = !!process.env.RESEARCH_DB_URL;

async function main() {
  if (!cmd || !runId) usage();

  if (cmd === 'get') {
    if (!stage) usage();
    if (usePg) {
      await ensureTable();
      const r = await pgGet(runId, stage);
      out(r || { error: 'not_found', status: null });
    } else {
      const r = jsonGet(runId, stage);
      out(r || { error: 'not_found', status: null });
    }
    return;
  }

  if (cmd === 'set') {
    if (!stage) usage();
    let payload = '';
    if (fileArg) {
      const fp = path.resolve(fileArg);
      if (!fs.existsSync(fp)) err('file_not_found: ' + fp);
      payload = fs.readFileSync(fp, 'utf8');
    } else {
      payload = fs.readFileSync(0, 'utf8');
    }
    if (usePg) {
      await ensureTable();
      await pgSet(runId, stage, payload);
    } else {
      if (!jsonSet(runId, stage, payload)) err('RESEARCH_DB_PATH not set');
    }
    out({ ok: true, run_id: runId, stage });
    return;
  }

  if (cmd === 'list') {
    if (usePg) {
      await ensureTable();
      const r = await pgList(runId);
      out(r);
    } else {
      const r = jsonList(runId);
      out(r || { run_id: runId, stages: [] });
    }
    return;
  }

  usage();
}

main().catch(e => {
  err(e.message || String(e));
});
