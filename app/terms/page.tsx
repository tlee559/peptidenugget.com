export const metadata = {
  title: "Terms of Use",
  description: "The terms covering use of PeptideNugget.",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <main className="wrap">
      <article className="doc">
        <h1>Terms of use</h1>
        <p className="lede">Use the site, rank some things, share the link. The rest is detail.</p>

        <h2>Not medical advice</h2>
        <p>
          Everything here is general information and opinion. It is not medical
          advice and does not establish any professional relationship. Compounds
          referenced are sold for <b>laboratory research purposes only</b> and are
          not approved for human consumption. Talk to a qualified professional
          before making decisions about your health.
        </p>

        <h2>Rankings are opinion</h2>
        <p>
          Tier placements are opinion and community sentiment, not clinical
          evidence, and not a claim that anything is safe or effective. Default
          placements are seed data — see <a href="/how-ranking-works">how ranking works</a>.
        </p>

        <h2>Affiliate links</h2>
        <p>
          We earn commission on qualifying purchases made through links here, at no
          extra cost to you. As an Amazon Associate we earn from qualifying
          purchases. Prices and availability are set by the retailer and change
          without notice — what you see on Amazon is authoritative, not what you see
          here.
        </p>

        <h2>Accuracy</h2>
        <p>
          We work to keep product links and rankings correct and we fix errors when
          told about them, but the site is provided &ldquo;as is&rdquo; with no warranty.
          Product listings in particular can change underneath us.
        </p>

        <h2>Acceptable use</h2>
        <ul>
          <li>Don&rsquo;t scrape, overload, or try to break the site.</li>
          <li>Don&rsquo;t reproduce our content wholesale without credit.</li>
          <li>Don&rsquo;t use the site to promote sources of unapproved compounds.</li>
        </ul>

        <h2>Liability</h2>
        <p>
          To the fullest extent permitted by law, we are not liable for any loss or
          harm arising from use of this site or from products bought through links
          on it.
        </p>

        <h2>Changes</h2>
        <p>These terms may change. Continued use means you accept the current version.</p>

        <p style={{ marginTop: 30, fontSize: 13, color: "var(--faint)" }}>
          Plain-language summary, not legal advice. Have counsel review before relying on it.
        </p>
      </article>
    </main>
  );
}
