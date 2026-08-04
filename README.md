# peptidenugget.com

Community tier lists for peptides, injection supplies, and Amazon finds.
Next.js (App Router) + Supabase + Mailgun, deployed on Vercel.

```bash
npm run dev      # local
npm run build    # production build
npm run scrape   # refresh Amazon links + images (needs APIFY_TOKEN)
```

## Layout

```
app/                    routes
  page.tsx              home (peptide board)
  tier/[slug]/          per-list SEO pages: peptides, supplies, amazon-finds
  guides/using-peptides/  the reconstitution guide
  api/subscribe/        email capture endpoint
components/TierBoard.tsx  the board (client component)
lib/catalog.ts          typed access to the catalog + link building
data/catalog.json       ← the only file you edit to change content
data/site.json          site settings (vial art style)
public/img/             logo, vial art, product photos
scripts/scrape-amazon.js
```

## Adding or changing an item

Edit `data/catalog.json`:

```json
{
  "name": "Yeti Roadie",
  "tier": 0,
  "search": "YETI Roadie 24 cooler",
  "match": ["yeti", "roadie"]
}
```

- `tier` — row index (0 = top). `-1` leaves it unranked.
- `search` / `match` — Amazon-only. `search` is the query; `match` lists tokens
  every candidate title must contain.

Then `npm run scrape` fills in `asin`, `image`, `url`.

### Why `match` exists

The top Amazon search result is wrong surprisingly often — "YETI Roadie 24
cooler" once returned a Carhartt cooler. The scraper pulls 5 candidates and
keeps the first whose title contains every `match` token. **If nothing matches,
the item is reported and left unchanged.** A wrong ASIN is worse than none: it
becomes both the wrong photo and a link to the wrong product.

Scraping only fills gaps by default since Apify bills per item. Use
`npm run scrape -- --all` to force a refresh.

### Discovery mode

A category can build its own item list from a search instead of a hand-written
list — that's how Amazon Finds works:

```json
"discover": { "search": "GHK-Cu copper peptide serum", "match": ["copper"], "limit": 20 }
```

## Categories

| Key | Slug | Links | Tiles |
|---|---|---|---|
| `compounds` | `/tier/peptides` | plain search | colour-coded vial art |
| `bacwater` | `/tier/supplies` | Amazon | product photos |
| `finds` | `/tier/amazon-finds` | Amazon | product photos |
| `vendors`, `cold` | *hidden* | — | — |

Amazon does not sell bacteriostatic water — every search returns empty vials,
storage cases, or irrigation water. That category covers **supplies** instead
(syringes, prep pads, sharps, filters), which Amazon stocks and which monetise.

Vendors stays hidden: nothing there is purchasable through an affiliate
programme, and ranking gray-market sources is the riskiest content on the site.

## Vial art

`data/site.json` → `"vialArt": "photo" | "illustration"`. Both are
red-liquid-on-grey, so hue rotation colour-codes either style per compound.

## Product images

Downloaded to `public/img/products/<asin>.jpg` and served from our own origin.
That is not just tidiness: the board draws every tile onto a canvas to produce
the shareable PNG, and a cross-origin image taints that canvas and breaks export
entirely.

## Sharing

Board state encodes into the URL hash (`#s=…`): tier assignments, tray order,
and any custom labels, colours, or title. Hash rather than query string, so it
never reaches the server. Malformed links fall back to the default board.

## Email capture

Clicking an Amazon-backed tile shows one modal: subscribe or skip. **The product
link opens either way** — the offer is why they clicked. The signup is
fire-and-forget (`sendBeacon`), so a subscribe outage never delays the affiliate
hand-off.

`app/api/subscribe/route.ts` writes to Supabase first (our list, our copy) and
to a Mailgun list second. Mailgun failing never fails the request.

Run `supabase/migrations/0001_subscribers.sql` once. It enables RLS with no
policies on purpose: the anon key ships in the browser, so without it the
subscriber list would be world-readable.

## Environment

Copy `.env.example` to `.env.local`. `.gitignore` excludes `.env*`.

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | project URL |
| `SUPABASE_SECRET_KEY` | server-only, bypasses RLS |
| `MAILGUN_API_KEY` | private API key |
| `MAILGUN_LIST` | `deals@mg.peptidenugget.com` |
| `APIFY_TOKEN` | Amazon scraping |

## Infrastructure

- **DNS** — GoDaddy. Apex `A → 76.76.21.21`, `www CNAME → cname.vercel-dns.com`.
  Mailgun SPF/DKIM/MX live on the `mg.` subdomain. Pre-Vercel state is backed up
  in `ops/dns-backup-before-vercel.json`.
- **Mailgun** — sending domain `mg.peptidenugget.com` (verified), list
  `deals@mg.peptidenugget.com`.
- **Affiliate** — Amazon Associates tag `peptides03-20`, with
  `ascsubtag=pn-tier-<category>` so clicks attribute per tier list.
