import {useAnchor} from '@site/src/lib/useAnchor';
import Link from '@docusaurus/Link';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import ApplyButton from '@site/src/components/ui/ApplyButton';
import {event} from '@site/src/data/event';
import styles from './Apply.module.css';

// A trailing "(required)" in the copy becomes a small tag.
const REQUIRED = /\s*\(required\)\s*$/i;

export default function Apply() {
  return (
    <section id={useAnchor('apply')} className="section">
      <div className="container-swiss">
        <SlashHeading>Apply</SlashHeading>
        <div className={styles.grid}>
          <div className={styles.intro}>
            <p className={styles.lead}>{event.seatsLabel}. Individual applications, reviewed by the organizing committee.</p>
            <p className={styles.eligibility}>{event.eligibility}</p>
          </div>
          {/* Before the details in reading order, so phones reach it without scrolling past the criteria. */}
          <aside className={styles.cta}>
            <ApplyButton />
            <p className={styles.small}>
              {event.formUrl ? 'Applications are made through Google Forms.' : 'The Google Form will be linked here when applications open.'}
            </p>
            <ul className={styles.docs}>
              <li><Link to="/terms">Terms &amp; Conditions</Link></li>
              <li><Link to="/tre-guidelines">TRE guideline instructions</Link> <span className="label">Coming soon</span></li>
            </ul>
          </aside>
          <div className={styles.details}>
            <h3 className={styles.subheading}>Who should apply</h3>
            <p className={styles.roles}>{event.audience.join(' · ')}</p>
            <h3 className={styles.subheading}>Selection criteria</h3>
            <ul className={styles.list}>
              {event.criteria.map((c) => (
                <li key={c}>
                  {c.replace(REQUIRED, '')}
                  {REQUIRED.test(c) && <span className={styles.required}>Required</span>}
                </li>
              ))}
            </ul>
            <h3 className={styles.subheading}>Before data access</h3>
            <p className={styles.note}>{event.accessNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
