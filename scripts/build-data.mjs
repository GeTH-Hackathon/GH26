// Converts data/wgs_projects.tsv into src/data/wgs.json (aggregates for the site).
// Fails loudly on malformed input so wrong numbers never ship.
import {readFileSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const HEADER = ['Project ID', 'Type', 'Group', 'Project Name', 'WGSs'];

export function parseWgsTsv(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  while (lines.length > 0 && lines.at(-1).trim() === '') lines.pop();
  if (lines.length === 0) throw new Error('line 1: file is empty');

  const header = lines[0].split('\t').map((s) => s.trim());
  if (header.join('\t') !== HEADER.join('\t')) {
    throw new Error(`line 1: header must be "${HEADER.join(' | ')}", got "${header.join(' | ')}"`);
  }

  return lines.slice(1).map((line, i) => {
    const n = i + 2;
    const fields = line.split('\t').map((s) => s.trim());
    if (fields.length !== HEADER.length) {
      throw new Error(`line ${n}: expected 5 tab-separated fields, got ${fields.length}`);
    }
    const [id, type, group, name, wgsRaw] = fields;
    if (!/^\d+$/.test(wgsRaw)) {
      throw new Error(`line ${n}: WGSs must be a non-negative integer, got "${wgsRaw}"`);
    }
    if (!id || !group) throw new Error(`line ${n}: Project ID and Group are required`);
    return {id, type, group, name, wgs: Number(wgsRaw)};
  });
}

export function aggregate(projects) {
  const groups = new Map();
  for (const p of projects) {
    const g = groups.get(p.group) ?? {group: p.group, wgs: 0, projects: 0};
    g.wgs += p.wgs;
    g.projects += 1;
    groups.set(p.group, g);
  }
  const byGroup = [...groups.values()].sort((a, b) => b.wgs - a.wgs || a.group.localeCompare(b.group));
  return {
    totals: {
      wgs: projects.reduce((sum, p) => sum + p.wgs, 0),
      projects: projects.length,
      groups: byGroup.length,
    },
    byGroup,
    projects,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const src = new URL('../data/wgs_projects.tsv', import.meta.url);
  const out = new URL('../src/data/wgs.json', import.meta.url);
  try {
    const data = aggregate(parseWgsTsv(readFileSync(src, 'utf8')));
    writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
    console.log(`build-data: ${data.totals.projects} projects, ${data.totals.wgs} WGSs -> src/data/wgs.json`);
  } catch (err) {
    console.error(`build-data: data/wgs_projects.tsv ${err.message}`);
    process.exit(1);
  }
}
