import styles from './Marquee.module.css';

// Two identical runs scroll by 50% for a seamless loop; the copy is hidden from screen readers.
export default function Marquee({items}: {items: string[]}) {
  const run = items.join('  ·  ') + '  ·  ';
  return (
    <div className={styles.marquee}>
      <div className={styles.track}>
        <span>{run}</span>
        <span aria-hidden="true">{run}</span>
      </div>
    </div>
  );
}
