import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://peptidenugget.com"),
  title: {
    default: "PeptideNugget — Community Peptide Tier Lists",
    template: "%s — PeptideNugget",
  },
  description:
    "Community tier lists for peptides, injection supplies, and copper peptide finds. Rank them yourself and share the link.",
  openGraph: {
    siteName: "PeptideNugget",
    type: "website",
    images: ["/img/logo.png"],
  },
  twitter: { card: "summary_large_image" },
};

const FOOT = {
  "Tier Lists": [
    ["Peptides", "/tier/peptides"],
    ["Supplies & Storage", "/tier/supplies"],
    ["Amazon Finds", "/tier/amazon-finds"],
  ],
  Community: [
    ["How ranking works", "/how-ranking-works"],
    ["Submit a product", "/submit"],
    ["Guides", "/guides"],
  ],
  Site: [
    ["About", "/about"],
    ["Contact", "/contact"],
    ["Privacy policy", "/privacy"],
    ["Terms of use", "/terms"],
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-head">
          <div className="wrap">
            <Link className="brand" href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/logo.png" alt="PeptideNugget" />
            </Link>
            <nav className="topnav">
              <Link href="/">Tier Lists</Link>
              <Link href="/guides">Guides</Link>
              <Link href="/how-ranking-works">How Ranking Works</Link>
            </nav>
          </div>
        </header>

        {children}

        <footer className="site-foot">
          <div className="wrap">
            <div className="foot-grid">
              <div className="foot-brand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/logo.png" alt="PeptideNugget" />
                <p>
                  Community tier lists for peptides, injection supplies, and copper
                  peptide finds.
                </p>
              </div>
              {Object.entries(FOOT).map(([heading, links]) => (
                <div className="foot-col" key={heading}>
                  <h3>{heading}</h3>
                  {links.map(([label, href]) => (
                    <Link key={href} href={href}>
                      {label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            <div className="foot-legal">
              <p>
                <b>Affiliate disclosure.</b> PeptideNugget earns a commission on
                qualifying purchases made through links on this site, at no additional
                cost to you.
              </p>
              <p>
                <b>Research use only.</b> Compounds referenced are sold for laboratory
                research purposes only and are not approved for human consumption.
                Nothing on this site is medical advice.
              </p>
              <p style={{ marginTop: 15 }}>
                © {new Date().getFullYear()} PeptideNugget. Rankings reflect community
                votes, not clinical evidence.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
