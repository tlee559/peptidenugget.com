-- Email capture from the tier board.
-- Run in Supabase SQL editor, or via `supabase db push` once linked.

create table if not exists public.subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  source      text,                       -- e.g. "tier-board"
  category    text,                       -- which tier list they clicked from
  product     text,                       -- the affiliate URL they were headed to
  created_at  timestamptz not null default now()
);

-- Re-subscribing must be a no-op, not a 409. api/subscribe.js relies on this
-- unique index for `Prefer: resolution=merge-duplicates`.
create unique index if not exists subscribers_email_key
  on public.subscribers (lower(email));

create index if not exists subscribers_created_at_idx
  on public.subscribers (created_at desc);

-- RLS on with NO policies. The anon key is public — it ships in the browser —
-- so without this the whole subscriber list would be readable by anyone who
-- opened devtools. Only service_role (which bypasses RLS) can touch this
-- table, and that key lives server-side in the Vercel env only.
alter table public.subscribers enable row level security;

comment on table public.subscribers is
  'Email captures from affiliate-click modal. Service-role access only; RLS denies anon by design.';
