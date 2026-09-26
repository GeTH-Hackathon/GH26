import {useAnchor} from '@site/src/lib/useAnchor';
import Link from '@docusaurus/Link';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import {event} from '@site/src/data/event';
import styles from './Links.module.css';

export default function Links() {
  return (
    <section id={useAnchor('links')} className="section">
      <div className="container-swiss">
        <SlashHeading>links</SlashHeading>
        <ul className={styles.list}>
          {event.links.map((l) => (
            <li key={l.href} className={styles.row}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className={styles.link}>{l.label} ↗</a>
              <span className={styles.note}>{l.note}</span>
            </li>
          ))}
          <li className={styles.row}>
            <Link to="/terms" className={styles.link}>Terms &amp; Conditions</Link>
            <span className={styles.note}>Will be announced soon</span>
          </li>
          <li className={styles.row}>
            <Link to="/tre-guidelines" className={styles.link}>TRE guideline instructions</Link>
            <span className={styles.note}>Will be announced soon</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
