import ApplyButton from './ApplyButton';
import {event} from '@site/src/data/event';
import styles from './ApplyCta.module.css';

const dateOf = (label: string) => event.importantDates.find((d) => d.label === label)?.date;

// "Apply by December 2026 · Results January 2027", read from event.importantDates.
export function deadlineLine(): string | null {
  const deadline = dateOf('Application deadline');
  const results = dateOf('Participants announced');
  if (!deadline) return null;
  return `Apply by ${deadline}${results ? ` · Results ${results}` : ''}`;
}

export default function ApplyCta() {
  const line = deadlineLine();
  return (
    <div className={styles.cta}>
      <ApplyButton />
      {line && <p className={styles.deadline}>{line}</p>}
    </div>
  );
}
