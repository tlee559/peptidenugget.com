import styles from "./PeptideBrief.module.css";

/**
 * Short primer above the peptide boards. Structured as pain → solution → action
 * rather than as an encyclopedia entry, because the job of this block is to get
 * someone onto the board, not to teach them biochemistry.
 *
 * The pain it names is an INFORMATION pain — "you've seen these names and no
 * two lists agree" — never a health pain. That is deliberate and load-bearing:
 *
 * Careful line: naming a symptom or a shortage and putting a product next to it
 * is how implied claims get made, and it is the fastest way to turn an
 * affiliate page into an FTC problem. Nothing here says or hints that any
 * compound on this page does anything for anyone. The only factual claim is
 * about the amino-acid definition and about purchase volume, both of which are
 * true and neither of which is a health claim. Keep it that way when editing.
 *
 * No disclaimers here; the footer carries them sitewide.
 *
 * Kept visible (not collapsed) on purpose — a reader who won't skim four short
 * lines before clicking is not a qualified click. But it stays tight so the
 * board is still reachable on a phone.
 */
type Props = {
  /**
   * How many items are on this board. Used in the headline only when it is big
   * enough to read as "the whole field" — this renders above Top Tier too, and
   * "6 peptides" undersells a board instead of selling it.
   */
  count?: number;
};

export default function PeptideBrief({ count }: Props) {
  const headline =
    count && count >= 20
      ? `${count} peptides. No two lists agree.`
      : "No two peptide lists agree.";

  return (
    <section className={styles.brief} aria-label="What peptides are">
      <h2 className={styles.h}>{headline}</h2>

      <p className={styles.lead}>
        You&rsquo;ve seen the names — BPC-157, GHK-Cu, Sermorelin, TB-500. Every
        thread picks a different winner. Every vendor swears theirs is the one.
        Nobody shows you the whole field at once.
      </p>

      <p className={styles.aside}>
        New here? A <b>peptide</b> is a short chain of amino acids — the same
        building blocks your body uses to make protein. Your body makes thousands
        of them. Insulin is one.
      </p>

      <p className={styles.lead}>
        This is the whole field, ranked. The board starts in{" "}
        <b>popularity order</b> — how often each one actually gets bought,
        nothing more. It&rsquo;s a starting point, not a verdict.
      </p>

      <p className={styles.lead}>
        Think the order is wrong? Good — that&rsquo;s the point. <b>Drag anything
        anywhere</b> and the board becomes yours. Share the link and let people
        argue with your version.
      </p>
    </section>
  );
}
