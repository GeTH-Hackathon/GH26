import {useAnchor} from '@site/src/lib/useAnchor';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import {event} from '@site/src/data/event';
import styles from './Objectives.module.css';

export default function Objectives() {
  return (
    <section id={useAnchor('objectives')} className="section">
      <div className="container-swiss">
        <SlashHeading>objectives</SlashHeading>
        <div className={styles.intro}>
          {event.objectivesIntro.map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
        </div>
        <ol className={styles.list}>
          {event.objectives.map((text, i) => (
            <li key={text} className={styles.item}>
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.text}>{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
