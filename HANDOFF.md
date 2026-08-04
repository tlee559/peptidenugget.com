# peptidenugget.com — handoff

Everything a new session needs to edit this site and ship it live.

> **This repo is public.** Never commit real secrets. `.gitignore` excludes
> `.env*` (except `.env.example`) — verify with `git check-ignore -v .env.local`
> before any commit that touches env files.

---

## 1. Where things are

| | |
|---|---|
| Local path | `/Users/tj/Projects/peptidenugget` |
| GitHub | `https://github.com/tlee559/peptidenugget.com` (public, branch `main`) |
| Live | https://www.peptidenugget.com (apex 308s → www) |
| Host | Vercel, project `peptidenugget-com`, team `tlee559s-projects` |
| Stack | Next.js 15 App Router · TypeScript · no CSS framework |

Secrets live in `.env.local` (gitignored). `.env.example` lists the keys.

---

## 2. Quick start

```bash
cd /Users/tj/Projects/peptidenugget
npm install
npm run dev            # http://localhost:3000
npm run build          # production build — ALWAYS run before pushing
```

Content-only edits need no code changes. See §4.

---

## 3. Layout

```
app/
  layout.tsx              header, footer, global metadata
  page.tsx                home (peptide board)
  tier/[slug]/page.tsx    every tier list, SSG, one page per category
  api/subscribe/route.ts  email capture → Supabase + Mailgun
  about|contact|privacy|terms|submit|how-ranking-works/
components/
  TierBoard.tsx           the board: drag, tier picker, share, PNG export
  TierBoard.module.css
lib/catalog.ts            typed catalog access, slugs, affiliate link building
data/catalog.json         ← the only file you edit to change content
data/site.json            vial art style
public/img/               logo, vial art, product photos
scripts/
  scrape-amazon.js        fills ASIN/image/url from Apify
  migrate.js              applies supabase/migrations/*.sql
```

---

## 4. Editing content

**All content is `data/catalog.json`.** One entry per category:

```json
"metabolic": {
  "label": "Metabolic",                       // tab text
  "title": "Metabolic Research Tier List",    // <h1> + <title>
  "preset": "grade",                          // "grade" (S–F) or "vendor"
  "storefront": "aminoclub",                  // "aminoclub" | "amazon" | "search"
  "affiliateUrl": "https://aminoclub.com?...",
  "vials": true,                              // use vial art instead of photos
  "research": true,                           // renders its tab BLACK
  "hidden": false,                            // true removes tab, route and footer link
  "items": [
    { "name": "GLP-3 (RT)", "tier": 0, "price": 69.99, "url": "https://..." }
  ]
}
```

- `tier` — row index, `0` = top (S). Use `-1` to start unranked.
- Adding a category also needs a slug in `lib/catalog.ts` → `SLUGS`.
- Hiding a category removes its tab, its route, **and** its footer link
  automatically (the footer derives from `visibleCategories()`).

**Vial art:** `data/site.json` → `"vialArt": "photo" | "illustration"`.

---

## 5. Deploying

**Pushing to `main` auto-deploys.** That's the normal path:

```bash
npm run build                       # catch errors locally first
git add -A
git commit -m "..."
git push origin main                # Vercel builds and promotes automatically
```

To force a deploy or check status, use the Vercel REST API with a token from
https://vercel.com/account/tokens:

```bash
TEAM=team_yuYc4XEtPkoa2sptXiFlsbVx
PROJ=prj_ogELciruu8SbNfRCYo7NR885m9cd
SHA=$(git rev-parse HEAD)

curl -s -X POST -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.vercel.com/v13/deployments?teamId=$TEAM&skipAutoDetectionConfirmation=1" \
  -d "{\"name\":\"peptidenugget-com\",\"target\":\"production\",
       \"gitSource\":{\"type\":\"github\",\"org\":\"tlee559\",
       \"repo\":\"peptidenugget.com\",\"ref\":\"main\",\"sha\":\"$SHA\"}}"

# poll until READY
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v13/deployments/<dpl_id>?teamId=$TEAM" | grep readyState
```

Verify live after every deploy — don't assume:

```bash
for p in / /tier/peptides /tier/sprays /about; do
  echo "$p $(curl -sL -o /dev/null -w '%{http_code}' https://www.peptidenugget.com$p)"
done
```

---

## 6. Infrastructure

