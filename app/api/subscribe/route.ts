import { NextResponse } from "next/server";

/**
 * POST /api/subscribe   { email, source, category, product }
 *
 * Two sinks, deliberately independent:
 *   1. Supabase `subscribers` — our own copy, written first so the list is
 *      ours and survives changing ESP.
 *   2. Mailgun mailing list — only if MAILGUN_API_KEY + MAILGUN_LIST are set.
 *
 * Mailgun failing never fails the request: the caller is mid-affiliate-click
 * and about to be handed to Amazon. Losing a signup is cheap; blocking the
 * commission is not.
 */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

type Result = { ok: boolean; error?: string; skipped?: string };

async function toSupabase(row: Record<string, unknown>): Promise<Result> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, skipped: "supabase not configured" };

  const r = await fetch(`${url}/rest/v1/subscribers`, {
    method: "POST",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=minimal",   // re-signup is a no-op
    },
    body: JSON.stringify(row),
  });
  return r.ok ? { ok: true } : { ok: false, error: `supabase ${r.status}: ${(await r.text()).slice(0, 160)}` };
}

async function toMailgun(email: string, vars: Record<string, string>): Promise<Result> {
  const key = process.env.MAILGUN_API_KEY;
  const list = process.env.MAILGUN_LIST;
  if (!key || !list) return { ok: false, skipped: "mailgun not configured" };

  const host = process.env.MAILGUN_REGION === "eu" ? "api.eu.mailgun.net" : "api.mailgun.net";
  const body = new URLSearchParams({
    address: email,
    subscribed: "yes",
    upsert: "yes",                       // idempotent
    vars: JSON.stringify(vars),
  });
  const r = await fetch(`https://${host}/v3/lists/${encodeURIComponent(list)}/members`, {
    method: "POST",
    headers: {
      authorization: "Basic " + Buffer.from("api:" + key).toString("base64"),
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  return r.ok ? { ok: true } : { ok: false, error: `mailgun ${r.status}: ${(await r.text()).slice(0, 160)}` };
}

export async function POST(req: Request) {
  let payload: Record<string, string> = {};
  try { payload = await req.json(); } catch { /* sendBeacon Blob or bad body */ }

  const email = String(payload.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "invalid email" }, { status: 400 });

  const source = String(payload.source || "unknown").slice(0, 40);
  const category = String(payload.category || "").slice(0, 40);
  const product = String(payload.product || "").slice(0, 500);

  const [supa, mg] = await Promise.allSettled([
    toSupabase({ email, source, category, product, created_at: new Date().toISOString() }),
    toMailgun(email, { source, category }),
  ]);
  const val = (r: PromiseSettledResult<Result>): Result =>
    r.status === "fulfilled" ? r.value : { ok: false, error: String(r.reason) };

  const detail = { supabase: val(supa), mailgun: val(mg) };
  if (!detail.supabase.ok && !detail.supabase.skipped) console.error("subscribe/supabase", detail.supabase);
  if (!detail.mailgun.ok && !detail.mailgun.skipped) console.error("subscribe/mailgun", detail.mailgun);

  // 200 unless BOTH sinks failed — the visitor is Amazon-bound either way.
  const stored = detail.supabase.ok || detail.mailgun.ok;
  return NextResponse.json({ ok: stored, detail }, { status: stored ? 200 : 502 });
}
