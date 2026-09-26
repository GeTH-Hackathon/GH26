import {useAnchor} from '@site/src/lib/useAnchor';
import {useRef} from 'react';
import {useMotionScene} from '@site/src/motion/useMotionScene';
import {reveal} from '@site/src/motion/scenes/reveal';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import {event, type Partner, type PartnerRole} from '@site/src/data/event';
import styles from './Organizers.module.css';

const ROLES: {role: PartnerRole; plural: string}[] = [
  {role: 'Organizer', plural: 'Organizers'},
  {role: 'Supported by', plural: 'Supported by'},
  {role: 'Data partner', plural: 'Data partners'},
];

function PartnerMark({partner}: {partner: Partner}) {
  const logoUrl = useBaseUrl(partner.logo ?? '/');
  const mark = partner.logo ? (
    <img src={logoUrl} alt={partner.name} className={styles.logo} />
  ) : (
    <span className={styles.name}>{partner.name}</span>
  );
  if (!partner.href) return mark;
  return (
    <a href={partner.href} target="_blank" rel="noopener noreferrer" className={styles.link}>{mark}</a>
  );
}

export default function Organizers() {
  const ref = useRef<HTMLDivElement>(null);
  useMotionScene(ref, reveal);
  return (
    <section id={useAnchor('organizers')} className="section">
      <div className="container-swiss" ref={ref}>
        <SlashHeading>Organizers</SlashHeading>
        {ROLES.map(({role, plural}) => {
          const partners = event.partners.filter((p) => p.role === role);
          if (partners.length === 0) return null;
          return (
            <div key={role} className={styles.row} data-reveal>
              <p className="label">{partners.length > 1 ? plural : role}</p>
              <ul className={styles.list}>
                {partners.map((p) => <li key={p.name}><PartnerMark partner={p} /></li>)}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
