#!/usr/bin/env node
/**
 * Refresh Amazon offer links and product images in data/catalog.json.
 *
 *   APIFY_TOKEN=... node scripts/scrape-amazon.js
 *
 * Only touches categories with "storefront": "amazon", and only items that
 * carry a "search" term. For each it pulls 5 candidates and keeps the first
 * whose title contains every token in "match".
 *
 * If nothing matches, the item is REPORTED AND LEFT ALONE. A wrong ASIN is
 * worse than none: it becomes both the wrong photo and a link to the wrong
 * product. Widen "search"/"match" and re-run rather than accepting a guess.
 *
 * Writes asin + image + url back into catalog.json. Then: node build.js
 */
const fs = require("node:fs");
const path = require("node:path");

const CATALOG = path.join(__dirname, "..", "data", "catalog.json");
const ACTOR = "junglee~Amazon-crawler";
const BATCH = 4;                       // keeps each run-sync call under its ~300s cap

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) { console.error("APIFY_TOKEN not set (see .env.local)"); process.exit(1); }

const TAG = process.env.AMAZON_ASSOCIATE_TAG || "peptides03-20";
const REFRESH_ALL = process.argv.includes("--all");

const searchUrl = (term) => "https://www.amazon.com/s?k=" + encodeURIComponent(term);

/** Amazon size suffixes like ._AC_SY300_ — strip for the original file. */
const fullRes = (u) => (u ? u.replace(/\._[A-Z0-9_,]+_\.(jpg|jpeg|png)/i, ".$1") : null);

/**
 * Amazon titles are 150+ chars of keyword stuffing. Take the first clause and
 * cap it, so a 92px tile shows something a human recognises.
 */
