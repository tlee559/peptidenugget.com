import Link from "next/link";

export const metadata = {
  title: "Guides",
  description: "Plain-English guides to handling, mixing, measuring and storing peptides.",
  alternates: { canonical: "/guides" },
};

const GUIDES = [
  {
    href: "/guides/using-peptides",
    title: "How peptides are mixed and measured",
    blurb:
      "What the freeze-dried powder is, how bacteriostatic water goes in, how to read a U-100 syringe, and a calculator that does the maths for you.",
  },
];

export default function Guides() {
  return (
    <main className="wrap">
      <article className="doc">
        <h1>Guides</h1>
        <p className="lede">
          Short, accurate explainers. No hype, no dosing protocols — just the
          mechanical stuff people get wrong.
        </p>
        <div className="card-grid">
          {GUIDES.map((g) => (
            <Link className="card" href={g.href} key={g.href}>
              <h3>{g.title}</h3>
              <p>{g.blurb}</p>
            </Link>
          ))}
        </div>
        <div className="box">
          <p>
            Want one that doesn&rsquo;t exist yet? <Link href="/contact">Tell us</Link> what
            you looked for and couldn&rsquo;t find.
          </p>
        </div>
      </article>
    </main>
  );
}
