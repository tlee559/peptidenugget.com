import styles from "./PeptideBrief.module.css";

/**
 * Plain-English primer shown above the peptide boards.
 *
 * Vendor-neutral by design: no brand is named. We don't sell anything, so the
 * copy is general education about what peptides are, not a description of any
 * particular catalogue.
 *
 * Deliberately makes NO claim about what any compound does. Partner terms bar
 * health, performance and therapeutic claims outright, and a pain-point →
 * product mapping is exactly that pattern. So this explains what a peptide IS,
 * what "research use only" means, and what the storefront's own category names
 * refer to — describing fields of study, attributed, never an effect.
 */

const CATEGORIES: [string, string][] = [
  ["Metabolic", "how the body turns food into energy"],
  ["Tissue Repair", "how cells rebuild after damage"],
  ["Dermal", "skin"],
  ["Neuro", "the brain and nerves"],
  ["Cellular", "what happens inside a single cell"],
  ["Secretagogue", "signals that tell the body to release things it already makes"],
  ["Circadian", "sleep and the body clock"],
];

const GLOSSARY: [string, string][] = [
  ["Lyophilized", "Freeze-dried. The water is removed so the powder keeps for a long time."],
  ["Reconstituted", "The powder has had liquid added back to it."],
  ["mg", "Milligram — how much powder is in the vial. 10 mg is about the weight of a few grains of salt."],
  ["Purity ≥ 99%", "A lab tested the batch and found almost no other substances in it."],
  ["Vial", "The small glass bottle with a metal cap."],
  ["COA", "Certificate of Analysis — the lab report for that batch."],
];

export default function PeptideBrief() {
  return (
    <section className={styles.brief} aria-label="What peptides are">
      <h2 className={styles.h}>New here? Start with this</h2>

      <p className={styles.lead}>
        Your body is full of <b>proteins</b>. Proteins are long chains built out of
        small pieces called <b>amino acids</b>. A <b>peptide</b> is the same kind of
        chain, just a short one — too short to count as a protein. That&rsquo;s the
        whole idea. Short chain of amino acids.
      </p>

      <p className={styles.lead}>
        The ones on this page are sold as <b>research chemicals</b>. That means
        they&rsquo;re made for laboratory work and testing. They are <b>not approved
        for people to take</b>, and this site doesn&rsquo;t sell anything or tell you
        to take anything. We just rank them so you can argue about the list.
      </p>

      <details className={styles.more}>
        <summary className={styles.summary}>
          What the category names mean, and how we ranked them
        </summary>

        <div className={styles.moreBody}>
          <h3 className={styles.h3}>The category names</h3>
          <p className={styles.p}>
            These compounds are usually grouped into research categories. A category
            name tells you <b>which area of science a compound comes up in</b> — it is
            not a statement about what it does, or what it would do to anyone.
          </p>
          <ul className={styles.defs}>
            {CATEGORIES.map(([name, meaning]) => (
              <li key={name}>
                <b>{name}</b> — research into {meaning}.
              </li>
            ))}
          </ul>

          <h3 className={styles.h3}>How we ranked them</h3>
          <p className={styles.p}>
            The starting order is <b>how popular each one is</b>, worked out from how
            they&rsquo;re listed where they&rsquo;re sold. That&rsquo;s a popularity
            measure and nothing more. It is <b>not</b> a measure of how well anything
            works, how safe it is, or what any study found.
          </p>
          <p className={styles.p}>
            You almost certainly disagree with some of it. That&rsquo;s the point — drag
            them where you think they belong, then share your version.
          </p>

          <h3 className={styles.h3}>Words you&rsquo;ll see on the labels</h3>
          <ul className={styles.defs}>
            {GLOSSARY.map(([term, meaning]) => (
              <li key={term}>
                <b>{term}</b> — {meaning}
              </li>
            ))}
          </ul>
        </div>
      </details>

      <p className={styles.fine}>
        Educational information only. Nothing here is medical advice, and nothing
        here says any compound treats, prevents or improves anything. Talk to a
        doctor about your health.
      </p>
    </section>
  );
}
