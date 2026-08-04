/**
 * POST /api/subscribe   { email, source, category, product }
 *
 * Two sinks, deliberately independent:
 *   1. Supabase `subscribers` — our own copy, always written first so the
 *      list is ours and survives changing ESP.
 *   2. Mailchimp — only if MAILCHIMP_API_KEY + MAILCHIMP_AUDIENCE_ID are set.
 *
 * Mailchimp failing never fails the request: the caller is mid-affiliate-
 * click and is about to be sent to Amazon. Losing a newsletter signup is
 * cheap; blocking the commission is not.
 *
 * Env (set in Vercel project settings):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY  (server-only, bypasses RLS)
 *   MAILCHIMP_API_KEY   — ends in "-usX"; that suffix is the datacentre
 *   MAILCHIMP_AUDIENCE_ID
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

async function toMailchimp(email, tags) {
  const key = process.env.MAILCHIMP_API_KEY;
  const audience = process.env.MAILCHIMP_AUDIENCE_ID;
  if (!key || !audience) return { ok: false, skipped: "mailchimp not configured" };

  // Mailchimp keys are "<secret>-us21"; the suffix picks the API host.
  const dc = key.split("-").pop();
  const r = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${audience}/members`, {
    method: "POST",
    headers: {
      authorization: "Basic " + Buffer.from("anystring:" + key).toString("base64"),
      "content-type": "application/json",
    },
    body: JSON.stringify({ email_address: email, status: "subscribed", tags }),
  });
  if (r.ok) return { ok: true };
  const body = await r.text();
  // 400 "Member Exists" is a success from our point of view.
  if (r.status === 400 && /already a list member|Member Exists/i.test(body)) {
    return { ok: true, note: "already subscribed" };
  }
  return { ok: false, error: `mailchimp ${r.status}: ${body.slice(0, 160)}` };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  let payload = req.body;
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); } catch { payload = null; }
  }
  // sendBeacon posts a Blob; some runtimes hand it over unparsed.
  if (!payload && req.body) { try { payload = JSON.parse(String(req.body)); } catch {} }

  const email = (payload?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "invalid email" });

  const source = String(payload?.source || "unknown").slice(0, 40);
  const category = String(payload?.category || "").slice(0, 40);
  const product = String(payload?.product || "").slice(0, 500);

  const [supa, mc] = await Promise.allSettled([
    toSupabase({ email, source, category, product, created_at: new Date().toISOString() }),
    toMailchimp(email, [source, category].filter(Boolean)),
  ]);

  const detail = {
    supabase: supa.status === "fulfilled" ? supa.value : { ok: false, error: String(supa.reason) },
    mailchimp: mc.status === "fulfilled" ? mc.value : { ok: false, error: String(mc.reason) },
  };
  if (!detail.supabase.ok) console.error("subscribe/supabase", detail.supabase);
  if (!detail.mailchimp.ok && !detail.mailchimp.skipped) console.error("subscribe/mailchimp", detail.mailchimp);

  // 200 unless BOTH sinks failed — the visitor is being sent to Amazon either way.
  const anyStored = detail.supabase.ok || detail.mailchimp.ok;
  return res.status(anyStored ? 200 : 502).json({ ok: anyStored, detail });
};
