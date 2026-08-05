import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { visibleCategories, KEY_TO_SLUG } from "@/lib/catalog";
import MetaPixel from "@/components/MetaPixel";

export const metadata: Metadata = {
  // www is the served host — the apex 308s to it. A canonical pointing at a
  // redirect is a weak signal, so canonicals must resolve directly.
  metadataBase: new URL("https://www.peptidenugget.com"),
  title: {
    default: "PeptideNugget — Community Peptide Tier Lists",
    template: "%s — PeptideNugget",
  },
  description:
    "Community tier lists for research peptides. Rank them yourself and share the link.",
  openGraph: {
    siteName: "PeptideNugget",
    type: "website",
    images: ["/img/logo.png"],
  },
  twitter: { card: "summary_large_image" },
};

/* We were shipping a bare `width=device-width` with no initial-scale, which
   leaves phones free to pick their own starting zoom. viewportFit:"cover" is
   what actually turns on env(safe-area-inset-*) — the tier picker was already
   padding itself with it, but the value resolved to 0 on every notched phone,
   so the sheet sat under the home indicator. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16181c",
};

/* Derived from the catalogue, not hardcoded — a hidden category used to leave
   a dead footer link pointing at a 404. */
const FOOT = {
  "Tier Lists": visibleCategories().map(([key, c]) => [c.label, "/tier/" + KEY_TO_SLUG[key]]),
  Community: [
    ["How ranking works", "/how-ranking-works"],
    ["Submit a product", "/submit"],
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
        <MetaPixel />
        <header className="site-head">
          <div className="wrap">
            <Link className="brand" href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/logo.png" alt="PeptideNugget" />
            </Link>
            <nav className="topnav">
              <Link href="/">Tier Lists</Link>
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
                  Community tier lists for research peptides. Rank them, share the
                  link.
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
