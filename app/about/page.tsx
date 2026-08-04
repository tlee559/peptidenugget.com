import Link from "next/link";

export const metadata = {
  title: "About",
  description: "What PeptideNugget is, and how it pays for itself.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <main className="wrap">
      <article className="doc">
        <h1>About PeptideNugget</h1>
        <p className="lede">
          A tier list maker for research peptides. Drag things into order, argue
          about it, share the link.
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
          Affiliate commission. If you buy through a link here, we earn a percentage
          and you pay the same price. Nothing is sponsored and placement is not for
          sale — see <Link href="/how-ranking-works">how ranking works</Link>.
        </p>

        <h2>What we don&rsquo;t do</h2>
        <ul>
          <li>We don&rsquo;t rank vendors. That helps no one and puts people at risk.</li>
          <li>
            We don&rsquo;t publish protocols, measurements, or handling instructions of
            any kind.
          </li>
          <li>
            We don&rsquo;t make claims about what any compound does, and a tier
            placement is not one.
          </li>
        </ul>

        <div className="box">
          <p>
            Compounds referenced on this site are sold for laboratory research
            purposes only. They are not approved for human consumption, and nothing
            here is medical advice.
          </p>
        </div>
      </article>
    </main>
  );
}
