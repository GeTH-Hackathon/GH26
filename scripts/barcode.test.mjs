import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {barcodeLayouts} from '../src/lib/barcodeLayouts.ts';

const wgs = JSON.parse(readFileSync(new URL('../src/data/wgs.json', import.meta.url), 'utf8'));
const W = 1200, H = 360;
const L = barcodeLayouts(wgs.projects, {width: W, height: H});
const eps = 0.02;

test('one bar per project in both layouts, index-aligned with order', () => {
  assert.equal(L.order.length, 118);
  assert.equal(L.strip.length, 118);
  assert.equal(L.grouped.length, 118);
});

test('strip: full height, left to right, no overlap, fits the width', () => {
  for (let i = 0; i < L.strip.length; i++) {
    const b = L.strip[i];
    assert.equal(b.y, 0);
    assert.equal(b.height, H);
    if (i > 0) assert.ok(L.strip[i - 1].x + L.strip[i - 1].width <= b.x + eps, `bar ${i} overlaps`);
  }
  const last = L.strip.at(-1);
  assert.ok(Math.abs(last.x + last.width - W) < 0.5, 'strip should span the width');
});

test('columns: one per group, ordered by total desc, totals match wgs.byGroup', () => {
  assert.deepEqual(L.columns.map((c) => [c.group, c.total, c.projects]), wgs.byGroup.map((g) => [g.group, g.wgs, g.projects]));
  for (let i = 1; i < L.columns.length; i++) assert.ok(L.columns[i].x > L.columns[i - 1].x + L.columns[i - 1].width);
  assert.ok(Math.abs(L.columns.at(-1).x + L.columns.at(-1).width - W) < 0.5, 'columns should span the width');
});

test('grouped: each bar sits in its group column, stacked inside the height; tallest column reaches the top', () => {
  const col = new Map(L.columns.map((c) => [c.group, c]));
  L.order.forEach((p, i) => {
    const b = L.grouped[i];
    assert.equal(b.x, col.get(p.group).x, `${p.id} not in its column`);
    assert.equal(b.width, col.get(p.group).width);
    assert.ok(b.y >= -eps && b.y + b.height <= H + eps, `${p.id} outside the height`);
  });
  const top = Math.min(...L.grouped.map((b) => b.y));
  assert.ok(top < 0.5, 'largest group should fill the height');
});

test('grouped heights are proportional to genomes', () => {
  const ratio = L.grouped[0].height / L.order[0].wgs;
  L.order.forEach((p, i) => assert.ok(Math.abs(L.grouped[i].height - p.wgs * ratio) < 0.05, p.id));
});

test('order: groups by total desc, then genomes desc within a group', () => {
  const rank = new Map(L.columns.map((c, i) => [c.group, i]));
  for (let i = 1; i < L.order.length; i++) {
    const a = L.order[i - 1], b = L.order[i];
    assert.ok(rank.get(a.group) < rank.get(b.group) || (a.group === b.group && a.wgs >= b.wgs), `order broken at ${i}`);
  }
});
