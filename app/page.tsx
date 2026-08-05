import TierBoard from "@/components/TierBoard";
import PeptideBrief from "@/components/PeptideBrief";
import Comments from "@/components/Comments";
import { CATALOG } from "@/lib/catalog";

export const metadata = {
  title: "Community Peptide Tier Lists",
  description:
    "Rank research peptides from S to F. Drag to rank, share the link, export the image.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main className="wrap">
      <PeptideBrief count={CATALOG.compounds.items.length} />
      <TierBoard categoryKey="compounds" />
      <Comments categoryKey="compounds" boardLabel={CATALOG.compounds.label} />
    </main>
  );
}