| Thing | Detail |
|---|---|
| DNS | GoDaddy. Apex `A → 76.76.21.21`, `www CNAME → cname.vercel-dns.com`. Mailgun SPF/DKIM/MX on the `mg.` subdomain. Pre-Vercel backup: `ops/dns-backup-before-vercel.json` |
| Email | Mailgun, sending domain `mg.peptidenugget.com` (verified), list `deals@mg.peptidenugget.com` |
| Database | Supabase. `subscribers` table, RLS **on with no policies** — service-role only, by design (the anon key ships in the browser) |
| Amazon | Associates tag `peptides03-20`, `ascsubtag=pn-tier-<category>` |
| Scraping | Apify actor `junglee~Amazon-crawler` |

Env vars needed in **Vercel project settings** (already set):
`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `MAILGUN_API_KEY`, `MAILGUN_LIST`.

Run a DB migration: `node scripts/migrate.js` (falls back to the IPv4 pooler —
`db.<ref>.supabase.co` is IPv6-only on newer projects).

---

## 7. Gotchas — all of these cost real time

**Vercel framework setting.** If the site 404s every route while deployments
report success, check the project's `framework` is `nextjs`. It was `None`
(left over from a static-HTML era), so Vercel ran no build, looked for
`index.html` at the repo root, and served nothing. Builds "succeed" because
there is nothing to build.

**Canonical host is `www`.** `metadataBase` must be `https://www.peptidenugget.com`.
The apex 308s, and a canonical that redirects is a weak signal.

**Product images must be same-origin.** They live in `public/img/products/`.
The board draws every tile onto a canvas for the PNG export; a cross-origin
image taints that canvas and `toDataURL()` throws, killing export entirely.
Never hotlink Amazon's CDN here.

**Hidden ≠ removed from the bundle.** A category flagged `hidden` still ships
inside the client JS. If the goal is that something is *gone*, delete it from
`data/catalog.json`.

**Amazon scraping.** The Apify actor does **not** return results in start-URL
order — join on each item's `input` field. And always gate on `match` tokens:
the top search result is wrong surprisingly often ("YETI Roadie 24 cooler"
returned a Carhartt). Unmatched items are reported and left alone; a wrong ASIN
is both the wrong photo and a link to the wrong product.

**Drag state must conserve tiles.** The drop handler removes a tile before
inserting it. If the target can't be resolved and you commit anyway, the tile
is deleted. Both drag and picker paths check `before === after` and abort
otherwise. Keep that invariant.

### Testing gotchas (these produced three false alarms)

- **`--window-size` in headless Chrome is not a mobile viewport.** It crops a
  wider render. To measure real responsive layout, load the page in an
  `<iframe>` of the target width and read `scrollWidth` / `getBoundingClientRect`.
- **The drag ghost holds a cloned `[data-tile]`** and stays in the DOM as
  `display:none`. Count tiles with `[data-zone] [data-tile]`, never bare
  `[data-tile]`.
- **`npx next build && ...` hides failures.** If the build fails, the chained
  commands are skipped and an old server keeps serving a stale bundle — you
  end up debugging phantom problems. Check the build result explicitly.
- `elementFromPoint` returns `null` outside the viewport, so drop targets in a
  test must be on-screen.

---

## 8. Current state

**Visible:** Peptides (36 items, top 12 ranked) · Sprays (5) · seven research
lists — Tissue Repair, Dermal, Metabolic, Secretagogue, Cellular, Neuro,
Circadian.

**Hidden:** `finds` (Amazon Finds, 20 GHK-Cu products, real ASINs and photos —
un-hide to restore, including its email capture).

All product links go to Amino Club with `code=NUGGETS`. Email capture only
fires on `storefront: "amazon"` categories, so with `finds` hidden it never
fires.

**Ranking on the peptide list** is inferred from the storefront's per-category
"Most Popular" orderings (best rank across categories, tie-broken by breadth).
The full catalogue page is *not* popularity-sorted. If real sales data appears,
use it instead.

### Compliance constraints (Amino Club Partner Terms v1.3)

Content published alongside their referral link must not:

- describe products as for human use, or give **any** dosing, administration or
  handling instructions — a guide covering reconstitution was removed for this
- make health, performance or medical claims (the "effect" tier preset, *Life
  Changing → Made It Worse*, was retired for this)
- rank vendors — the license requires non-disparaging use of their marks, which
  a tier list cannot guarantee

FTC disclosure currently exists only in the footer. Section 5 of their terms
calls out disclosures "relegated to fine print"; an on-board `#ad` line was
built and then removed at the owner's request. Worth revisiting before volume.

### Open items

- Credentials that passed through chat have **not** been rotated: Supabase
  secret + service role + DB password, Apify token, GoDaddy PAT, Mailgun key,
  Vercel token, and the domain authCode.
- Sprays also appear inside the research lists, mirroring the storefront's own
  filters.
- `Amino H2O` is excluded — it's Research Supplies, not a peptide.
