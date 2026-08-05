import { NextResponse } from "next/server";
import { createHash } from "crypto";

/**
 * Board discussion.
 *
 *   GET   /api/comments?category=compounds   -> { comments: [...] }
 *   POST  /api/comments  { category, author, body, parentId? }
 *   PATCH /api/comments  { id }              -> like
 *
 * Everything goes through here rather than straight to PostgREST because the
 * anon key ships in the browser. RLS on `comments` denies anon entirely, so
 * validation, rate limiting and the claim filter below cannot be skipped by
 * talking to Supabase directly.
 */

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const MAX_BODY = 2000;
const MAX_AUTHOR = 40;
const RATE_WINDOW_MIN = 10;
const RATE_MAX_IN_WINDOW = 4;

/**
 * Phrasings that assert a compound did something to a body. A stranger putting
 * "cleared up my tendonitis" next to an affiliate link is an implied
 * therapeutic claim the site is answerable for, so these land in `pending` for
 * a human rather than going straight onto the page. Deliberately matches
 * outcome verbs, not compound names or the word "peptide" — talking about
 * price, ranking or sourcing is the whole point of the thread and stays free.
 */
const CLAIM_RE =
  /\b(cured?|curing|heal(s|ed|ing)?|treat(s|ed|ing)?|fix(es|ed)?\s+my|help(s|ed)\s+my|got\s+rid\s+of\s+my|reversed?|regrew|prevent(s|ed)?|diagnos\w+|prescrib\w+|my\s+(doctor|injury|tendon|shoulder|knee|back|gut|joint|acne|hair\s?loss))\b/i;

function ipHash(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  // Salted so the table never holds a reversible address. Not security-grade
  // — it exists to rate limit, nothing else.
  const salt = process.env.COMMENT_IP_SALT || SUPA_KEY || "peptidenugget";
  return createHash("sha256").update(salt + ip).digest("hex").slice(0, 32);
}

function supa(path: string, init: RequestInit = {}) {
  return fetch(`${SUPA_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPA_KEY as string,
      authorization: `Bearer ${SUPA_KEY}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
}

const configured = () => Boolean(SUPA_URL && SUPA_KEY);

export async function GET(req: Request) {
  if (!configured()) return NextResponse.json({ comments: [], unavailable: true });

  const category = new URL(req.url).searchParams.get("category") || "";
  if (!category) return NextResponse.json({ error: "category required" }, { status: 400 });

  const qs = new URLSearchParams({
    select: "id,parent_id,author,body,likes,is_host,created_at",
    category: `eq.${category}`,
    status: "eq.visible",
    order: "created_at.asc",
    limit: "500",
  });
  const r = await supa(`comments?${qs}`);
  // Table missing (migration not run yet) or Supabase down. Say so plainly so
  // the client can hide the whole section rather than show a composer that
  // errors on submit.
  if (!r.ok) {
    return NextResponse.json({ comments: [], unavailable: true, error: `supabase ${r.status}` });
  }

  return NextResponse.json({ comments: await r.json() });
}

export async function POST(req: Request) {
  if (!configured()) return NextResponse.json({ error: "Comments are not configured yet." }, { status: 503 });

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const category = String(payload.category || "").trim();
  const author = String(payload.author || "").trim().slice(0, MAX_AUTHOR);
  const body = String(payload.body || "").trim().slice(0, MAX_BODY);
  const parentId = payload.parentId ? String(payload.parentId) : null;
  // Bots fill hidden fields; humans never see this one.
  if (String(payload.website || "")) return NextResponse.json({ ok: true });

  if (!category) return NextResponse.json({ error: "Missing board." }, { status: 400 });
  if (author.length < 2) return NextResponse.json({ error: "Add a name (2 characters or more)." }, { status: 400 });
  if (body.length < 2) return NextResponse.json({ error: "Write a comment first." }, { status: 400 });

  const hash = ipHash(req);

  const since = new Date(Date.now() - RATE_WINDOW_MIN * 60_000).toISOString();
  const rl = await supa(
    `comments?select=id&ip_hash=eq.${hash}&created_at=gte.${since}&limit=${RATE_MAX_IN_WINDOW}`,
  );
  if (rl.ok) {
    const recent = (await rl.json()) as unknown[];
    if (recent.length >= RATE_MAX_IN_WINDOW) {
      return NextResponse.json({ error: "You're posting quickly — give it a few minutes." }, { status: 429 });
    }
  }

  const status = CLAIM_RE.test(body) ? "pending" : "visible";

  const r = await supa("comments", {
    method: "POST",
    headers: { prefer: "return=representation" },
    body: JSON.stringify({
      category,
      parent_id: parentId,
      author,
      body,
      status,
      ip_hash: hash,
    }),
  });

  if (!r.ok) {
    return NextResponse.json({ error: "Could not post that. Try again." }, { status: 502 });
  }

  const [row] = (await r.json()) as Array<Record<string, unknown>>;

  if (status === "pending") {
    return NextResponse.json({
      ok: true,
      held: true,
      message:
        "Thanks — held for review. We check anything describing a personal health outcome before it goes on the page.",
    });
  }
  return NextResponse.json({ ok: true, comment: row });
}

export async function PATCH(req: Request) {
  if (!configured()) return NextResponse.json({ error: "not configured" }, { status: 503 });

  let id = "";
  try {
    id = String(((await req.json()) as Record<string, unknown>).id || "");
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const r = await supa("rpc/increment_comment_likes", {
    method: "POST",
    body: JSON.stringify({ comment_id: id }),
  });
  if (!r.ok) return NextResponse.json({ error: "Could not like that." }, { status: 502 });

  return NextResponse.json({ ok: true, likes: await r.json() });
}
