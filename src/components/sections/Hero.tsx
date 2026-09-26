import {Fragment, useRef} from 'react';
import ApplyCta from '@site/src/components/ui/ApplyCta';
import GenomeBarcode from '@site/src/components/ui/GenomeBarcode';
import {event} from '@site/src/data/event';
import {useMotionScene} from '@site/src/motion/useMotionScene';
import {heroIntro} from '@site/src/motion/scenes/heroIntro';
import styles from './Hero.module.css';

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  useMotionScene(ref, heroIntro);
  return (
    <header className={styles.hero} ref={ref}>
      <div className="container-swiss">
        <div className={styles.status} data-intro="status">
          <span className="label">{event.statusLine}</span>
          <a className="label" href="#apply">Apply ↓</a>
        </div>
        <p className={styles.kicker} data-intro="status">/ Hackathon 2027</p>
        <h1 className={styles.title}>
          <span className={styles.wordmark}>
            {event.brand.split(' ').map((word, i) => (
              <Fragment key={word}>
                {i > 0 && ' '}
                <span className={styles.line}>
                  <span className={styles.lineInner} data-intro="line">{word}</span>
                </span>
              </Fragment>
            ))}
          </span>
          <span className="sr-only">{event.name.replace(event.brand, '')}</span>
        </h1>
        <div className={styles.row}>
          <p className={styles.tagline} data-intro="rest">{event.tagline}</p>
          <div className={styles.ctas} data-intro="rest">
            <ApplyCta />
            <a href="#data">See the data ↓</a>
          </div>
        </div>
        <div data-intro="barcode">
          <GenomeBarcode className={styles.barcode} height={96} />
        </div>
      </div>
    </header>
  );
}
