-- Discussion threads under each tier board.
-- Run in Supabase SQL editor, or via `supabase db push` once linked.

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,                                  -- catalog key: which board
  parent_id   uuid references public.comments(id) on delete cascade,
  author      text not null,
  body        text not null,
  likes       integer not null default 0,
  -- 'visible' | 'pending' | 'hidden'. New posts land visible; the wordlist in
  -- api/comments routes anything that reads like a health claim to 'pending'
  -- instead, so a stranger cannot put a therapeutic claim on the page next to
  -- an affiliate link without a human seeing it first.
  status      text not null default 'visible',
  -- Posts from the site itself. Badged as such in the UI — this exists so the
  -- host can ask an opening question honestly, NOT so the site can pose as a
  -- user. Never set this on content written as though from a customer.
  is_host     boolean not null default false,
  ip_hash     text,                                           -- salted hash, rate limiting only
  created_at  timestamptz not null default now(),

  constraint comments_body_len   check (char_length(body) between 1 and 2000),
  constraint comments_author_len check (char_length(author) between 1 and 40),
  constraint comments_status_ck  check (status in ('visible', 'pending', 'hidden'))
);

create index if not exists comments_category_created_idx
  on public.comments (category, created_at desc);
create index if not exists comments_parent_idx
  on public.comments (parent_id);
-- Rate limiting reads this on every POST.
create index if not exists comments_iphash_created_idx
  on public.comments (ip_hash, created_at desc);

-- PostgREST cannot express `likes = likes + 1`, and read-modify-write from the
-- route would drop concurrent likes. Do it in one statement in the database.
create or replace function public.increment_comment_likes(comment_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.comments
     set likes = likes + 1
   where id = comment_id and status = 'visible'
  returning likes;
$$;

-- Same posture as `subscribers`: RLS on with NO policies, so the public anon
-- key can neither read nor write. Every access goes through /api/comments with
-- the service-role key, which is where validation, rate limiting and the
-- claim filter live. Exposing the table directly would bypass all three.
alter table public.comments enable row level security;

comment on table public.comments is
  'Board discussion. Service-role access only; RLS denies anon by design. '
  'is_host marks posts by the site itself and is surfaced in the UI — it must '
  'never be used for content written to look like an independent user.';
