// Assertions against the static HTML produced by `npm run build`.
// Run with: npm run build && npm run test:site
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';

const BASE = process.env.BASE_URL ?? '/';
// The Faster (swc) minifier drops attribute quotes and optional end tags, and React adds `<!-- -->`
// between text nodes. Normalise so assertions can match `name="value"`, plain text and `&`.
// Assertions must not rely on optional end tags such as </p>, </li> or </td>.
const requote = (tag) =>
  tag.replace(/(\s[\w:-]+)=("[^"]*"|'[^']*'|[^\s"'>]+)/g, (m, name, v) => (v[0] === '"' || v[0] === "'" ? m : `${name}="${v}"`));
const normalise = (html) => html.replaceAll('<!-- -->', '').replace(/<[a-zA-Z][^>]*>/g, requote).replaceAll('&amp;', '&');
const read = (path) => normalise(readFileSync(new URL(`../build/${path}`, import.meta.url), 'utf8'));
const PAGES = ['index.html', 'data/index.html', 'terms/index.html', 'tre-guidelines/index.html'];

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

test('apply: Apply buttons link to the Google Form in a new tab; no disabled placeholder left', () => {
  const html = read('index.html');
  assert.match(html, /id="apply"/);
  const links = html.match(/<a[^>]*href="https:\/\/forms\.gle\/f76Bmzxu144CktoC6"[^>]*>Apply now ↗<\/a>/g) ?? [];
  assert.equal(links.length, 2, 'hero and apply section');
  for (const a of links) assert.match(a, /target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /<button[^>]*disabled[^>]*>Applications open/);
});

test('footer: sign-off and placeholder pages linked', () => {
  const html = read('index.html');
  assert.match(html, />See you at Chiang Mai</);
  assert.doesNotMatch(html, /see you in chiang mai/i);
  assert.match(html, new RegExp(`href="${BASE}terms/"`));
  assert.match(html, new RegExp(`href="${BASE}tre-guidelines/"`));
});

test('hero: wordmark, accessible title and status line', () => {
  const html = read('index.html');
  const h1 = html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1] ?? '';
  assert.equal(h1.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(), 'GeTH Hackathon 2027', 'h1 reads "GeTH Hackathon 2027"');
  assert.doesNotMatch(h1, /aria-hidden/, 'visible wordmark is the accessible title');
  assert.doesNotMatch(h1, /geth\./);
  assert.match(html, /FEB 7–12 2027 \\ CHIANG MAI \\ 50K GENOMES/);
  assert.match(html, /role="img"[^>]*aria-label="Barcode of 118 Genomics Thailand projects/);
});

test('objectives: event-level intro and five numbered objectives', () => {
  const html = read('index.html');
  const section = html.slice(html.indexOf('id="objectives"'), html.indexOf('id="data"'));
  for (const n of ['01', '02', '03', '04', '05']) assert.match(section, new RegExp(`>${n}<`));
  assert.doesNotMatch(section, />06</);
  for (const s of [
    'The Genomics Thailand (GeTH) Hackathon brings bioinformaticians',
    'questions that matter at the bedside and in the lab',
    'large language models',
    'analyse in place and share only aggregate results',
    'Tackle real clinical and biological questions',
    'Grow a lasting community',
  ]) assert.ok(section.includes(s), `missing "${s}"`);
  assert.doesNotMatch(section, /Stress-test|Genomic Landscape Report/, 'grant-project objectives removed');
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

test('dates & venue: date range, city, hotel TBA and airport', () => {
  const html = read('index.html');
  assert.match(html, /id="dates"/);
  assert.match(html, /7–12 February 2027/);
  assert.match(html, /Chiang Mai, Thailand/);
  assert.match(html, /Chiang Mai International Airport \(CNX\)/);
});

test('important dates: four milestones, inexact ones tagged TBA', () => {
  const html = read('index.html');
  const section = html.slice(html.indexOf('id="important-dates"'), html.indexOf('id="schedule"'));
  for (const d of ['November 2026', 'December 2026', 'January 2027', '7–12 February 2027']) assert.ok(section.includes(d), d);
  assert.equal((section.match(/class="tba"/g) ?? []).length, 3);
});

test('schedule: supplied times and every day present', () => {
  const html = read('index.html');
  const section = html.slice(html.indexOf('id="schedule"'));
  for (const s of ['12:30', 'Registration opens', '13:00', 'Opening', 'Self-introduction of participants', 'TRE tutorial', 'Topic proposals', '07:00–09:00', '12:00', 'Wrap-up session', 'Depart from venue to CNX airport']) {
    assert.ok(section.includes(s), `missing "${s}"`);
  }
  for (const d of ['Sun 7 Feb', 'Mon 8 Feb', 'Tue 9 Feb', 'Wed 10 Feb', 'Thu 11 Feb', 'Fri 12 Feb']) assert.ok(section.includes(d), d);
});

test('organizers: roles and all partners', () => {
  const html = read('index.html');
  assert.match(html, /id="organizers"/);
  for (const s of ['Organizer', 'Supported by', 'Data partners', 'Faculty of Medicine, Chiang Mai University', 'Health Systems Research Institute (HSRI)', 'NSTDA', 'Genomics Thailand']) {
    assert.ok(html.includes(s), `missing "${s}"`);
  }
});

test('home: every section present in spec order', () => {
  const html = read('index.html');
  const ids = ['objectives', 'data', 'dates', 'important-dates', 'schedule', 'apply', 'organizers', 'links'];
  const positions = ids.map((id) => html.indexOf(`id="${id}"`));
  positions.forEach((p, i) => assert.ok(p > -1, `missing #${ids[i]}`));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'sections out of order');
});

test('links: external links open safely in a new tab', () => {
  const html = read('index.html');
  const section = html.slice(html.indexOf('id="links"'));
  assert.match(section, /href="https:\/\/data\.genomicsthailand\.com"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.match(section, /href="https:\/\/2026\.biohackathon\.org"/);
});

test('/data: first page of 10 projects, awkward rows rendered faithfully', () => {
  const html = read('data/index.html');
  assert.equal((html.match(/data-row="project"/g) ?? []).length, 10);
  assert.match(html, /<td>00-001(?:<\/td>)?<td>Service(?:<\/td>)?<td>Rare Diseases(?:<\/td>)?<td>—/);
  assert.ok(html.includes('51,461'));
  for (const t of ['VCF', 'PLINK', 'HLA', 'CYP', 'Structural variants', 'Demographics']) assert.ok(html.includes(t), t);
});

test('/data: default sort is WGS descending', () => {
  const html = read('data/index.html');
  const first = html.indexOf('<td>00-001');
  const second = html.indexOf('<td>64-128');
  assert.ok(first > -1 && second > first, 'largest project (13,017) should be listed before 64-128 (3,700)');
  assert.match(html, /aria-sort="descending"/);
});

test('TRE guidelines page is still a placeholder that links back to apply', () => {
  const html = read('tre-guidelines/index.html');
  assert.match(html, /Will be announced soon\./);
  assert.match(html, /href="[^"]*#apply"/);
});

test('terms page publishes the confidentiality rules and code of conduct', () => {
  const html = read('terms/index.html');
  assert.doesNotMatch(html, /Will be announced soon/);
  for (const s of [
    'Confidentiality and disclosure', 'Data access and security', 'Code of conduct', 'Breaches', 'Changes and contact',
    'Sharing any non-public information from this event is strictly prohibited',
    'without prior written permission from the Health Systems Research Institute (HSRI)',
    'Do not distribute or disclose any data or analytical findings externally',
    'Trusted Research Environment', 'Personal Data Protection Act',
  ]) assert.ok(html.includes(s), `missing "${s}"`);
  assert.match(html, /href="[^"]*#apply"/);
});

test('home: Terms no longer marked "coming soon"; TRE guidelines still are', () => {
  const html = read('index.html');
  const between = (from, start, end) => {
    const i = html.indexOf(start, html.indexOf(from));
    return html.slice(i, html.indexOf(end, i));
  };
  // Apply section: the Terms row (up to the TRE row) has no "Coming soon" tag; the TRE row keeps it.
  assert.doesNotMatch(between('id="apply"', 'Terms & Conditions', 'TRE guideline instructions'), /Coming soon/);
  assert.match(between('id="apply"', 'TRE guideline instructions', '</aside>'), /Coming soon/);
  // Links section: same rule for the "Will be announced soon" notes.
  assert.doesNotMatch(between('id="links"', 'Terms & Conditions', 'TRE guideline instructions'), /Will be announced soon/);
  assert.match(between('id="links"', 'TRE guideline instructions', '</ul>'), /Will be announced soon/);
});

test('schedule: Friday shows no breakfast time (only supplied times are shown)', () => {
  const html = read('index.html');
  const friday = html.slice(html.indexOf('Fri 12 Feb'), html.indexOf('id="apply"'));
  assert.ok(friday.includes('Breakfast'));
  assert.ok(!friday.includes('07:00'), 'Friday breakfast time was not supplied by the organizers');
});

test('marquee: pauses on hover and keyboard focus (WCAG 2.2.2)', () => {
  const css = readdirSync(new URL('../build/assets/css/', import.meta.url))
    .map((f) => readFileSync(new URL(`../build/assets/css/${f}`, import.meta.url), 'utf8'))
    .join('');
  assert.match(css, /\.marquee[\w-]*:hover [^{]*\{[^}]*animation-play-state:\s*paused/);
  assert.match(css, /\.marquee[\w-]*:focus-within [^{]*\{[^}]*animation-play-state:\s*paused/);
});

test('/data: content sits inside a padded container, not on the page edge', () => {
  const html = read('data/index.html');
  assert.match(html, /<main[^>]*class="section[^"]*"[^>]*><div class="container-swiss">/);
  assert.doesNotMatch(html, /<main[^>]*class="[^"]*container-swiss/);
});

test('/data: project table is searchable and captioned', () => {
  const html = read('data/index.html');
  assert.match(html, /<label[^>]*for="project-search"[^>]*>Search projects/);
  assert.match(html, /<input[^>]*type="search"[^>]*id="project-search"|<input[^>]*id="project-search"[^>]*type="search"/);
  assert.match(html, /aria-live="polite"[^>]*>Showing 1–10 of 118 projects · 51,461 genomes/);
  assert.match(html, /<caption[^>]*>/);
});

test('/data: pager with page numbers, current page marked, previous disabled on page 1', () => {
  const html = read('data/index.html');
  const nav = html.slice(html.search(/<nav[^>]*aria-label="Project table pages"/));
  assert.ok(nav.length < html.length, 'missing pager nav');
  assert.match(nav, /Page 1 of 12/);
  assert.match(nav, /<button[^>]*aria-current="page"[^>]*>1<\/button>/);
  assert.match(nav, /<button[^>]*disabled[^>]*>← Previous<\/button>/);
  assert.match(nav, />12<\/button>/);
});

test('navbar logo reads "GeTH Hackathon" on every page', () => {
  for (const page of PAGES) {
    assert.match(read(page), /class="navbar__title[^"]*">GeTH Hackathon</, page);
  }
});

const builtCss = () =>
  readdirSync(new URL('../build/assets/css/', import.meta.url))
    .map((f) => readFileSync(new URL(`../build/assets/css/${f}`, import.meta.url), 'utf8'))
    .join('');

test('theme: navbar has a dark/light toggle and light is the default (device setting ignored)', () => {
  const html = read('index.html');
  assert.match(html, /<button[^>]*aria-label="Switch between dark and light mode/);
  // Docusaurus' inline script: the visitor's stored choice, otherwise light.
  assert.match(html, /setAttribute\("data-theme",\s*\w+\s*\|\|\s*"light"\)/);
  assert.doesNotMatch(html, /prefers-color-scheme: ?dark/);
});

test('theme: dark palette tokens exist in the built CSS', () => {
  const css = builtCss();
  const dark = css.match(/html\[data-theme=["']?dark["']?\]\{([^}]*)\}/g)?.join('') ?? '';
  for (const token of ['--paper:#0a0a0a', '--ink:#f2f2f2', '--rule:#262626', '--text-2:#b0b0b0', '--panel-bg:#161616']) {
    assert.ok(dark.replace(/\s/g, '').toLowerCase().includes(token), `missing ${token} in dark theme`);
  }
});

test('theme: no hard-coded greys left in component CSS (all colours come from tokens)', () => {
  const css = builtCss().replace(/:root\{[^}]*\}|html\[data-theme=["']?dark["']?\]\{[^}]*\}/g, '');
  const modules = css.match(/\.[A-Za-z]+_[A-Za-z0-9]{4}[^{]*\{[^}]*\}/g) ?? [];
  const offenders = modules.filter((rule) => /#(?:555|555555|5a5a5a|1f1f1f|d0d0d0|2a2a2a)\b/i.test(rule));
  assert.deepEqual(offenders, []);
});

test('/data: dataset map renders every project, both link kinds, topic filters, legend and a text summary', () => {
  const html = read('data/index.html');
  const map = html.slice(html.search(/<figure[^>]*aria-label="Dataset map"/));
  assert.ok(map.length < html.length, 'missing dataset map figure');
  assert.ok(html.indexOf('aria-label="Dataset map"') < html.indexOf('id="project-search"'), 'map sits above the project table');
  // Two layouts (wide + tall), each with every project and every series link.
  assert.equal((map.match(/data-node="/g) ?? []).length, 236);
  assert.equal((map.match(/data-link="series"/g) ?? []).length, 54);
  assert.ok((map.match(/data-link="topic"/g) ?? []).length > 0);
  const chips = (map.match(/<button[^>]*>/g) ?? []).filter((b) => /data-topic=/.test(b) && /aria-pressed="(?:true|false)"/.test(b));
  assert.equal(chips.length, 13);
  for (const s of ['Same project, later year', 'Shared topic', 'Shared topic across groups']) assert.ok(map.includes(s), `legend: ${s}`);
  assert.match(map, /118 projects in 7 disease groups/);
  for (const g of ['Rare Diseases', 'NCD', 'Cancer', 'Pharmacogenomics', 'Infectious Diseases', 'Popgen', 'Non-Rare & Non-Cancer']) assert.ok(map.includes(g), g);
});

test('eligibility: open to Thai nationals only, stated in Apply and reflected in objectives', () => {
  const html = read('index.html');
  const apply = html.slice(html.indexOf('id="apply"'), html.indexOf('id="organizers"'));
  assert.match(apply, /Open to Thai nationals only/);
  assert.match(apply, /Thai nationality/);
  const objectives = html.slice(html.indexOf('id="objectives"'), html.indexOf('id="data"'));
  assert.doesNotMatch(objectives, /regional researchers/);
});

test('data headings read "/ Genomics data." on the home page and /data', () => {
  const heading = (html, tag) => (html.match(new RegExp(`<${tag} class="slash-heading">(.*?)</${tag}>`, 'gs')) ?? []).map((h) => h.replace(/<[^>]+>/g, '').trim());
  const home = read('index.html');
  const homeData = home.slice(home.indexOf('id="data"'), home.indexOf('id="dates"'));
  assert.deepEqual(heading(homeData, 'h2'), ['/ Genomics data.']);
  const page = read('data/index.html');
  assert.deepEqual(heading(page, 'h1'), ['/ Genomics data.']);
  assert.match(page, /<title[^>]*>Genomics data \| GeTH Hackathon 2027<\/title>/);
});

test('every slash heading is sentence case: "/ " then an upper-case first letter, never forced to lowercase', () => {
  const all = [];
  for (const page of PAGES) {
    for (const m of read(page).matchAll(/<(h1|h2) class="slash-heading">(.*?)<\/\1>/gs)) all.push(`${page}: ${m[2].replace(/<[^>]+>/g, '').trim()}`);
  }
  assert.ok(all.length >= 11, `expected every section heading, got ${all.length}`);
  const bad = all.filter((h) => !/: \/ [A-Z]/.test(h));
  assert.deepEqual(bad, []);
  assert.match(read('index.html'), /\/ Hackathon 2027/);
  assert.doesNotMatch(builtCss(), /\.slash-heading\{[^}]*text-transform:\s*lowercase/);
});

test('/data: three real sub-headings in order, never in the label style, with on-this-page links', () => {
  const html = read('data/index.html');
  const h2s = [...html.matchAll(/<h2([^>]*)>(.*?)<\/h2>/gs)].map((m) => ({attrs: m[1], text: m[2].replace(/<[^>]+>/g, '').trim()}));
  assert.deepEqual(h2s.map((h) => h.text), ['Data types', 'Dataset map', 'Projects contributing genomes']);
  for (const h of h2s) assert.doesNotMatch(h.attrs, /class="label"/, `${h.text} still uses the label style`);
  for (const id of ['data-types', 'dataset-map', 'projects']) {
    assert.match(html, new RegExp(`<section[^>]*id="${id}"`), `missing section #${id}`);
  }
  const toc = html.slice(html.search(/<nav[^>]*aria-label="On this page"/));
  assert.ok(toc.length < html.length, 'missing on-this-page nav');
  for (const id of ['data-types', 'dataset-map', 'projects']) assert.match(toc.slice(0, 600), new RegExp(`href="#${id}"`));
});

test('apply: real sub-headings, roles on one line, Apply button before the criteria in reading order', () => {
  const html = read('index.html');
  const apply = html.slice(html.indexOf('id="apply"'), html.indexOf('id="organizers"'));
  const h3s = [...apply.matchAll(/<h3([^>]*)>(.*?)<\/h3>/gs)].map((m) => ({attrs: m[1], text: m[2].replace(/<[^>]+>/g, '').trim()}));
  assert.deepEqual(h3s.map((h) => h.text), ['Who should apply', 'Selection criteria', 'Before data access']);
  for (const h of h3s) assert.doesNotMatch(h.attrs, /class="label"/, `${h.text} still uses the label style`);
  assert.match(apply, /Researchers · Bioinformaticians · Clinicians · Data scientists/);
  const button = apply.indexOf('Apply now ↗');
  assert.ok(button > -1 && button < apply.indexOf('Who should apply'), 'Apply button should come before the details');
  assert.match(apply, /Thai nationality[^<]*<span class="[^"]*">Required<\/span>/);
});

test('custom domain: built for https://gh27.bat.or.th at the root, no /GH27/ paths left', () => {
  for (const page of PAGES) {
    const html = read(page);
    assert.doesNotMatch(html, /\/GH2[67]\//, `${page} still references a /GH2x/ base path`);
  }
  assert.match(read('index.html'), /<link[^>]*rel="canonical"[^>]*href="https:\/\/gh27\.bat\.or\.th\/"/);
});

test('motion: head script gates the hero intro with a 1.5s fail-safe, never baked into the server HTML', () => {
  const html = read('index.html');
  assert.match(html, /<script>[^<]*data-motion-intro[^<]*setTimeout\([^<]*1500[^<]*<\/script>/);
  assert.match(html, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(html, /<html[^>]*data-motion-intro/);
  assert.doesNotMatch(html, /style="[^"]*(?:opacity:\s*0|visibility:\s*hidden)/);
});

test('motion: GSAP is code-split out of the main bundle', () => {
  const dir = new URL('../build/assets/js/', import.meta.url);
  const files = readdirSync(dir);
  const main = files.filter((f) => /^main\.[\w]+\.js$/.test(f));
  assert.equal(main.length, 1);
  assert.ok(!readFileSync(new URL(main[0], dir), 'utf8').includes('ScrollTrigger'), 'ScrollTrigger leaked into main.js');
  assert.ok(files.some((f) => readFileSync(new URL(f, dir), 'utf8').includes('ScrollTrigger')), 'no chunk contains ScrollTrigger');
});

test('hero: new tagline, deadline next to Apply, in-page status link', () => {
  const html = read('index.html');
  const hero = html.slice(html.indexOf('<header'), html.indexOf('id="objectives"'));
  assert.match(hero, /50,000 Thai genomes\. Six days in Chiang Mai\. Real clinical questions\./);
  assert.doesNotMatch(html, /Unlocking/);
  assert.match(hero, /Apply by December 2026 · Results January 2027/);
  assert.match(hero, /href="#apply"[^>]*>Apply ↓</);
  for (const k of ['status', 'line', 'rest', 'barcode']) assert.match(hero, new RegExp(`data-intro="${k}"`));
});
