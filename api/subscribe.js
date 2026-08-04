/**
 * POST /api/subscribe   { email, source, category, product }
 *
 * Two sinks, deliberately independent:
 *   1. Supabase `subscribers` — our own copy, written first so the list is
 *      ours and survives changing ESP.
 *   2. Mailgun mailing list — only if MAILGUN_API_KEY + MAILGUN_LIST are set.
 *
 * Mailgun failing never fails the request: the caller is mid-affiliate-click
 * and about to be handed to Amazon. Losing a newsletter signup is cheap;
 * blocking the commission is not.
 *
 * Env (Vercel project settings):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY        server-only, bypasses RLS
 *   MAILGUN_API_KEY            private API key (starts "key-" or a raw token)
 *   MAILGUN_LIST               list address, e.g. deals@mg.peptidenugget.com
 *   MAILGUN_REGION             "eu" for EU accounts; anything else = US
 */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

async function toSupabase(row) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, skipped: "supabase not configured" };

  const r = await fetch(`${url}/rest/v1/subscribers`, {
    method: "POST",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      // Re-subscribing is a no-op rather than a 409.
      prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!r.ok) return { ok: false, error: `supabase ${r.status}: ${(await r.text()).slice(0, 160)}` };
  return { ok: true };
}

async function toMailgun(email, vars) {
  const key = process.env.MAILGUN_API_KEY;
  const list = process.env.MAILGUN_LIST;
  if (!key || !list) return { ok: false, skipped: "mailgun not configured" };

  const host = process.env.MAILGUN_REGION === "eu" ? "api.eu.mailgun.net" : "api.mailgun.net";
  const body = new URLSearchParams({
    address: email,
    subscribed: "yes",
    upsert: "yes",                       // idempotent: re-signup just updates
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
  if (r.ok) return { ok: true };
  return { ok: false, error: `mailgun ${r.status}: ${(await r.text()).slice(0, 160)}` };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  let payload = req.body;
  if (typeof payload === "string") { try { payload = JSON.parse(payload); } catch { payload = null; } }
  // sendBeacon posts a Blob; some runtimes hand it over unparsed.
  if (!payload && req.body) { try { payload = JSON.parse(String(req.body)); } catch {} }

  const email = (payload?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "invalid email" });

  const source = String(payload?.source || "unknown").slice(0, 40);
  const category = String(payload?.category || "").slice(0, 40);
  const product = String(payload?.product || "").slice(0, 500);

  const [supa, mg] = await Promise.allSettled([
    toSupabase({ email, source, category, product, created_at: new Date().toISOString() }),
    toMailgun(email, { source, category }),
  ]);

  const detail = {
    supabase: supa.status === "fulfilled" ? supa.value : { ok: false, error: String(supa.reason) },
    mailgun: mg.status === "fulfilled" ? mg.value : { ok: false, error: String(mg.reason) },
  };
  if (!detail.supabase.ok && !detail.supabase.skipped) console.error("subscribe/supabase", detail.supabase);
  if (!detail.mailgun.ok && !detail.mailgun.skipped) console.error("subscribe/mailgun", detail.mailgun);

  // 200 unless BOTH sinks failed — the visitor is Amazon-bound either way.
  const stored = detail.supabase.ok || detail.mailgun.ok;
  return res.status(stored ? 200 : 502).json({ ok: stored, detail });
};
