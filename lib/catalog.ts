import raw from "@/data/catalog.json";
import site from "@/data/site.json";

export type Item = {
  name: string;
  tier: number;
  asin?: string;
  image?: string;
  url?: string;
  search?: string;
  match?: string[];
  price?: number;
};

export type Category = {
  label: string;
  title: string;
  preset: PresetKey;
  storefront?: "amazon" | "aminoclub" | "search";
  affiliateUrl?: string;
  vials?: boolean;
  hidden?: boolean;
  discover?: { search: string; match?: string[]; limit?: number };
  items: Item[];
};

export type PresetKey = "grade" | "vendor";

export const CATALOG = raw as unknown as Record<string, Category>;

/** Tier row presets. Kept in code, not the catalog — they're chrome, not content. */
export const PRESETS: Record<PresetKey, [string, string][]> = {
  grade: [["S", "#ff7f7f"], ["A", "#ffbf7f"], ["B", "#ffdf7f"], ["C", "#ffff7f"], ["D", "#bfff7f"], ["F", "#7fffff"]],
  vendor: [["Would Reorder", "#ff7f7f"], ["Solid", "#ffbf7f"], ["Fine", "#ffdf7f"], ["Mid", "#ffff7f"], ["Sketchy", "#bfff7f"], ["Avoid", "#7fffff"]],
};
export const PRESET_ORDER: PresetKey[] = ["grade", "vendor"];

/** URL slug <-> catalog key. Slugs are the public contract; keys are internal. */
export const SLUGS: Record<string, string> = {
  peptides: "compounds",
  supplies: "bacwater",
  "amazon-finds": "finds",
  sprays: "sprays",
  vendors: "vendors",
  "cold-storage": "cold",
};
export const KEY_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUGS).map(([slug, key]) => [key, slug])
);

export const visibleCategories = () =>
  Object.entries(CATALOG).filter(([, c]) => !c.hidden) as [string, Category][];

export const vialArt = () =>
  (site as { vialArt?: string }).vialArt === "illustration"
    ? "/img/vial-illustration.png"
    : "/img/vial-photo.png";

/**
 * One hash drives both the text-tile accent bar and the vial's hue rotation,
 * so a compound keeps the same colour in either tile style.
 */
export function hueFor(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}
export const accentFor = (name: string) => `hsl(${hueFor(name)} 62% 55%)`;

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG || "peptides03-20";

/**
 * A direct product page converts far better than a search page, so an item
 * with an ASIN links straight to it. ascsubtag mirrors the peptides.io
 * convention so clicks attribute per tier list.
 */
export function linkFor(item: Item, categoryKey: string): string {
  if (item.url) return item.url;
  const cat = CATALOG[categoryKey];
  const sub = `pn-tier-${categoryKey}`;

  // Referral partner: one program link for the whole category. We deliberately
  // do NOT append per-item params — altering a partner's referral URL risks
  // breaking their code attribution.
  if (cat?.storefront === "aminoclub" && cat.affiliateUrl) return cat.affiliateUrl;

  if (cat?.storefront !== "amazon") {
    return "https://www.google.com/search?q=" + encodeURIComponent(item.name);
  }
  return item.asin
    ? `https://www.amazon.com/dp/${item.asin}?tag=${AMAZON_TAG}&ascsubtag=${sub}`
    : `https://www.amazon.com/s?k=${encodeURIComponent(item.name)}&tag=${AMAZON_TAG}&ascsubtag=${sub}`;
}

/** Any storefront we earn from — drives both the FTC disclosure and the
 *  email-capture interstitial. */
export const isAffiliate = (categoryKey: string) =>
  CATALOG[categoryKey]?.storefront === "amazon" ||
  CATALOG[categoryKey]?.storefront === "aminoclub";
