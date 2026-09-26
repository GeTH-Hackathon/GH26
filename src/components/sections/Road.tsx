import {useRef} from 'react';
import clsx from 'clsx';
import {useAnchor} from '@site/src/lib/useAnchor';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import TBA from '@site/src/components/ui/TBA';
import {event} from '@site/src/data/event';
import {schedule, hackDaysSummary, type ScheduleDay} from '@site/src/data/schedule';
import {useMotionScene} from '@site/src/motion/useMotionScene';
import {roadScene} from '@site/src/motion/scenes/roadScene';
import styles from './Road.module.css';

type Stop = {key: string; anchor?: 'important-dates' | 'schedule'; when: string; title: string; exact: boolean; items?: ScheduleDay['items']; onSite: boolean};

// Milestones before the event, then Day 1, Days 2–5 (shared agenda shown once) and Day 6.
function buildStops(): Stop[] {
  const milestones: Stop[] = event.importantDates
    .filter((d) => d.label !== 'Hackathon')
    .map((d, i) => ({key: d.label, anchor: i === 0 ? 'important-dates' : undefined, when: d.date, title: d.label, exact: d.exact, onSite: false}));
  const opening = schedule.find((d) => d.kind === 'opening');
  const hack = schedule.filter((d) => d.kind === 'hack');
  const wrap = schedule.find((d) => d.kind === 'wrapup');
  const days: Stop[] = [];
  if (opening) days.push({key: 'day-1', anchor: 'schedule', when: `Day ${opening.dayLabel} · ${opening.dateLabel}`, title: opening.title, exact: true, items: opening.items, onSite: true});
  if (hack[0]) days.push({key: 'days-2-5', when: `Days ${hackDaysSummary.dayLabel} · ${hackDaysSummary.dateLabel}`, title: `Hackathon days ×${hack.length}`, exact: true, items: hack[0].items, onSite: true});
  if (wrap) days.push({key: 'day-6', when: `Day ${wrap.dayLabel} · ${wrap.dateLabel}`, title: wrap.title, exact: true, items: wrap.items, onSite: true});
  return [...milestones, ...days];
}

export default function Road() {
  const ref = useRef<HTMLDivElement>(null);
  useMotionScene(ref, roadScene);
  const ids = {'important-dates': useAnchor('important-dates'), schedule: useAnchor('schedule')};
  const {venue} = event;
  return (
    <section id={useAnchor('dates')} className="section">
      <div className="container-swiss">
        <SlashHeading>The road to Chiang Mai</SlashHeading>
        <p className={styles.venue}>
          <strong>{event.dateRange}</strong> · {venue.city}, {venue.country} · {venue.name ?? <>Hotel to be announced<TBA /></>} · Nearest airport: {venue.airport}
        </p>
      </div>
      <div className={styles.viewport} ref={ref}>
        <div className={styles.rail} data-rail>
          <span className={styles.progress} data-progress aria-hidden="true" />
          <ol className={styles.track}>
            {buildStops().map((s) => (
              <li key={s.key} id={s.anchor ? ids[s.anchor] : undefined} className={clsx(styles.stop, s.onSite && styles.onSite)} data-stop>
                <span className={styles.dot} aria-hidden="true" />
                <p className={styles.when}>
                  {s.when}
                  {!s.exact && <TBA title="Exact day to be announced" />}
                </p>
                <h3 className={styles.title}>{s.title}</h3>
                {s.items && (
                  <ol className={styles.items}>
                    {s.items.map((it, i) => (
                      <li key={i}>
                        <span className={styles.time}>{it.time ?? ''}</span>
                        <span>{it.title}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
