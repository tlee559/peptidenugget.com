import DoseCalculator from "@/components/DoseCalculator";
import styles from "./guide.module.css";

export const metadata = {
  title: "How Peptides Are Mixed and Measured — Plain English Guide",
  description:
    "A simple, accurate walkthrough of reconstituting a lyophilized peptide vial: what the powder is, how to add bacteriostatic water, how to read a U-100 syringe, and how to store it.",
  alternates: { canonical: "/guides/using-peptides" },
};

/* Diagrams are hand-authored SVG on purpose. A generated image with the wrong
   number of syringe gradations would be worse than no diagram at all on a
   page whose entire value is being correct. */

function VialDiagram() {
  return (
    // viewBox runs to 400, not 320: the callout text extends well past the
    // artwork and gets clipped otherwise.
    <svg viewBox="0 0 400 200" className={styles.fig} role="img"
         aria-label="A peptide vial with its cap, rubber stopper and freeze-dried powder labelled">
      <rect x="118" y="34" width="52" height="14" rx="3" fill="#b9bec7" />
      <rect x="122" y="46" width="44" height="10" fill="#8d939d" />
      <path d="M124 56 h40 a14 14 0 0 1 14 14 v88 a10 10 0 0 1-10 10 h-48 a10 10 0 0 1-10-10 v-88 a14 14 0 0 1 14-14 z"
            fill="#20242b" stroke="#5b6270" strokeWidth="2" />
      <path d="M118 128 h52 v30 a10 10 0 0 1-10 10 h-32 a10 10 0 0 1-10-10 z" fill="#e8e2d4" />
      <line x1="178" y1="41" x2="250" y2="41" stroke="#6f7681" strokeWidth="1" />
      <text x="254" y="45" className={styles.lbl}>metal cap</text>
      <line x1="170" y1="51" x2="250" y2="60" stroke="#6f7681" strokeWidth="1" />
      <text x="254" y="64" className={styles.lbl}>rubber stopper</text>
      <text x="254" y="82" className={styles.lblSm}>(you push the needle</text>
      <text x="254" y="94" className={styles.lblSm}>through this — never</text>
      <text x="254" y="106" className={styles.lblSm}>take the cap off)</text>
      <line x1="176" y1="145" x2="250" y2="140" stroke="#6f7681" strokeWidth="1" />
      <text x="254" y="144" className={styles.lbl}>the powder</text>
      <text x="254" y="160" className={styles.lblSm}>freeze-dried, looks like</text>
      <text x="254" y="172" className={styles.lblSm}>a small white puck</text>
      <text x="60" y="100" className={styles.lblSm}>empty space</text>
      <text x="60" y="114" className={styles.lblSm}>is normal</text>
    </svg>
  );
}

function PourDiagram() {
  return (
    <svg viewBox="0 0 340 190" className={styles.fig} role="img"
         aria-label="Water running down the inside wall of the vial instead of straight onto the powder">
      {/* right way */}
      <text x="14" y="18" className={styles.ok}>✓ down the side</text>
      <path d="M30 34 h44 a12 12 0 0 1 12 12 v96 a10 10 0 0 1-10 10 h-48 a10 10 0 0 1-10-10 v-96 a12 12 0 0 1 12-12 z"
            fill="#20242b" stroke="#3ddc84" strokeWidth="2" />
      <path d="M20 118 h66 v24 a10 10 0 0 1-10 10 h-46 a10 10 0 0 1-10-10 z" fill="#e8e2d4" />
      <path d="M78 40 q6 40 4 74" stroke="#7fd7ff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <text x="14" y="176" className={styles.lblSm}>slow, hits the glass first</text>

      {/* wrong way */}
      <text x="196" y="18" className={styles.bad}>✕ straight down</text>
      <path d="M212 34 h44 a12 12 0 0 1 12 12 v96 a10 10 0 0 1-10 10 h-48 a10 10 0 0 1-10-10 v-96 a12 12 0 0 1 12-12 z"
            fill="#20242b" stroke="#ff8080" strokeWidth="2" />
      <path d="M202 118 h66 v24 a10 10 0 0 1-10 10 h-46 a10 10 0 0 1-10-10 z" fill="#e8e2d4" />
      <line x1="235" y1="40" x2="235" y2="112" stroke="#7fd7ff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="228" cy="120" r="3" fill="#7fd7ff" opacity=".8" />
      <circle cx="243" cy="124" r="2.5" fill="#7fd7ff" opacity=".8" />
      <circle cx="236" cy="132" r="2" fill="#7fd7ff" opacity=".8" />
      <text x="196" y="176" className={styles.lblSm}>blasts the powder apart</text>
    </svg>
  );
}

