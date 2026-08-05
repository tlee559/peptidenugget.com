import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TierBoard from "@/components/TierBoard";
import PeptideBrief from "@/components/PeptideBrief";
import { CATALOG, SLUGS, KEY_TO_SLUG, visibleCategories } from "@/lib/catalog";

/* Every visible list is a real, crawlable page with its own metadata — the
   whole reason this stopped being one static HTML file. */
export function generateStaticParams() {
  return visibleCategories().map(([key]) => ({ slug: KEY_TO_SLUG[key] }));
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
  };
}

export default async function TierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = SLUGS[slug];
  if (!key || !CATALOG[key] || CATALOG[key].hidden) notFound();
  return (
    <main className="wrap">
      {CATALOG[key].brief && <PeptideBrief />}
      <TierBoard categoryKey={key} />
    </main>
  );
}
