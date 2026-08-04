#!/usr/bin/env node
/**
 * Apply supabase/migrations/*.sql in order.
 *
 *   node scripts/migrate.js
 *
 * Supabase's direct host (db.<ref>.supabase.co) is IPv6-only on newer
 * projects, so we fall back to the IPv4 pooler if the direct connect fails.
 * Every migration is written to be idempotent, so re-running is safe.
 */
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const DIR = path.join(__dirname, "..", "supabase", "migrations");

function envFile() {
  const p = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(p)) return {};
  return Object.fromEntries(
    fs.readFileSync(p, "utf8").split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
  );
}

async function connect(urls) {
  const errors = [];
  for (const { label, url } of urls) {
    const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    try {
      await c.connect();
      console.log(`connected via ${label}`);
      return c;
    } catch (e) {
      errors.push(`${label}: ${e.message}`);
      try { await c.end(); } catch {}
    }
  }
  throw new Error("could not connect —\n  " + errors.join("\n  "));
}

(async () => {
  const env = { ...envFile(), ...process.env };
  const direct = env.SUPABASE_DB_URL;
  if (!direct) throw new Error("SUPABASE_DB_URL not set");

  const m = direct.match(/postgres:([^@]*)@db\.([a-z0-9]+)\.supabase\.co/);
  const candidates = [{ label: "direct", url: direct }];
  if (m) {
    const [, pass, ref] = m;
    // Pooler wants the project ref folded into the username.
    for (const region of ["us-east-1", "us-west-1", "us-east-2", "eu-central-1"]) {
      candidates.push({
        label: `pooler ${region}`,
        url: `postgresql://postgres.${ref}:${pass}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
      });
    }
  }

  const client = await connect(candidates);
  try {
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
    for (const f of files) {
      process.stdout.write(`  ${f} … `);
      await client.query(fs.readFileSync(path.join(DIR, f), "utf8"));
      console.log("ok");
    }
    const { rows } = await client.query(
      `select column_name, data_type from information_schema.columns
       where table_schema='public' and table_name='subscribers' order by ordinal_position`
    );
    console.log(`\nsubscribers table: ${rows.length} columns`);
    rows.forEach((r) => console.log(`   ${r.column_name.padEnd(12)} ${r.data_type}`));
    const rls = await client.query(
      `select relrowsecurity from pg_class where relname='subscribers' and relnamespace='public'::regnamespace`
    );
    console.log(`RLS enabled: ${rls.rows[0]?.relrowsecurity}`);
  } finally {
    await client.end();
  }
})().catch((e) => { console.error("MIGRATE FAILED:", e.message); process.exit(1); });
