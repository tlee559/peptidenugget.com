import Link from "next/link";

export const metadata = {
  title: "About",
  description: "What PeptideNugget is, who makes it, and how it pays for itself.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <main className="wrap">
      <article className="doc">
        <h1>About PeptideNugget</h1>
        <p className="lede">
          A tier list maker for peptides and the gear around them. Drag things into
          order, argue about it, share the link.
        </p>

        <h2>Why it exists</h2>
        <p>
          Peptide discussion lives in scattered forum threads and Discord servers,
          and the same questions get re-asked every week. A tier list is a stupidly
          simple format that turns that into something you can look at in five
          seconds and immediately disagree with — which is exactly what gets people
          talking.
        </p>

        <h2>How it pays for itself</h2>
        <p>
          Affiliate commission on the gear lists. If you buy a cooler or a box of
          syringes through a link here, we earn a percentage and you pay the same
          price. Nothing on the site is sponsored, and placement is not for sale.
          See <Link href="/how-ranking-works">how ranking works</Link> for the full
          picture, including the parts that are less flattering.
        </p>

        <h2>What we don&rsquo;t do</h2>
        <ul>
          <li>We don&rsquo;t sell peptides, and we don&rsquo;t link to sources that do.</li>
          <li>We don&rsquo;t rank vendors. Ranking gray-market sources helps no one and puts people at risk.</li>
          <li>We don&rsquo;t give dosing protocols or medical advice.</li>
        </ul>

        <div className="box">
          <p>
            Compounds referenced on this site are sold for laboratory research
            purposes only and are not approved for human consumption.
          </p>
        </div>
      </article>
    </main>
  );
}
