#!/usr/bin/env node
/**
 * Build the tier board into one self-contained HTML file.
 *
 *   node build.js        ->  prototype/tier-board.html
 *
 * Everything is inlined as data URIs: the logo, the favicon, the vial art,
 * and every Amazon product photo. That means no CDN, no image proxy, no CORS
 * config, and — the reason it matters — the PNG export never hits a tainted
 * canvas. Open the output with file:// and it just works.
 *
 * Product images are cached in assets/products/ so a rebuild is offline and
 * instant; delete a file there to re-fetch it.
 */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = __dirname;
const p = (...a) => path.join(ROOT, ...a);

const TEMPLATE = p("src/board.html");
const CATALOG = p("data/catalog.json");
const OUT = p("prototype/tier-board.html");
const PUBLIC = p("public/index.html");
const CACHE = p("assets/products");

const TILE_PX = 128;   // tiles render at ~92px; 128 covers retina without bloat

function dataUri(file) {
  const ext = path.extname(file).toLowerCase();
  const mime = ext === ".png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,` + fs.readFileSync(file).toString("base64");
}

/** Downscale in place with sips (macOS built-in) so tiles stay small. */
function shrink(file, px) {
  try {
    execFileSync("sips", ["--resampleHeightWidth", String(px), String(px), file, "--out", file],
                 { stdio: "ignore" });
  } catch {
    console.warn("   ! sips failed on " + path.basename(file) + " (using full size)");
  }
}

async function cachedProductImage(asin, url) {
  if (!asin || !url) return null;
  const file = path.join(CACHE, asin + ".jpg");
  if (!fs.existsSync(file)) {
    process.stdout.write(`   fetching ${asin}… `);
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      fs.mkdirSync(CACHE, { recursive: true });
      fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
      shrink(file, TILE_PX);
      console.log((fs.statSync(file).size / 1024).toFixed(0) + "kb");
    } catch (e) {
      console.log("FAILED (" + e.message + ") — falling back to generated art");
      return null;
    }
  }
  return dataUri(file);
}

(async () => {
  let html = fs.readFileSync(TEMPLATE, "utf8");
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));

  console.log("inlining product images…");
  let withArt = 0, total = 0;
  for (const cat of Object.values(catalog)) {
    for (const item of cat.items || []) {
      if (!item.asin) continue;
      total++;
      const uri = await cachedProductImage(item.asin, item.image);
      // Replace the remote URL with the inlined copy; drop it if unavailable
      // so the tile falls back to generated art rather than a broken image.
      if (uri) { item.image = uri; withArt++; } else { delete item.image; }
    }
  }
  console.log(`   ${withArt}/${total} items have product art`);

  const assets = {
    __LOGO_SRC__: p("assets/logo-lockup.png"),
    __ICON_SRC__: p("assets/favicon.png"),
    __VIAL_SRC__: p("assets/vial-base.png"),
  };
  for (const [token, file] of Object.entries(assets)) {
    if (!html.includes(token)) throw new Error("template missing " + token);
    html = html.replace(token, dataUri(file));
  }

  if (!html.includes("__CATALOG__")) throw new Error("template missing __CATALOG__");
  html = html.replace("__CATALOG__", JSON.stringify(catalog, null, 2));

  // Two outputs, same bytes: prototype/ for local poking, public/index.html as
  // the deploy artifact. It's self-contained, so any static host serves it
  // with no build step of its own.
  for (const dest of [OUT, PUBLIC]) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, html);
    console.log(`built ${path.relative(ROOT, dest)}  (${(html.length / 1024).toFixed(0)}kb)`);
  }
})().catch((e) => { console.error("BUILD FAILED:", e.message); process.exit(1); });
