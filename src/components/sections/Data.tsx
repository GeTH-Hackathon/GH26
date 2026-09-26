import Link from '@docusaurus/Link';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import Marquee from '@site/src/components/ui/Marquee';
import GenomeBarcode from '@site/src/components/ui/GenomeBarcode';
import wgs from '@site/src/data/wgs.json';
import {event} from '@site/src/data/event';
import {fmt} from '@site/src/lib/format';
import styles from './Data.module.css';

export default function Data() {
  const max = wgs.byGroup[0]?.wgs ?? 1;
  return (
    <section id="data" className="section section--flush">
      <div className="container-swiss">
        <div className={styles.panel}>
          <span className={styles.vertical} aria-hidden="true">genomics thailand</span>
          <SlashHeading>the data</SlashHeading>
          <div className={styles.stats}>
            <p className={styles.big}>({fmt(wgs.totals.wgs)})</p>
            <dl className={styles.counters}>
              <div><dt className="label">Whole genomes</dt><dd>{fmt(wgs.totals.wgs)}</dd></div>
              <div><dt className="label">Projects</dt><dd>{fmt(wgs.totals.projects)}</dd></div>
              <div><dt className="label">Disease groups</dt><dd>{fmt(wgs.totals.groups)}</dd></div>
            </dl>
          </div>
          <ol className={styles.chart} aria-label="Whole genomes by disease group">
            {wgs.byGroup.map((g) => (
              <li key={g.group} className={styles.bar}>
                <span className={styles.barLabel}>{g.group}</span>
                <span className={styles.barTrack}>
                  <span className={styles.barFill} style={{width: `${(g.wgs / max) * 100}%`}} />
                </span>
                <span className={styles.barValue}>{fmt(g.wgs)}</span>
              </li>
            ))}
          </ol>
          <Marquee items={event.dataTypes.map((t) => t.name.toUpperCase())} />
          <p className={styles.note}>{event.dataNote}</p>
          <p className={styles.links}>
            <Link to="/data">Explore all {wgs.totals.projects} projects →</Link>
            <a href={event.dataPortal.href} target="_blank" rel="noopener noreferrer">{event.dataPortal.label} ↗</a>
          </p>
          <GenomeBarcode onDark height={56} className={styles.barcode} />
        </div>
      </div>
    </section>
  );
}
