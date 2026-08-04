# peptidenugget

Community tier lists for peptides, injection supplies, and cold storage gear.

## The whole system

One data file, two commands.

```
data/catalog.json     <- the only file you edit to change content
src/board.html        <- the page template
build.js              <- inlines everything -> prototype/tier-board.html
scripts/scrape-amazon.js  <- refreshes Amazon links + images into the catalog
```

```bash
npm run build     # rebuild the page
npm run open      # rebuild and open it
npm run scrape    # refresh Amazon links/images (needs APIFY_TOKEN)
```

The built page is a **single self-contained HTML file**. Logo, favicon, vial
art, and every product photo are inlined as data URIs — no CDN, no image
proxy, no CORS setup. Open it with `file://` and it works.

That isn't only convenience: the board draws every tile onto a canvas to
produce the shareable PNG, and a cross-origin image would taint that canvas
and break export entirely. Inlining sidesteps it.

## Adding or changing an item

Edit `data/catalog.json`. Each item:

```json
{
  "name": "Yeti Roadie",
  "tier": 0,
  "search": "YETI Roadie 24 cooler",
  "match": ["yeti", "roadie"]
}
```

- `tier` — row index (0 = top). Use `-1` to leave it unranked.
- `search` / `match` — Amazon-only. `search` is the query; `match` lists
  tokens every candidate title must contain.

Then `npm run scrape` fills in `asin`, `image`, and `url`, and `npm run build`
bakes it into the page.

### Why `match` exists

The top Amazon search result is wrong surprisingly often — "YETI Roadie 24
cooler" returned a Carhartt cooler. The scraper pulls 5 candidates and keeps
the first whose title contains every `match` token. **If nothing matches, the
item is reported and left unchanged.** A wrong ASIN is worse than none: it
becomes both the wrong photo and a link to the wrong product. Widen `search`
or loosen `match` and re-run.

## Categories

| Key | Tab | Links | Tiles |
|---|---|---|---|
| `compounds` | Peptides | plain search | color-coded vial art |
| `bacwater` | Bac Water & Supplies | Amazon | product photos |
| `cold` | Coolers & Storage | Amazon | product photos |
| `vendors` | *hidden* (`"hidden": true`) | — | — |

Amazon does not sell bacteriostatic water — every search returns empty vials,
storage cases, or irrigation water. The **supplies** in that category
(syringes, prep pads, sharps containers, filters) are stocked and monetize
fine; the water itself needs a non-Amazon route.

Vendors is hidden because nothing there is purchasable through an affiliate
programme, and ranking gray-market sources is the riskiest content on the
site. Flip `"hidden"` to re-enable it.

## Affiliate links

Amazon items link to `/dp/<ASIN>?tag=peptides03-20&ascsubtag=pn-tier-<category>`,
matching the peptides.io convention so clicks attribute per tier list.

Consider routing through the controller's `/api/lp/az` redirector instead of
linking Amazon directly — otherwise these clicks produce no `lp_clicks` rows
and no Meta CAPI `AffiliateClick`, which is the only conversion signal Amazon
gives you.

## Sharing

Board state encodes into the URL hash (`#s=…`): tier assignments, tray order,
and any custom labels, colors, or title. Hash rather than query string, so it
never reaches the server. Malformed links fall back to the default board.

## Environment

Copy `.env.example` to `.env.local`. Never commit real values — `.gitignore`
already excludes `.env*`.
