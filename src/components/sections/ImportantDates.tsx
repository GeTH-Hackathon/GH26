import {useAnchor} from '@site/src/lib/useAnchor';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import TBA from '@site/src/components/ui/TBA';
import {event} from '@site/src/data/event';
import styles from './ImportantDates.module.css';

export default function ImportantDates() {
  return (
    <section id={useAnchor('important-dates')} className="section">
      <div className="container-swiss">
        <SlashHeading>Important dates</SlashHeading>
        <ol className={styles.list}>
          {event.importantDates.map((d) => (
            <li key={d.label} className={styles.row}>
              <span className={styles.what}>{d.label}</span>
              <span className={styles.when}>
                {d.date}
                {!d.exact && <TBA title="Exact day to be announced" />}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
