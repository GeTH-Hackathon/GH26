import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseWgsTsv} from './build-data.mjs';
import {seriesKey, deriveLinks, layoutGraph, buildGraph} from './build-graph.mjs';

const P = (id, group, name, wgs = 10) => ({id, type: 'Research', group, name, wgs});
const TOPICS = [{name: 'tuberculosis', pattern: 'tubercul'}, {name: 'colorectal', pattern: 'colorectal'}];

test('seriesKey strips year/phase/suite markers so continuations share a key', () => {
  const k = seriesKey('Detection of gene abnormalities in colorectal cancer');
  assert.equal(seriesKey('Detection of gene abnormalities in colorectal cancer (Year 2)'), k);
  assert.equal(seriesKey('Detection of gene abnormalities in colorectal cancer Year 3'), k);
  assert.equal(seriesKey('(Project suite) Detection of gene abnormalities in colorectal cancer (Year 3)'), k);
  assert.equal(seriesKey('Pharmacogenetics of mycophenolic acid (Phase 2)'), seriesKey('Pharmacogenetics of mycophenolic acid'));
  assert.notEqual(seriesKey('Study A'), seriesKey('Study B'));
  assert.equal(seriesKey(''), null, 'empty names never form a series');
});

test('series links chain continuations in project-id order', () => {
  const links = deriveLinks([P('66-155', 'Cancer', 'X (Year 3)'), P('64-114', 'Cancer', 'X'), P('65-064', 'Cancer', 'X (Year 2)')], []);
  assert.deepEqual(links.map((l) => [l.source, l.target, l.kind]), [['64-114', '65-064', 'series'], ['65-064', '66-155', 'series']]);
});

test('topic links connect every pair sharing a topic, flag cross-group pairs, and skip pairs already linked as a series', () => {
  const links = deriveLinks(
    [
      P('a', 'Infectious Diseases', 'Tuberculosis cohort'),
      P('b', 'Infectious Diseases', 'Tuberculosis cohort (Year 2)'),
      P('c', 'Infectious Diseases', 'Tuberculous meningitis'),
      P('d', 'Cancer', 'Hereditary colorectal cancer'),
      P('e', 'Pharmacogenomics', '5-FU in colorectal cancer patients'),
      P('f', 'Rare Diseases', ''),
    ],
    TOPICS,
  );
  const topic = links.filter((l) => l.kind === 'topic').map((l) => `${l.source}-${l.target}:${l.topic}:${l.cross}`);
  assert.deepEqual(topic.sort(), ['a-c:tuberculosis:false', 'b-c:tuberculosis:false', 'd-e:colorectal:true']);
  assert.equal(links.filter((l) => l.kind === 'series').length, 1);
});

test('layout is deterministic, stays inside the canvas and does not overlap nodes', () => {
  const projects = Array.from({length: 40}, (_, i) => P(`p${i}`, ['A', 'B', 'C'][i % 3], `Study ${i}`, (i + 1) * 37));
  const opts = {width: 600, height: 400, cols: 3};
  const one = layoutGraph(projects, deriveLinks(projects, []), opts);
  const two = layoutGraph(projects, deriveLinks(projects, []), opts);
  assert.deepEqual(one, two);
  for (const n of one.nodes) {
    assert.ok(n.x - n.r >= 0 && n.x + n.r <= 600 && n.y - n.r >= 0 && n.y + n.r <= 400, `${n.id} outside canvas`);
  }
  for (let i = 0; i < one.nodes.length; i++)
    for (let j = i + 1; j < one.nodes.length; j++) {
      const a = one.nodes[i], b = one.nodes[j];
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.r + b.r - 0.5, `${a.id} overlaps ${b.id}`);
    }
});

test('each group clusters inside its own grid cell, below its label', () => {
  const projects = Array.from({length: 30}, (_, i) => P(`p${i}`, ['A', 'B', 'C'][i % 3], `Study ${i}`, 50));
  const g = layoutGraph(projects, [], {width: 600, height: 300, cols: 3});
  for (const cell of g.groups) {
    const members = g.nodes.filter((n) => n.group === cell.group);
    for (const n of members) {
      assert.ok(n.x >= cell.x0 && n.x <= cell.x1 && n.y >= cell.y0 && n.y <= cell.y1, `${n.id} escaped ${cell.group}`);
      assert.ok(n.y - n.r > cell.labelY, `${n.id} overlaps the ${cell.group} label`);
    }
  }
});

test('real data: 118 projects, 27 series links, cross-group topic links present, two layouts', () => {
  const projects = parseWgsTsv(readFileSync(new URL('../data/wgs_projects.tsv', import.meta.url), 'utf8'));
  const topics = JSON.parse(readFileSync(new URL('../data/graph-topics.json', import.meta.url), 'utf8'));
  const g = buildGraph(projects, topics);
  assert.equal(g.wide.nodes.length, 118);
  assert.equal(g.tall.nodes.length, 118);
  assert.equal(g.links.filter((l) => l.kind === 'series').length, 27);
  assert.ok(g.links.some((l) => l.kind === 'topic' && l.cross), 'expected cross-group topic links');
  assert.deepEqual(g.topics.map((t) => t.name), topics.map((t) => t.name));
  assert.ok(g.topics.every((t) => t.projects >= 2), 'every curated topic should match at least two projects');
});