function SyringeDiagram() {
  const ticks = Array.from({ length: 11 }, (_, i) => i * 10);
  return (
    <svg viewBox="0 0 480 130" className={styles.fig} role="img"
         aria-label="A U-100 insulin syringe barrel marked from 0 to 100 units, with 100 units equal to one millilitre">
      <line x1="18" y1="62" x2="52" y2="62" stroke="#b9bec7" strokeWidth="3" />
      <rect x="52" y="48" width="10" height="28" rx="2" fill="#8d939d" />
      <rect x="62" y="44" width="330" height="36" rx="4" fill="#1a1d23" stroke="#5b6270" strokeWidth="2" />
      <rect x="62" y="44" width="99" height="36" rx="4" fill="#3ddc84" opacity=".28" />
      <rect x="392" y="40" width="12" height="44" rx="3" fill="#8d939d" />
      <rect x="404" y="54" width="46" height="16" rx="3" fill="#b9bec7" />
      {ticks.map((t) => {
        const x = 62 + (t / 100) * 330;
        return (
          <g key={t}>
            <line x1={x} y1="80" x2={x} y2={t % 20 === 0 ? 94 : 88} stroke="#8d939d" strokeWidth="1.5" />
            {t % 20 === 0 && <text x={x} y="108" textAnchor="middle" className={styles.lblSm}>{t}</text>}
          </g>
        );
      })}
      <text x="112" y="68" textAnchor="middle" className={styles.tickLabel}>30 units</text>
      <text x="240" y="24" textAnchor="middle" className={styles.lbl}>100 units = 1 mL</text>
      <text x="240" y="124" textAnchor="middle" className={styles.lblSm}>
        so 1 unit = 0.01 mL — the mark is a volume, never a dose
      </text>
    </svg>
  );
}

