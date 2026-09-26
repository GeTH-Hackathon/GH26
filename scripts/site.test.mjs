// Assertions against the static HTML produced by `npm run build`.
// Run with: npm run build && npm run test:site
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const BASE = process.env.BASE_URL ?? '/GH26/';
// The Faster (swc) minifier drops attribute quotes and optional end tags, and React adds `<!-- -->`
// between text nodes. Normalise so assertions can match `name="value"`, plain text and `&`.
// Assertions must not rely on optional end tags such as </p>, </li> or </td>.
const requote = (tag) =>
  tag.replace(/(\s[\w:-]+)=("[^"]*"|'[^']*'|[^\s"'>]+)/g, (m, name, v) => (v[0] === '"' || v[0] === "'" ? m : `${name}="${v}"`));
const normalise = (html) => html.replaceAll('<!-- -->', '').replace(/<[a-zA-Z][^>]*>/g, requote).replaceAll('&amp;', '&');
const read = (path) => normalise(readFileSync(new URL(`../build/${path}`, import.meta.url), 'utf8'));
const PAGES = ['index.html'];

test('base url: every internal href/src is prefixed with the base url', () => {
  for (const page of PAGES) {
    const html = read(page);
    const paths = [...html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]).filter((p) => !p.startsWith('//'));
    assert.ok(paths.length > 0, `${page}: expected internal links`);
    const bad = paths.filter((p) => !p.startsWith(BASE));
    assert.deepEqual(bad, [], `${page}: links missing ${BASE}`);
  }
});

test('apply: no dead links anywhere', () => {
  for (const page of PAGES) {
    assert.doesNotMatch(read(page), /href="(?:null|undefined|)"/, page);
  }
});

test('apply: disabled button with opening message while no form url, else a Google Form link', () => {
  const html = read('index.html');
  assert.match(html, /id="apply"/);
  const hasForm = /href="https:\/\/(?:docs\.google\.com\/forms|forms\.gle)\/[^"]+"/.test(html);
  if (!hasForm) {
    assert.match(html, /<button[^>]*disabled[^>]*>Applications open November 2026<\/button>/);
  }
});

test('footer: sign-off and placeholder pages linked', () => {
  const html = read('index.html');
  assert.match(html, /see you in chiang mai\./);
  assert.match(html, new RegExp(`href="${BASE}terms/"`));
  assert.match(html, new RegExp(`href="${BASE}tre-guidelines/"`));
});

test('hero: wordmark, accessible title and status line', () => {
  const html = read('index.html');
  assert.match(html, /<h1[^>]*>.*geth\..*GeTH Hackathon 2027.*<\/h1>/s);
  assert.match(html, /FEB 7–12 2027 \\ CHIANG MAI \\ 50K GENOMES/);
  assert.match(html, /role="img"[^>]*aria-label="Barcode of 118 Genomics Thailand projects/);
});

test('objectives: three numbered objectives', () => {
  const html = read('index.html');
  assert.match(html, /id="objectives"/);
  for (const n of ['01', '02', '03']) assert.match(html, new RegExp(`>${n}<`));
});

test('data: en-US formatted totals, all seven groups and the data types', () => {
  const html = read('index.html');
  assert.match(html, /id="data"/);
  assert.match(html, /\(51,461\)/);
  assert.match(html, />118</);
  for (const g of ['Rare Diseases', 'NCD', 'Cancer', 'Pharmacogenomics', 'Infectious Diseases', 'Popgen', 'Non-Rare & Non-Cancer']) {
    assert.ok(html.includes(g), `missing group ${g}`);
  }
  for (const t of ['VCF', 'PLINK', 'HLA', 'CYP', 'STRUCTURAL VARIANTS', 'DEMOGRAPHICS']) assert.ok(html.includes(t), `missing ${t}`);
  assert.match(html, /href="https:\/\/data\.genomicsthailand\.com"/);
});
