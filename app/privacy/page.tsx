export const metadata = {
  title: "Privacy Policy",
  description: "What PeptideNugget collects, what it doesn't, and who it shares with.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <main className="wrap">
      <article className="doc">
        <h1>Privacy policy</h1>
        <p className="lede">Plain version: we collect your email only if you type it in.</p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <b>Your email</b>, only if you enter it in the newsletter prompt. We
            store it alongside which list you were on and which product you were
            heading to, so the emails are relevant.
          </li>
          <li>
            <b>Standard server logs</b> from our host, including IP address and
            browser, kept for security and troubleshooting.
          </li>
        </ul>

        <h2>What we don&rsquo;t collect</h2>
        <ul>
          <li>No accounts, so no passwords.</li>
          <li>No payment details — we never take payment.</li>
          <li>
            Your tier lists are not stored. A shared board is encoded entirely in
            the link itself, so it never reaches our server.
          </li>
        </ul>

        <h2>Cookies and local storage</h2>
        <p>
          We use one small piece of browser storage to remember whether you already
          saw the email prompt, so it doesn&rsquo;t nag you. It stays on your device.
        </p>

        <h2>Who else is involved</h2>
        <ul>
          <li><b>Vercel</b> hosts the site and keeps request logs.</li>
          <li><b>Supabase</b> stores the email list.</li>
          <li><b>Mailgun</b> sends the emails.</li>
          <li>
            <b>Amazon</b> — clicking a product link takes you to Amazon with a tag
            identifying us, so purchases are credited. Once you&rsquo;re there,
            Amazon&rsquo;s privacy policy applies, not ours.
          </li>
        </ul>

        <h2>Your choices</h2>
        <p>
          Every email has an unsubscribe link. To have your address deleted
          outright, email <b>hello@peptidenugget.com</b> and we&rsquo;ll remove it.
        </p>

        <h2>Children</h2>
        <p>This site is not intended for anyone under 18.</p>

        <p style={{ marginTop: 30, fontSize: 13, color: "var(--faint)" }}>
          This is a plain-language summary, not legal advice. Have counsel review it
          before relying on it.
        </p>
      </article>
    </main>
  );
}
