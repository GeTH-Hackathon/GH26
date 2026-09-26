import ApplyButton from '@site/src/components/ui/ApplyButton';
import GenomeBarcode from '@site/src/components/ui/GenomeBarcode';
import {event} from '@site/src/data/event';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <header className={styles.hero}>
      <div className="container-swiss">
        <div className={styles.status}>
          <span className="label">{event.statusLine}</span>
          <a className="label" href="#apply">Apply ↗</a>
        </div>
        <p className={styles.kicker}>/ hackathon 2027</p>
        <h1 className={styles.title}>
          <span className={styles.wordmark} aria-hidden="true">geth.</span>
          <span className="sr-only">{event.name}</span>
        </h1>
        <div className={styles.row}>
          <p className={styles.tagline}>{event.tagline}</p>
          <div className={styles.ctas}>
            <ApplyButton />
            <a href="#data">See the data ↓</a>
          </div>
        </div>
        <GenomeBarcode className={styles.barcode} height={96} />
      </div>
    </header>
  );
}
