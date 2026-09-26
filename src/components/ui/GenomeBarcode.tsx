import wgs from '@site/src/data/wgs.json';
import {groupColor} from '@site/src/data/groups';

type Props = {height?: number; onDark?: boolean; className?: string};

// One bar per project, width proportional to its WGS count, grouped and coloured by disease group.
export default function GenomeBarcode({height = 120, onDark = false, className}: Props) {
  const total = wgs.totals.wgs;
  const gap = total * 0.0015;
  const minWidth = total * 0.0006;
  const sorted = [...wgs.projects].sort((a, b) => a.group.localeCompare(b.group) || b.wgs - a.wgs);
  let x = 0;
  const bars = sorted.map((p, i) => {
    const w = Math.max(p.wgs, minWidth);
    const bar = {key: `${p.id}-${i}`, x, w, fill: groupColor(p.group, onDark)};
    x += w + gap;
    return bar;
  });
  const width = x - gap;
  return (
    <svg
      role="img"
      aria-label={`Barcode of ${wgs.totals.projects} Genomics Thailand projects; bar width is proportional to whole genomes per project.`}
      viewBox={`0 0 ${width} 100`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className={className}>
      {bars.map((b) => <rect key={b.key} x={b.x} y={0} width={b.w} height={100} fill={b.fill} />)}
    </svg>
  );
}
