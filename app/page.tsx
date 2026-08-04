import TierBoard from "@/components/TierBoard";

export const metadata = {
  title: "Community Peptide Tier Lists",
  description:
    "Rank research peptides from S to F. Drag to rank, share the link, export the image.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main className="wrap">
      <TierBoard categoryKey="compounds" />
    </main>
  );
}
