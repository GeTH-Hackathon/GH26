import {useAnchor} from '@site/src/lib/useAnchor';
import clsx from 'clsx';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import {schedule, hackDaysSummary, type ScheduleDay} from '@site/src/data/schedule';
import styles from './Schedule.module.css';

function DayCard({day, className}: {day: ScheduleDay; className?: string}) {
  return (
    <article className={clsx(styles.card, day.kind !== 'hack' && styles.accent, className)}>
      <header className={styles.head}>
        <span className="label">Day {day.dayLabel}</span>
        <span className="label">{day.dateLabel}</span>
      </header>
      <h3 className={styles.title}>{day.title}</h3>
      <ol className={styles.items}>
        {day.items.map((it, i) => (
          <li key={i} className={styles.item}>
            <span className={styles.time}>{it.time ?? ''}</span>
            <span>{it.title}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

export default function Schedule() {
  const opening = schedule.filter((d) => d.kind === 'opening');
  const hack = schedule.filter((d) => d.kind === 'hack');
  const wrapup = schedule.filter((d) => d.kind === 'wrapup');
  // Phones see the four identical hacking days as one card; wider screens see each day.
  const combined: ScheduleDay | undefined = hack[0] && {...hack[0], ...hackDaysSummary, title: `Hackathon days ×${hack.length}`};
  return (
    <section id={useAnchor('schedule')} className="section">
      <div className="container-swiss">
        <SlashHeading>schedule</SlashHeading>
        <div className={styles.grid}>
          {opening.map((d) => <DayCard key={d.dayLabel} day={d} />)}
          {combined && <DayCard day={combined} className={styles.mobileOnly} />}
          {hack.map((d) => <DayCard key={d.dayLabel} day={d} className={styles.desktopOnly} />)}
          {wrapup.map((d) => <DayCard key={d.dayLabel} day={d} />)}
        </div>
      </div>
    </section>
  );
}
