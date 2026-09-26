import {useAnchor} from '@site/src/lib/useAnchor';
import Link from '@docusaurus/Link';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import ApplyButton from '@site/src/components/ui/ApplyButton';
import {event} from '@site/src/data/event';
import styles from './Apply.module.css';

export default function Apply() {
  return (
    <section id={useAnchor('apply')} className="section">
      <div className="container-swiss">
        <SlashHeading>apply</SlashHeading>
        <div className={styles.grid}>
          <div>
            <p className={styles.lead}>{event.seatsLabel}. Individual applications, reviewed by the organizing committee.</p>
            <h3 className="label">Who should apply</h3>
            <ul className={styles.list}>
              {event.audience.map((a) => <li key={a}>{a}</li>)}
            </ul>
            <h3 className="label">Selection criteria</h3>
            <ul className={styles.list}>
              {event.criteria.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <h3 className="label">Before data access</h3>
            <p>{event.accessNote}</p>
          </div>
          <aside className={styles.cta}>
            <ApplyButton />
            <p className={styles.small}>
              {event.formUrl ? 'Applications are made through Google Forms.' : 'The Google Form will be linked here when applications open.'}
            </p>
            <ul className={styles.docs}>
              <li><Link to="/terms">Terms &amp; Conditions</Link> <span className="label">Coming soon</span></li>
              <li><Link to="/tre-guidelines">TRE guideline instructions</Link> <span className="label">Coming soon</span></li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
