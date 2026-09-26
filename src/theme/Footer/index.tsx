import Link from '@docusaurus/Link';
import TBA from '@site/src/components/ui/TBA';
import {event} from '@site/src/data/event';
import styles from './styles.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container-swiss">
        <div className={styles.cols}>
          <div>
            <p className={styles.name}>{event.name}</p>
            <p className="label">{event.statusLine}</p>
          </div>
          <div>
            <p className="label">Contact</p>
            <p>
              {event.contactEmail ? (
                <a href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>
              ) : (
                <>To be announced<TBA /></>
              )}
            </p>
          </div>
          <ul className={styles.links}>
            <li><Link to="/#apply">Apply</Link></li>
            <li><Link to="/data">The data</Link></li>
            <li><Link to="/terms">Terms &amp; Conditions</Link></li>
            <li><Link to="/tre-guidelines">TRE guidelines</Link></li>
            {event.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.signoff}>See you at Chiang Mai</p>
        <div className={styles.base}>
          <span className="label">{event.copyright}</span>
          <a className="label" href="#__docusaurus">/ back to top</a>
        </div>
      </div>
    </footer>
  );
}
