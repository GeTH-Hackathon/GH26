// Pure, dependency-free so node:test can import it directly (Node strips the types).
export type BarProject = {id: string; group: string; wgs: number};
export type Rect = {x: number; y: number; width: number; height: number};
export type Column = {group: string; x: number; width: number; total: number; projects: number};
export type BarcodeLayouts = {order: BarProject[]; strip: Rect[]; grouped: Rect[]; columns: Column[]};
export type LayoutOptions = {width: number; height: number; gap?: number; minWidth?: number; columnGap?: number};

const r2 = (v: number) => Math.round(v * 100) / 100;

// Two arrangements of the same bars, index-aligned with `order`:
// a strip (width ∝ genomes) and one stacked column per disease group (height ∝ genomes).
export function barcodeLayouts<T extends BarProject>(
  projects: T[],
  {width, height, gap = 0.0015, minWidth = 0.0006, columnGap = 0.04}: LayoutOptions,
): BarcodeLayouts & {order: T[]} {
  const totals = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const p of projects) {
    totals.set(p.group, (totals.get(p.group) ?? 0) + p.wgs);
    counts.set(p.group, (counts.get(p.group) ?? 0) + 1);
  }
  const groups = [...totals.keys()].sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0) || a.localeCompare(b));
  const rank = new Map(groups.map((g, i) => [g, i]));
  const order = [...projects].sort(
    (a, b) => (rank.get(a.group) ?? 0) - (rank.get(b.group) ?? 0) || b.wgs - a.wgs || a.id.localeCompare(b.id),
  );
  const total = order.reduce((s, p) => s + p.wgs, 0);

  // Strip: widths in genome units (tiny projects get a minimum width), then scaled to `width`.
  const g = total * gap;
  const mw = total * minWidth;
  const raw = order.map((p) => Math.max(p.wgs, mw));
  const k = width / (raw.reduce((s, w) => s + w, 0) + g * (order.length - 1));
  let x = 0;
  const strip = raw.map((w) => {
    const rect = {x: r2(x * k), y: 0, width: r2(w * k), height};
    x += w + g;
    return rect;
  });

  // Grouped: equal-width columns separated by `columnGap * width`, bars stacked up from the baseline.
  const n = groups.length;
  const gapPx = width * columnGap;
  const colW = (width - gapPx * (n - 1)) / n;
  const maxTotal = Math.max(...groups.map((gr) => totals.get(gr) ?? 0));
  const filled = new Map<string, number>();
  const grouped = order.map((p) => {
    const col = rank.get(p.group) ?? 0;
    const h = (p.wgs / maxTotal) * height;
    const below = filled.get(p.group) ?? 0;
    filled.set(p.group, below + h);
    return {x: r2(col * (colW + gapPx)), y: r2(height - below - h), width: r2(colW), height: r2(h)};
  });
  const columns = groups.map((gr, i) => ({
    group: gr,
    x: r2(i * (colW + gapPx)),
    width: r2(colW),
    total: totals.get(gr) ?? 0,
    projects: counts.get(gr) ?? 0,
  }));
  return {order, strip, grouped, columns};
}