function shortName(hit) {
  // Split on comma, pipe, bracket, or a SPACED dash only. A bare hyphen must
  // survive or "GHK-Cu Copper Serum" truncates to "GHK".
  let t = (hit.title || "").split(/[,|(\[]|\s[–—-]\s/)[0].trim().replace(/\s+/g, " ");
  if (t.length > 28) {
    const words = t.split(" ");
    t = "";
    for (const w of words) {
      if ((t + " " + w).trim().length > 28) break;
      t = (t + " " + w).trim();
    }
  }
  return t || hit.brand || hit.asin;
}

/** Amazon listings repeat brand names; keep tile labels distinguishable. */
function uniquify(items) {
  const seen = new Map();
  for (const it of items) {
    const base = it.name;
    let n = seen.get(base) || 0;
    seen.set(base, ++n);
    if (n > 1) {
      // borrow the next distinctive word from the full title
      const extra = (it.matched_title || "")
        .slice(base.length)
        .match(/[A-Za-z0-9%.]{3,}/g) || [];
      const word = extra.find((w) => !base.toLowerCase().includes(w.toLowerCase()));
      it.name = word ? `${base} ${word}`.slice(0, 30) : `${base} ${n}`;
    }
  }
  return items;
}

/** Pull the top N results for one search term, filtered by match tokens. */
async function discover(term, need, limit) {
  const r = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${TOKEN}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        categoryOrProductUrls: [{ url: searchUrl(term) }],
        maxItemsPerStartUrl: Math.min(limit, 20),   // actor caps at 20
        scrapeProductDetails: true,
        proxyConfiguration: { useApifyProxy: true },
      }),
      signal: AbortSignal.timeout(300000),
    }
  );
  if (!r.ok) throw new Error(`apify ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const items = await r.json();
  const toks = need.map((s) => s.toLowerCase());
  const seen = new Set();
  return items.filter((p) => {
    if (!p || !p.asin || seen.has(p.asin)) return false;
    const t = (p.title || "").toLowerCase();
    if (!toks.every((tok) => t.includes(tok))) return false;
    seen.add(p.asin);
    return true;
  });
}

async function runBatch(terms) {
  const r = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${TOKEN}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        categoryOrProductUrls: terms.map((t) => ({ url: searchUrl(t) })),
        maxItemsPerStartUrl: 5,
        scrapeProductDetails: true,
        proxyConfiguration: { useApifyProxy: true },
      }),
      signal: AbortSignal.timeout(300000),
    }
  );
  if (!r.ok) throw new Error(`apify ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

(async () => {
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const misses = [];
  let updated = 0;

  for (const [catKey, cat] of Object.entries(catalog)) {
    if (cat.storefront !== "amazon") continue;

    // Discovery mode: instead of matching a hand-written list, take the top N
    // search results and build the item list from them. For categories where
    // "show me what Amazon has" is the point.
    if (cat.discover) {
      if (cat.items?.length && !REFRESH_ALL) {
        console.log(`\n${catKey}: ${cat.items.length} discovered items (use --all to re-discover)`);
        continue;
      }
      const { search, match = [], limit = 15 } = cat.discover;
      console.log(`\n${catKey}: discovering "${search}" (top ${limit})`);
      const found = await discover(search, match, limit);
      cat.items = found.map((hit, i) => ({
        name: shortName(hit),
        tier: Math.min(Math.floor(i / 2), 5),   // seeded from Amazon's own rank
        asin: hit.asin,
        image: fullRes(hit.thumbnailImage || (hit.highResolutionImages || [])[0]),
        url: `https://www.amazon.com/dp/${hit.asin}?tag=${TAG}&ascsubtag=pn-tier-${catKey}`,
        matched_title: hit.title,
      }));
      uniquify(cat.items);
      updated += cat.items.length;
      cat.items.forEach((it) => console.log(`    ${it.name.padEnd(26)} ${it.asin}`));
      if (!cat.items.length) misses.push(`${catKey} — discovery returned nothing`);
      continue;
    }
    // Apify bills per scraped item, so by default only fill in what's
    // missing. Pass --all to refresh links/images that already resolved.
    const todo = (cat.items || []).filter((i) => i.search && (REFRESH_ALL || !i.asin));
    if (!todo.length) { console.log(`\n${catKey}: nothing to do (use --all to refresh)`); continue; }

    console.log(`\n${catKey}: ${todo.length} items`);
    for (let i = 0; i < todo.length; i += BATCH) {
      const chunk = todo.slice(i, i + BATCH);
      process.stdout.write(`  batch ${Math.floor(i / BATCH) + 1}… `);
      let items;
      try { items = await runBatch(chunk.map((it) => it.search)); }
      catch (e) { console.log("FAILED " + e.message); continue; }
      console.log(`${items.length} candidates`);

      for (const item of chunk) {
        // The actor does not preserve input order; every result carries
        // `input` = the search URL we sent, so join on that.
        const mine = items.filter((c) => c && c.asin && c.input === searchUrl(item.search));
        const need = (item.match || []).map((s) => s.toLowerCase());
        const hit = mine.find((c) => {
          const t = (c.title || "").toLowerCase();
          return need.every((tok) => t.includes(tok));
        });
        if (!hit) {
          misses.push(`${catKey}/${item.name} — ${mine.length} candidates, none matched [${need.join(" ")}]`);
          continue;
        }
        item.asin = hit.asin;
        item.image = fullRes(hit.thumbnailImage || (hit.highResolutionImages || [])[0]);
        item.url = `https://www.amazon.com/dp/${hit.asin}?tag=${TAG}&ascsubtag=pn-tier-${catKey}`;
        item.matched_title = hit.title;   // so a human can eyeball what we picked
        updated++;
        console.log(`    ${item.name.padEnd(22)} ${hit.asin}  ${(hit.title || "").slice(0, 44)}`);
      }
    }
  }

  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2));
  console.log(`\n${updated} items updated -> data/catalog.json`);
  if (misses.length) {
    console.log("\nNO CONFIDENT MATCH (left unchanged):");
    misses.forEach((m) => console.log("  - " + m));
  }
  console.log("\nnext: node build.js");
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
