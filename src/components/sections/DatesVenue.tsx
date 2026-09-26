import {useAnchor} from '@site/src/lib/useAnchor';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import TBA from '@site/src/components/ui/TBA';
import {event} from '@site/src/data/event';
import styles from './DatesVenue.module.css';

export default function DatesVenue() {
  const {venue} = event;
  return (
    <section id={useAnchor('dates')} className="section">
      <div className="container-swiss">
        <SlashHeading>{'Dates & venue'}</SlashHeading>
        <div className={styles.grid}>
          <div>
            <p className="label">When</p>
            <p className={styles.big}>{event.dateRange}</p>
            <p>{event.dateNote}</p>
          </div>
          <div>
            <p className="label">Where</p>
            <p className={styles.big}>{venue.city}, {venue.country}</p>
            <p>{venue.name ?? <>Hotel to be announced<TBA /></>}</p>
            <p>Nearest airport: {venue.airport}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
