import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TierBoard from "@/components/TierBoard";
import PeptideBrief from "@/components/PeptideBrief";
import { CATALOG, SLUGS, KEY_TO_SLUG, routableCategories } from "@/lib/catalog";

/* Every routable list is a real page with its own metadata — the whole reason
   this stopped being one static HTML file. navHidden ad variants get a page too,
   just kept out of the nav and noindex'd (see generateMetadata). */
export function generateStaticParams() {
  return routableCategories().map(([key]) => ({ slug: KEY_TO_SLUG[key] }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const key = SLUGS[slug];
  const cat = key ? CATALOG[key] : null;
  if (!cat || cat.hidden) return {};
  return {
    title: cat.title,
    description: `Rank ${cat.items.length} ${cat.label.toLowerCase()} from S to F. Drag to rank, share your list, export the image.`,
    alternates: { canonical: `/tier/${slug}` },
    openGraph: { title: `${cat.title} — PeptideNugget`, type: "article" },
    // Ad-only A/B variants stay out of the index so two near-duplicate pages
    // don't compete as duplicate content.
    ...(cat.navHidden ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function TierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = SLUGS[slug];
  if (!key || !CATALOG[key] || CATALOG[key].hidden) notFound();
  return (
    <main className="wrap">
      {CATALOG[key].brief && <PeptideBrief count={CATALOG[key].items.length} />}
      <TierBoard categoryKey={key} />
    </main>
  );
}
