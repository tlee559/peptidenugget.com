import Link from "next/link";

export const metadata = {
  title: "How Ranking Works",
  description: "Where the default tier placements come from, what they are not, and how the affiliate links affect them.",
  alternates: { canonical: "/how-ranking-works" },
};

export default function HowRanking() {
  return (
    <main className="wrap">
      <article className="doc">
        <h1>How ranking works</h1>
        <p className="lede">
          Short version: the tiers you land on are a starting point, not a verdict.
          You drag them where you think they belong, and that is the point of the site.
        </p>

        <h2>Where the default placement comes from</h2>
        <p>
          Every board opens pre-filled so you have something to argue with rather
          than an empty grid. Those starting positions are <b>seed data</b>:
        </p>
        <ul>
          <li><b>Peptides</b> — ordered loosely by how well studied and how widely discussed a compound is. Not by how well it works.</li>
          <li><b>Amazon Finds</b> — seeded from Amazon&rsquo;s own popularity ranking for the search behind that list.</li>
          
        </ul>

        <div className="box warn">
          <p>
            None of this is clinical evidence. A compound sitting in S tier means
            people talk about it, not that it is proven, safe, or right for anyone.
          </p>
        </div>

        <h2>What the affiliate links do and don&rsquo;t change</h2>
        <p>
          We earn a commission when someone buys through a link here. That pays for
          the site. It does not buy a tier — no vendor can pay to be placed, because
          we do not sell placement at all.
        </p>
        <p>
          The honest caveat: a product has to be <b>purchasable</b> to appear on the
          Amazon-backed lists. That is a real selection effect and worth knowing.
          It is also why bacteriostatic water is not on the supplies list — Amazon
          does not sell it, so it could not be listed accurately.
        </p>

        <h2>Sharing your version</h2>
        <p>
          Rearrange a board and the share link updates as you go. The whole
          arrangement is encoded in the URL itself, so anyone who opens it sees your
          exact list — nothing is stored on our side and you do not need an account.
        </p>

        <h2>What&rsquo;s coming</h2>
        <p>
          The version of this that actually matters is aggregate: hundreds of
          people&rsquo;s rankings averaged into one community tier list, so you can see
          where consensus sits and where it splits. That needs accounts, which is
          the next thing being built.
        </p>

        <p>
          Think something is badly placed?{" "}
          <Link href="/submit">Tell us, or submit a product we&rsquo;re missing.</Link>
        </p>
      </article>
    </main>
  );
}
