import {useMemo, useState} from 'react';
import clsx from 'clsx';
import graphData from '@site/src/data/graph.json';
import {fmt} from '@site/src/lib/format';
import styles from './DatasetMap.module.css';

type GraphNode = {id: string; type: string; group: string; name: string; wgs: number};
type GraphLink = {source: string; target: string; kind: 'series' | 'topic'; topic?: string; cross?: boolean};
type Placed = {id: string; group: string; x: number; y: number; r: number};
type Cell = {group: string; wgs: number; projects: number; x0: number; x1: number; y0: number; y1: number; labelX: number; labelY: number};
type Layout = {width: number; height: number; groups: Cell[]; nodes: Placed[]};

const nodes = graphData.nodes as GraphNode[];
const links = graphData.links as GraphLink[];
const topics = graphData.topics as {name: string; projects: number}[];
const nodeById = new Map(nodes.map((n) => [n.id, n]));
const seriesCount = links.filter((l) => l.kind === 'series').length;
const topicLinks = links.filter((l) => l.kind === 'topic');
const crossCount = topicLinks.filter((l) => l.cross).length;
const groupCount = new Set(nodes.map((n) => n.group)).size;
const degree = new Map<string, number>();
for (const l of links) for (const id of [l.source, l.target]) degree.set(id, (degree.get(id) ?? 0) + 1);

type Focus = {kind: 'node'; id: string} | {kind: 'topic'; name: string} | {kind: 'group'; name: string} | null;

// Which links and nodes stand out for the current focus; null means "show everything normally".
function highlight(focus: Focus) {
  if (!focus) return null;
  let active: GraphLink[];
  if (focus.kind === 'node') active = links.filter((l) => l.source === focus.id || l.target === focus.id);
  else if (focus.kind === 'topic') active = links.filter((l) => l.topic === focus.name);
  else active = links.filter((l) => nodeById.get(l.source)?.group === focus.name || nodeById.get(l.target)?.group === focus.name);
  const ids = new Set(active.flatMap((l) => [l.source, l.target]));
  if (focus.kind === 'node') ids.add(focus.id);
  if (focus.kind === 'group') for (const n of nodes) if (n.group === focus.name) ids.add(n.id);
  return {links: new Set(active), ids};
}

