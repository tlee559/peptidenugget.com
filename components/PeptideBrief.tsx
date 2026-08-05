import styles from "./PeptideBrief.module.css";

/**
 * Short plain-English primer above the peptide boards. Written for a general
 * reader — short sentences, common words, one concrete analogy.
 *
 * No disclaimers here; the footer carries them sitewide.
 *
 * Careful line: everything below describes what the BODY's own peptides do —
 * normal physiology, the same as any biology textbook. It never says or hints
 * that a product on this page does anything for anyone. Naming a shortage and
 * putting a product next to it is how implied claims get made, so the ageing
 * sentence is framed as why researchers are interested, nothing more.
 */
export default function PeptideBrief() {
  return (
    <section className={styles.brief} aria-label="What peptides are">
      <h2 className={styles.h}>What&rsquo;s a peptide?</h2>

      <p className={styles.lead}>
        Your body has trillions of cells, and they need to talk to each other all
        day long. <b>Peptides are the messages they send.</b>
      </p>

      <p className={styles.lead}>
        A peptide is a tiny string of building blocks called <b>amino acids</b> —
        the same blocks your body uses to make protein. Change the order of the
        blocks and you get a different message. Your body makes thousands of them.
      </p>

      <p className={styles.lead}>
        You already know one: <b>insulin</b>. Insulin is a peptide. It&rsquo;s the
        message that tells your body what to do with the sugar in your food. That
        one message keeps you alive.
      </p>

      <p className={styles.lead}>
        Your body makes less of some of these messages as you get older. That is
        one of the big reasons scientists study peptides — and because the strings
        are small, they can build and test them in a lab. That&rsquo;s why there are
        so many names on this page.
      </p>

      <p className={styles.lead}>
        The board starts in <b>popularity order</b> — how often each one gets
        bought, nothing more. It&rsquo;s a starting point, not a verdict. Drag them
        wherever you think they belong and share your version.
      </p>
    </section>
  );
}
