// Assertions against the static HTML produced by `npm run build`.
// Run with: npm run build && npm run test:site
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const BASE = process.env.BASE_URL ?? '/GH26/';
// The Faster (swc) minifier drops attribute quotes; re-quote so assertions can match `name="value"`.
const requote = (html) => html.replace(/(<[^>]*?\s[\w:-]+)=([^\s"'>=`]+)/g, (m, pre, v) => `${pre}="${v}"`);
const read = (path) => {
  let html = readFileSync(new URL(`../build/${path}`, import.meta.url), 'utf8');
  for (let prev; prev !== html; ) [prev, html] = [html, requote(html)];
  return html;
};
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
