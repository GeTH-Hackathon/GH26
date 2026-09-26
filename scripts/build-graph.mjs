// Builds src/data/graph.json: the "dataset map" of projects on /data.
// Links: continuation series (same project funded again) and curated shared topics (data/graph-topics.json).
// The layout is computed here, at build time, so the page ships a finished, deterministic SVG.
import {readFileSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {forceSimulation, forceX, forceY, forceCollide, forceLink} from 'd3-force';
import {parseWgsTsv, aggregate} from './build-data.mjs';

// Normalises a project name so "X", "X (Year 2)", "(Project suite) X Year 3" and "X (Phase 2)" share a key.
export function seriesKey(name) {
  const key = name
    .toLowerCase()
    .replace(/\(project suite\)/g, ' ')
    .replace(/\(continuously funded[^)]*\)/g, ' ')
    .replace(/\(?\b(?:year|phase)\s*\d+\)?/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return key || null;
}

const byId = (a, b) => a.id.localeCompare(b.id);
const pairKey = (a, b) => [a, b].sort().join('|');

export function deriveLinks(projects, topics) {
  const links = [];
  const linked = new Set();

  const series = new Map();
  for (const p of projects) {
    const key = seriesKey(p.name);
    if (key) series.set(key, [...(series.get(key) ?? []), p]);
  }
  for (const members of series.values()) {
    const chain = [...members].sort(byId);
    for (let i = 1; i < chain.length; i++) {
      links.push({source: chain[i - 1].id, target: chain[i].id, kind: 'series'});
      linked.add(pairKey(chain[i - 1].id, chain[i].id));
    }
  }

  for (const topic of topics) {
    const re = new RegExp(topic.pattern, 'i');
    const members = projects.filter((p) => re.test(p.name)).sort(byId);
    for (let i = 0; i < members.length; i++)
      for (let j = i + 1; j < members.length; j++) {
        const [a, b] = [members[i], members[j]];
        const key = pairKey(a.id, b.id);
        if (linked.has(key)) continue;
        linked.add(key);
        links.push({source: a.id, target: b.id, kind: 'topic', topic: topic.name, cross: a.group !== b.group});
      }
  }
  return links;
}

// Small seeded PRNG so d3-force's jiggle is identical on every build.
function lcg(seed = 42) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 2 ** 32);
}

const round = (v) => Math.round(v * 10) / 10;

export function layoutGraph(projects, links, {width, height, cols, pad = 12, labelH = 40, rMin = 2.5}) {
  const groups = aggregate(projects).byGroup; // largest first
  const rows = Math.ceil(groups.length / cols);
  const cellW = width / cols;
  const cellH = height / rows;

  const cells = groups.map((g, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const x0 = c * cellW, y0 = r * cellH;
    return {
      group: g.group, wgs: g.wgs, projects: g.projects,
      x0: round(x0), x1: round(x0 + cellW), y0: round(y0), y1: round(y0 + cellH),
      labelX: round(x0 + pad), labelY: round(y0 + 22),
      // Box the cluster must stay inside.
      bx0: x0 + pad, bx1: x0 + cellW - pad, by0: y0 + labelH, by1: y0 + cellH - pad,
    };
  });
  const cellOf = new Map(cells.map((c) => [c.group, c]));

  // Radius ∝ sqrt(WGS), scaled so the fullest cluster fits its box and no single dot dominates.
  const boxW = cellW - 2 * pad, boxH = cellH - labelH - pad;
  const kArea = Math.min(...groups.map((g) => Math.sqrt((0.45 * boxW * boxH) / (Math.PI * g.wgs))));
  const kSingle = (0.3 * Math.min(boxW, boxH)) / Math.sqrt(Math.max(...projects.map((p) => p.wgs)));
  const k = Math.min(kArea, kSingle);

  const counters = new Map();
  const nodes = [...projects].sort(byId).map((p) => {
    const cell = cellOf.get(p.group);
    const i = counters.get(p.group) ?? 0;
    counters.set(p.group, i + 1);
    const ax = (cell.bx0 + cell.bx1) / 2, ay = (cell.by0 + cell.by1) / 2;
    const angle = i * 2.399963, dist = 4 * Math.sqrt(i + 1); // golden-angle spiral start
    return {id: p.id, group: p.group, r: Math.max(rMin, k * Math.sqrt(p.wgs)), ax, ay, x: ax + dist * Math.cos(angle), y: ay + dist * Math.sin(angle)};
  });

  const clamp = () => {
    for (const n of nodes) {
      const c = cellOf.get(n.group);
      n.x = Math.min(Math.max(n.x, c.bx0 + n.r), c.bx1 - n.r);
      n.y = Math.min(Math.max(n.y, c.by0 + n.r), c.by1 - n.r);
    }
  };
  const seriesLinks = links.filter((l) => l.kind === 'series').map((l) => ({...l}));
  const sim = forceSimulation(nodes)
    .randomSource(lcg())
    .force('x', forceX((d) => d.ax).strength(0.08))
    .force('y', forceY((d) => d.ay).strength(0.08))
    .force('collide', forceCollide((d) => d.r + 1.5).iterations(4))
    .force('link', forceLink(seriesLinks).id((d) => d.id).distance((l) => l.source.r + l.target.r + 6).strength(0.2))
    .stop();
  for (let i = 0; i < 400; i++) {
    sim.tick();
    clamp();
  }
  // Settle overlaps introduced by clamping, with only collision active.
  sim.force('x', null).force('y', null).force('link', null).alpha(0.3);
  for (let i = 0; i < 300; i++) {
    sim.tick();
    clamp();
  }

  return {
    width, height,
    groups: cells.map(({bx0, bx1, by0, by1, ...c}) => c),
    nodes: nodes.map((n) => ({id: n.id, group: n.group, x: round(n.x), y: round(n.y), r: round(n.r)})),
  };
}

export function buildGraph(projects, topics) {
  const links = deriveLinks(projects, topics);
  return {
    nodes: [...projects].sort(byId).map(({id, type, group, name, wgs}) => ({id, type, group, name, wgs})),
    links,
    topics: topics.map((t) => {
      const re = new RegExp(t.pattern, 'i');
      return {name: t.name, projects: projects.filter((p) => re.test(p.name)).length};
    }),
    wide: layoutGraph(projects, links, {width: 1200, height: 600, cols: 4}),
    tall: layoutGraph(projects, links, {width: 360, height: 900, cols: 2, pad: 8, labelH: 36, rMin: 2}),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const projects = parseWgsTsv(readFileSync(new URL('../data/wgs_projects.tsv', import.meta.url), 'utf8'));
    const topics = JSON.parse(readFileSync(new URL('../data/graph-topics.json', import.meta.url), 'utf8'));
    const graph = buildGraph(projects, topics);
    writeFileSync(new URL('../src/data/graph.json', import.meta.url), JSON.stringify(graph) + '\n');
    const series = graph.links.filter((l) => l.kind === 'series').length;
    console.log(`build-graph: ${graph.nodes.length} projects, ${series} series + ${graph.links.length - series} topic links -> src/data/graph.json`);
  } catch (err) {
    console.error(`build-graph: ${err.message}`);
    process.exit(1);
  }
}