function MapSvg({layout, focus, setFocus, pinned, setPinned, stacked}: {
  layout: Layout; focus: Focus; setFocus: (f: Focus) => void; pinned: string | null; setPinned: (id: string | null) => void; stacked: boolean;
}) {
  const pos = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout]);
  const hi = highlight(focus);
  const tipId = focus?.kind === 'node' ? focus.id : null;
  const tip = tipId ? pos.get(tipId) : undefined;
  const meta = tipId ? nodeById.get(tipId) : undefined;
  const side = tip ? (tip.x / layout.width < 0.3 ? 'left' : tip.x / layout.width > 0.7 ? 'right' : 'center') : 'center';

  return (
    <div className={styles.canvas} style={{aspectRatio: `${layout.width} / ${layout.height}`}}>
      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className={styles.svg} role="img" aria-hidden="true" focusable="false">
        {layout.groups.map((g) => (
          <g
            key={g.group}
            className={clsx(styles.group, focus?.kind === 'group' && focus.name === g.group && styles.groupActive)}
            onClick={() => setFocus(focus?.kind === 'group' && focus.name === g.group ? null : {kind: 'group', name: g.group})}>
            <rect x={g.x0 + 2} y={g.y0 + 2} width={g.x1 - g.x0 - 4} height={g.y1 - g.y0 - 4} rx={12} className={styles.cell} />
            <text x={g.labelX} y={stacked ? g.labelY - 6 : g.labelY} className={styles.groupLabel}>
              {g.group}
              {!stacked && <tspan className={styles.groupCount} dx={8}>{fmt(g.wgs)}</tspan>}
            </text>
            {stacked && <text x={g.labelX} y={g.labelY + 8} className={styles.groupCount}>{fmt(g.wgs)} genomes</text>}
          </g>
        ))}
        <g>
          {links.map((l, i) => {
            const a = pos.get(l.source), b = pos.get(l.target);
            if (!a || !b) return null;
            return (
              <line
                key={i}
                data-link={l.kind}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                className={clsx(styles.link, l.kind === 'series' ? styles.series : l.cross ? styles.cross : styles.topic, hi && (hi.links.has(l) ? styles.on : styles.off))}
              />
            );
          })}
        </g>
        <g>
          {layout.nodes.map((n) => (
            <g
              key={n.id}
              className={styles.nodeHit}
              onMouseEnter={() => !pinned && setFocus({kind: 'node', id: n.id})}
              onMouseLeave={() => !pinned && setFocus(null)}
              onClick={() => {
                const next = pinned === n.id ? null : n.id;
                setPinned(next);
                setFocus(next ? {kind: 'node', id: next} : null);
              }}>
              <circle cx={n.x} cy={n.y} r={Math.max(n.r, 7)} className={styles.hit} />
              <circle
                data-node={n.id}
                cx={n.x} cy={n.y} r={n.r}
                className={clsx(styles.node, hi && (hi.ids.has(n.id) ? styles.on : styles.off), tipId === n.id && styles.nodeActive)}
              />
            </g>
          ))}
        </g>
      </svg>
      {tip && meta && (
        <div
          className={clsx(styles.tooltip, styles[side])}
          style={{left: `${(tip.x / layout.width) * 100}%`, top: `${((tip.y - tip.r) / layout.height) * 100}%`}}
          role="status">
          <span className="label">{meta.id} · {meta.group}</span>
          <strong className={styles.tipName}>{meta.name || '(no project name in source)'}</strong>
          <span className={styles.tipMeta}>{fmt(meta.wgs)} genomes · {degree.get(meta.id) ?? 0} connections</span>
        </div>
      )}
    </div>
  );
}

export default function DatasetMap() {
  const [focus, setFocus] = useState<Focus>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const activeTopic = focus?.kind === 'topic' ? focus.name : null;
  const pick = (f: Focus) => {
    setPinned(null);
    setFocus(f);
  };
  const props = {focus, setFocus: pick, pinned, setPinned};

  return (
    <figure className={styles.figure} aria-label="Dataset map">
      <figcaption className={styles.caption}>
        {nodes.length} projects in {groupCount} disease groups. {seriesCount} links join the yearly continuations of a project;{' '}
        {topicLinks.length} join projects that study the same condition, {crossCount} of them across groups. Hover or tap a
        project to see its connections; pick a topic or a group to highlight it.
      </figcaption>
      <div className={styles.chips} role="group" aria-label="Highlight a shared topic">
        <button type="button" className={styles.chip} aria-pressed={focus === null} onClick={() => pick(null)}>
          All links
        </button>
        {topics.map((t) => (
          <button
            key={t.name}
            type="button"
            data-topic={t.name}
            className={styles.chip}
            aria-pressed={activeTopic === t.name}
            onClick={() => pick(activeTopic === t.name ? null : {kind: 'topic', name: t.name})}>
            {t.name} <span className={styles.chipCount}>{t.projects}</span>
          </button>
        ))}
      </div>
      <div className={styles.wide}>
        <MapSvg layout={graphData.wide as Layout} stacked={false} {...props} />
      </div>
      <div className={styles.tall}>
        <MapSvg layout={graphData.tall as Layout} stacked {...props} />
      </div>
      <ul className={styles.legend}>
        <li><span className={clsx(styles.key, styles.keyDot)} />Project (area = genomes)</li>
        <li><span className={clsx(styles.key, styles.keySeries)} />Same project, later year</li>
        <li><span className={clsx(styles.key, styles.keyTopic)} />Shared topic</li>
        <li><span className={clsx(styles.key, styles.keyCross)} />Shared topic across groups</li>
      </ul>
    </figure>
  );
}
