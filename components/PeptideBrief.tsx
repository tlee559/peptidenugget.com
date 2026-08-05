import styles from "./PeptideBrief.module.css";

/**
 * Short plain-English primer above the peptide boards.
 *
 * Just the explanation — what a peptide is, why there are so many, why the
 * board opens in the order it does. No disclaimers here: the footer already
 * carries the research-use and not-medical-advice notices sitewide, and
 * repeating them turns a primer into fine print nobody reads.
 *
 * Still makes no claim about what any compound does. Categories describe
 * FIELDS OF STUDY, never effects.
 */
export default function PeptideBrief() {
  return (
    <section className={styles.brief} aria-label="What peptides are">
      <h2 className={styles.h}>What&rsquo;s a peptide?</h2>

      <p className={styles.lead}>
        Your body is full of <b>proteins</b>. Proteins are long chains built out of
        small pieces called <b>amino acids</b>. A <b>peptide</b> is the same kind of
        chain — just a short one. That&rsquo;s the whole idea.
      </p>

      <p className={styles.lead}>
        There are thousands of them because the <b>order</b> of those amino acids
        changes from one peptide to the next, and that order is what makes each one
        different. Scientists sort them by the area of research they turn up in —
        metabolism, how cells rebuild, skin, the brain and nerves, sleep.
      </p>

      <p className={styles.lead}>
        The board starts in <b>popularity order</b> — how often each one gets bought,
        nothing more. It&rsquo;s a starting point, not a verdict. Drag them wherever
        you think they belong and share your version.
      </p>
    </section>
  );
}
