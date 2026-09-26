import {useRef} from 'react';
import Link from '@docusaurus/Link';
import {useAnchor} from '@site/src/lib/useAnchor';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import wgs from '@site/src/data/wgs.json';
import {event} from '@site/src/data/event';
import {groupColor} from '@site/src/data/groups';
import {fmt} from '@site/src/lib/format';
import {barcodeLayouts} from '@site/src/lib/barcodeLayouts';
import {useMotionScene} from '@site/src/motion/useMotionScene';
import {dataScene, CHART} from '@site/src/motion/scenes/dataScene';
import {reveal} from '@site/src/motion/scenes/reveal';
import styles from './Data.module.css';

const layouts = barcodeLayouts(wgs.projects, CHART);
const summary = layouts.columns.map((c) => `${c.group} ${fmt(c.total)}`).join(', ');

export default function Data() {
  const stageRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  useMotionScene(stageRef, dataScene);
  useMotionScene(detailsRef, reveal);
  return (
    <section id={useAnchor('data')} className="section section--flush">
      <div className="container-swiss">
        <div className={styles.panel} ref={stageRef}>
          <span className={styles.vertical} aria-hidden="true">genomics thailand</span>
          <SlashHeading>Genomics data</SlashHeading>
          <p className={styles.count}>
            <span data-count={wgs.totals.wgs}>{fmt(wgs.totals.wgs)}</span> <span className={styles.unit}>whole genomes</span>
          </p>
          <p className={styles.sub}>{wgs.totals.projects} projects · {wgs.totals.groups} disease groups</p>
          <figure className={styles.chart}>
            <svg
              viewBox={`0 0 ${CHART.width} ${CHART.height}`}
              preserveAspectRatio="none"
              className={styles.svg}
              role="img"
              aria-label={`Whole genomes by disease group: ${summary}.`}>
              {layouts.order.map((p, i) => {
                const b = layouts.grouped[i];
                return (
                  <rect key={`${p.id}-${i}`} data-bar x={b.x} y={b.y} width={b.width} height={b.height} style={{fill: groupColor(p.group, true)}} />
                );
              })}
            </svg>
            <ol className={styles.legend}>
              {layouts.columns.map((c) => (
                <li key={c.group} data-col>
                  <span className={styles.swatch} style={{background: groupColor(c.group, true)}} aria-hidden="true" />
                  <span className={styles.colName}>{c.group}</span>
                  <span className={styles.colTotal}>{fmt(c.total)}</span>
                </li>
              ))}
            </ol>
          </figure>
        </div>
        <div className={styles.details} ref={detailsRef}>
          <h3 className={styles.detailsHeading} data-reveal>What's in the data</h3>
          <dl className={styles.types}>
            {event.dataTypes.map((t) => (
              <div key={t.name} className={styles.type} data-reveal>
                <dt>{t.name}</dt>
                <dd>{t.description}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.note} data-reveal>{event.dataNote}</p>
          <p className={styles.links} data-reveal>
            <Link to="/data">Explore all {wgs.totals.projects} projects →</Link>
            <a href={event.dataPortal.href} target="_blank" rel="noopener noreferrer">{event.dataPortal.label} ↗</a>
          </p>
        </div>
      </div>
    </section>
  );
}
