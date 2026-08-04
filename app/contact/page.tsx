export const metadata = {
  title: "Contact",
  description: "How to reach PeptideNugget — corrections, product suggestions, and takedowns.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return (
    <main className="wrap">
      <article className="doc">
        <h1>Contact</h1>
        <p className="lede">Real inbox, read by a person.</p>

        <div className="box good">
          <h3>hello@peptidenugget.com</h3>
          <p>We usually reply within a couple of days.</p>
        </div>

        <h2>Useful things to send</h2>
        <ul>
          <li><b>A correction.</b> If something on a guide is wrong, say which line. Accuracy complaints jump the queue.</li>
          <li><b>A product we&rsquo;re missing.</b> Include a link — see <a href="/submit">submit a product</a>.</li>
          <li><b>A broken or wrong link.</b> Product listings change; tell us which tile.</li>
          <li><b>Business.</b> Partnerships and press, same address.</li>
        </ul>

        <h2>Things we can&rsquo;t help with</h2>
        <ul>
          <li>Where to buy research peptides. We don&rsquo;t answer sourcing questions.</li>
          <li>Dosing, stacking, or whether something is safe for you. Ask a doctor.</li>
        </ul>
      </article>
    </main>
  );
}
