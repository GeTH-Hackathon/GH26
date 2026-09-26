import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseWgsTsv, aggregate} from './build-data.mjs';

const HEADER = 'Project ID\tType\tGroup\tProject Name\tWGSs';
const row = (...f) => f.join('\t');

test('real file: totals match the published counts', () => {
  const text = readFileSync(new URL('../data/wgs_projects.tsv', import.meta.url), 'utf8');
  const data = aggregate(parseWgsTsv(text));
  assert.deepEqual(data.totals, {wgs: 51461, projects: 118, groups: 7});
  assert.deepEqual(data.byGroup[0], {group: 'Rare Diseases', wgs: 18483, projects: 23});
  assert.deepEqual(data.byGroup.at(-1), {group: 'Non-Rare & Non-Cancer', wgs: 1017, projects: 1});
});

test('empty project name is kept as an empty string', () => {
  const [p] = parseWgsTsv([HEADER, row('00-001', 'Service', 'Rare Diseases', '', '13017')].join('\n'));
  assert.deepEqual(p, {id: '00-001', type: 'Service', group: 'Rare Diseases', name: '', wgs: 13017});
});

test('tolerates missing trailing newline, trailing blank lines, CRLF, BOM and stray spaces', () => {
  const body = [HEADER, row('63-078', 'Research', 'Cancer', ' Brain ', ' 10 '), row('63-102', 'Research', 'Cancer', 'Liver', '56')];
  for (const text of [body.join('\n'), body.join('\n') + '\n\n\n', body.join('\r\n') + '\r\n', '﻿' + body.join('\n')]) {
    const ps = parseWgsTsv(text);
    assert.equal(ps.length, 2);
    assert.deepEqual(ps[0], {id: '63-078', type: 'Research', group: 'Cancer', name: 'Brain', wgs: 10});
  }
});

test('rejects a wrong header', () => {
  assert.throws(() => parseWgsTsv('ID\tType\tGroup\tName\tCount\n'), /line 1: header/);
});

test('rejects a row with the wrong number of fields, naming the line', () => {
  const text = [HEADER, row('a', 'Research', 'Cancer', 'x', '1'), row('b', 'Research', 'Cancer', '1')].join('\n');
  assert.throws(() => parseWgsTsv(text), /line 3: expected 5 tab-separated fields, got 4/);
});

test('rejects a blank line inside the data', () => {
  const text = [HEADER, row('a', 'Research', 'Cancer', 'x', '1'), '', row('b', 'Research', 'Cancer', 'y', '2')].join('\n');
  assert.throws(() => parseWgsTsv(text), /line 3: expected 5/);
});

test('rejects a non-integer WGS count, naming the line', () => {
  for (const bad of ['1.5', '-3', 'n/a', '']) {
    const text = [HEADER, row('a', 'Research', 'Cancer', 'x', bad)].join('\n');
    assert.throws(() => parseWgsTsv(text), /line 2: WGSs must be a non-negative integer/);
  }
});

test('rejects rows missing ID or group', () => {
  const text = [HEADER, row('', 'Research', 'Cancer', 'x', '1')].join('\n');
  assert.throws(() => parseWgsTsv(text), /line 2: Project ID and Group are required/);
});

test('aggregate sorts groups by WGS desc, then name', () => {
  const data = aggregate([
    {id: '1', type: 'R', group: 'B', name: '', wgs: 5},
    {id: '2', type: 'R', group: 'A', name: '', wgs: 5},
    {id: '3', type: 'R', group: 'C', name: '', wgs: 9},
  ]);
  assert.deepEqual(data.byGroup.map((g) => g.group), ['C', 'A', 'B']);
});
