export const metadata = {
  title: "Submit a Product",
  description: "Suggest a product for a PeptideNugget tier list, or request a new list.",
  alternates: { canonical: "/submit" },
};

export default function Submit() {
  return (
    <main className="wrap">
      <article className="doc">
        <h1>Submit a product</h1>
        <p className="lede">
          Missing something obvious? Send it over and it gets added on the next pass.
        </p>

        <div className="box good">
          <h3>hello@peptidenugget.com</h3>
          <p>Subject line: <code>Submit</code> — and include the link.</p>
        </div>

        <h2>What to include</h2>
        <ul>
          <li><b>Which list</b> it belongs on — Peptides or Amazon Finds.</li>
          <li><b>A link</b> to the exact product. An Amazon link is ideal; the ASIN is what we actually key on.</li>
          <li><b>One line on why</b> it deserves a spot.</li>
        </ul>

        <h2>What gets accepted</h2>
        <ul>
          <li>Products that are genuinely purchasable. If we can&rsquo;t link it accurately, we won&rsquo;t list it.</li>
          <li>Well-known research compounds for the peptide list.</li>
        </ul>

        <h2>What doesn&rsquo;t</h2>
        <ul>
          <li><b>Peptide vendors and sources.</b> We don&rsquo;t rank them, at all.</li>
          <li>Anything requiring a claim about treating a condition.</li>
          <li>Paid placement. It isn&rsquo;t for sale — see <a href="/how-ranking-works">how ranking works</a>.</li>
        </ul>

        <h2>Want a whole new list?</h2>
        <p>
          Say what it would rank and roughly what belongs on it. Lists that are
          fun to argue about beat lists that are merely complete.
        </p>
      </article>
    </main>
  );
}
