export const metadata = {
  title: "How Ranking Works",
  description: "You drag them where you think they belong. That's the whole thing.",
  alternates: { canonical: "/how-ranking-works" },
};

export default function HowRanking() {
  return (
    <main className="wrap">
      <article className="doc">
        <h1>How ranking works</h1>
        <p className="lede">
          You drag them where you think they belong. That&rsquo;s it. That&rsquo;s how a
          tier list works.
        </p>

        <h2>The starting order isn&rsquo;t our opinion</h2>
        <p>
          Every board opens pre-filled so you have something to argue with instead
          of an empty grid. Move anything, anywhere. Rename the tiers, recolour
          them, add or delete rows.
        </p>

        <h2>Sharing yours</h2>
        <p>
          Rearrange a board and the share link updates as you go. Your whole
          arrangement is packed into the link itself — no account, nothing saved on
          our side. Send it to someone and they see exactly your version.
        </p>

        <h2>We earn commission</h2>
        <p>
          Product links here are affiliate links, so we earn if you buy through
          them. Nobody can pay to be placed in a tier — placement isn&rsquo;t for sale.
        </p>

        <div className="box">
          <p>
            Rankings are opinion, not clinical evidence. Nothing here is medical
            advice, and compounds referenced are sold for research purposes only.
          </p>
        </div>
      </article>
    </main>
  );
}