export default function UsingPeptides() {
  return (
    <main className="wrap">
      <article className="doc">
        <h1>How peptides are mixed and measured</h1>
        <p className="lede">
          Freeze-dried peptides arrive as a dry powder. Before anything can be
          measured, that powder has to be turned back into a liquid. This page
          explains that process in plain English, and does the maths for you.
        </p>

        <div className="box danger">
          <h3>Read this first</h3>
          <p>
            Research peptides are <b>not approved for human use</b>. This page
            explains how the products are handled in a lab — it is not medical
            advice, and it is not telling you to inject anything. If you are
            using any compound with your body, talk to a doctor.
          </p>
        </div>

        <h2>1. What is actually in the vial</h2>
        <p>
          The powder is the peptide with all the water removed — that is what
          &ldquo;lyophilized&rdquo; means. It is dry so it keeps for a long time. It looks
          like a tiny white puck or a dusty film, and sometimes it looks like there
          is almost nothing there. That is normal. A 5&nbsp;mg dose of powder is
          genuinely tiny.
        </p>
        <VialDiagram />
        <p>
          <b>The metal cap stays on.</b> You never pry it off. The needle goes
          through the rubber circle in the middle.
        </p>

        <h2>2. What &ldquo;bacteriostatic water&rdquo; is</h2>
        <p>
          It is water with a small amount of benzyl alcohol added. The alcohol
          stops bacteria growing, which is what lets you go back into the same
          vial more than once. Plain sterile water has no preservative, so it is a
          one-time-use liquid.
        </p>
        <div className="box">
          <p>
            Once you first put a needle into a bottle of bacteriostatic water,
            the usual guidance is to use it within <b>about 28 days</b> and keep it
            in the fridge.
          </p>
        </div>

        <h2>3. Adding the water</h2>
        <p>
          Let the vial come up to room temperature first. Wipe both rubber tops
          with a fresh alcohol pad and let them dry. Then draw your water and push
          it in slowly, aiming at the <b>inside wall of the glass</b> so it runs
          down. Do not fire it straight onto the powder.
        </p>
        <PourDiagram />
        <p>
          Then leave it alone for a minute or two, and <b>swirl it gently</b> — tip
          it side to side. Never shake it. Peptides are long fragile molecules and
          the force of shaking can physically break them. If it goes foamy, you
          shook it.
        </p>
        <p>The liquid should end up clear. If it stays cloudy or has floaty bits, something is wrong — do not use it.</p>

        <h2>4. Reading the syringe</h2>
        <p>
          This is where people go wrong, so it is worth being slow. An insulin
          syringe is marked in <b>units</b>, not milligrams. A U-100 syringe holds
          1&nbsp;mL of liquid, and that 1&nbsp;mL is divided into 100 marks.
        </p>
        <SyringeDiagram />
        <div className="box warn">
          <p>
            A unit is an amount of <b>liquid</b>, not an amount of peptide. How
            much peptide sits in one unit depends entirely on how much water you
            added. Two people can both draw &ldquo;10 units&rdquo; and get completely
            different amounts.
          </p>
        </div>

        <h2>5. Working out your number</h2>
        <p>
          Here is the whole thing in one line: <b>more water means each unit holds
          less</b>. The amount of powder never changes.
        </p>
        <DoseCalculator />

        <h2>6. Storing it</h2>
        <table>
          <thead>
            <tr><th>State</th><th>Where it goes</th><th>Roughly how long</th></tr>
          </thead>
          <tbody>
            <tr><td>Sealed powder</td><td>Cool, dark, dry — fridge is fine</td><td>Months to years</td></tr>
            <tr><td>Mixed with water</td><td>Fridge, 2–8&nbsp;°C (36–46&nbsp;°F)</td><td>Weeks, not months</td></tr>
            <tr><td>Bac water, opened</td><td>Fridge</td><td>About 28 days</td></tr>
          </tbody>
        </table>
        <ul>
          <li><b>Keep it dark.</b> Light breaks peptides down. Leave it in the box, or use a case.</li>
          <li><b>Do not freeze it once it is mixed.</b> Ice crystals tear the molecules apart. Freezing is for dry powder only.</li>
          <li><b>Do not leave it in a hot car.</b> Heat is the fastest way to ruin a vial.</li>
        </ul>

        <h2>7. Basic safety, every time</h2>
        <ul>
          <li><b>New needle every single time.</b> They go blunt immediately, and a used needle is not sterile.</li>
          <li><b>Never share a needle or a vial with anyone.</b> This is how bloodborne infections spread.</li>
          <li><b>Do not touch the needle</b> to anything before use — not your finger, not the counter.</li>
          <li><b>Used needles go in a sharps container</b>, never a bin bag. A hard sealed container works if you cannot get a proper one.</li>
          <li><b>Wipe every rubber top with alcohol</b> and let it dry before each puncture.</li>
        </ul>

        <div className="box">
          <h3>Signs to stop</h3>
          <p>
            Cloudy liquid, floating specks, a colour that was not there before, a
            vial that was left warm for a long time, or a seal that looks tampered
            with. Throw it out. A ruined vial is cheaper than the alternative.
          </p>
        </div>

        <p style={{ marginTop: 34, fontSize: 13, color: "var(--faint)" }}>
          This page describes standard laboratory handling. It is not medical
          advice and does not recommend that anyone use these compounds.
        </p>
      </article>
    </main>
  );
}
