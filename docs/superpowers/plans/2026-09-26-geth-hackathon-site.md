# GeTH Hackathon 2027 Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a static, English-only, Swiss-style Docusaurus site that promotes GeTH Hackathon 2027 (7–12 Feb 2027, Chiang Mai) and drives applications through a Google Form.

**Architecture:**
- The site is a Docusaurus 3.10 app with only the pages plugin enabled.
- The home page is one custom React page made of section components. There are three secondary pages: `/data`, `/terms` and `/tre-guidelines`.
- All editable facts live in `src/data/event.ts` and `src/data/schedule.ts`.
- A Node script turns the project TSV into `src/data/wgs.json` (aggregates only) before every build.
- GitHub Actions builds, tests and deploys to GitHub Pages.

**Tech Stack:** Docusaurus 3.10.2, React 19, TypeScript ~6.0, CSS Modules, Node 22 (`node:test`), GitHub Actions (`actions/deploy-pages`).

**Spec:** `docs/superpowers/specs/2026-09-26-geth-hackathon-site-design.md`

## Global Constraints

- English only; no i18n, blog, docs plugin, search or analytics.
- Only aggregate data; never add individual-level genomic or participant data.
- Colours: `--accent #FF4A1C`, `--ink #0A0A0A`, `--paper #FFFFFF`, `--mute #9A9A9A`, `--rule #E6E6E6`. Light mode only (`disableSwitch: true`).
- Font: Inter Tight 400/500/600 from Google Fonts, falling back to `'Helvetica Neue', Helvetica, Arial, sans-serif`.
- Section headings are lowercase, start with a `/ ` prefix and end with a trailing `.` (rendered by `SlashHeading`).
- Accent colour is for display type and fills only. Small links are ink-coloured with an accent underline. Apply button: ink text on an accent fill.
- No horizontal page scroll at 360px width; the side gutter is 16px on phones.
- Section components contain no hard-coded dates, URLs or venue strings; they read `src/data/*`.
- `onBrokenLinks: 'throw'`, `trailingSlash: true`, `baseUrl` from `BASE_URL` (default `/GH26/`), `url` from `SITE_URL` (default `https://geth-hackathon.github.io`).
- `appendix/` is git-ignored; the build reads only `data/wgs_projects.tsv`.
- Every commit message ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

1. **Form URL not yet known (`formUrl: null`):** every Apply control renders as a disabled button reading "Applications open November 2026". There must never be an `href="null"`, an empty `href`, or a link to nowhere. Pinned by the `apply` tests in Task 3.
2. **Hosting under a sub-path (`/GH26/`):** every internal `href` and `src` in the built HTML starts with the base URL, so nothing 404s on GitHub Pages. Pinned by the `base url` test in Task 3.
3. **Hand-edited TSV** (CRLF line endings, BOM, trailing blank lines, stray spaces around fields): it must parse. A blank line *inside* the data must fail loudly with its line number. Pinned by the parser tests in Task 2.
4. **Awkward source rows** (an empty project name, a non-`YY-NNN` ID such as `709/2561 (EC3)`, `&` in group names): these render correctly on `/data`, with an empty name shown as `—`. Pinned by the `/data` tests in Task 7.
5. **Narrow phones (360px):** the giant wordmark, marquee, schedule grid and project table must not cause horizontal page scroll. Checked by the overflow script in Task 8, which fails on any overflow.

---

## File map

| File | Responsibility | Task |
|---|---|---|
| `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`, `.nvmrc` | Toolchain | 1 |
| `docusaurus.config.ts` | Site config, navbar, env-driven url/baseUrl | 1 (edited 3) |
| `static/img/favicon.svg` | Favicon | 1 |
| `data/wgs_projects.tsv` | Copy of the appendix TSV (source of data) | 2 |
| `scripts/build-data.mjs` | `parseWgsTsv`, `aggregate`, CLI writing `src/data/wgs.json` | 2 |
| `scripts/build-data.test.mjs` | Unit tests for the parser/aggregator | 2 |
| `src/data/wgs.json` | Generated aggregates (committed) | 2 |
| `src/css/custom.css` | Design tokens and shared global classes | 3 |
| `src/data/event.ts` | All editable event facts and copy | 3 |
| `src/components/ui/SlashHeading.tsx`, `TBA.tsx`, `ApplyButton.tsx` | UI primitives | 3 |
| `src/theme/Footer/index.tsx`, `styles.module.css` | Swizzled black footer | 3 |
| `src/components/sections/Apply.tsx` + css | Apply section | 3 |
| `scripts/site.test.mjs` | Tests against built HTML in `build/` | 3 (extended 4–7) |
| `src/lib/format.ts` | `fmt()` en-US number formatting | 4 |
| `src/data/groups.ts` | Group → colour | 4 |
| `src/components/ui/Marquee.tsx`, `GenomeBarcode.tsx` + css | Primitives | 4 |
| `src/components/sections/Hero.tsx`, `Objectives.tsx`, `Data.tsx` + css | Sections | 4 |
| `src/data/schedule.ts` | Six-day agenda | 5 |
| `src/components/sections/DatesVenue.tsx`, `ImportantDates.tsx`, `Schedule.tsx` + css | Sections | 5 |
| `src/components/sections/Organizers.tsx`, `Links.tsx` + css | Sections | 6 |
| `src/pages/index.tsx` | Home composition | 1 (rewritten 3–6) |
| `src/pages/data.tsx`, `data.module.css`, `terms.md`, `tre-guidelines.md` | Secondary pages | 7 |
| `.github/workflows/deploy.yml`, `README.md`, `CLAUDE.md` | Deploy and docs | 8 |

---

### Task 1: Scaffold the Docusaurus project

**Files:**
- Create: `package.json`, `tsconfig.json`, `.gitignore`, `.nvmrc`, `docusaurus.config.ts`, `static/img/favicon.svg`, `src/pages/index.tsx`
- Generated: `package-lock.json`

**Interfaces:**
- Produces: npm scripts `start`, `build`, `serve`, `clear`, `typecheck`, `test`, `test:site`. `docusaurus.config.ts` exports a `Config` whose `baseUrl` is `process.env.BASE_URL ?? '/GH26/'`.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "geth-hackathon-web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "docusaurus": "docusaurus",
    "start": "docusaurus start",
    "build": "docusaurus build",
    "serve": "docusaurus serve",
    "clear": "docusaurus clear",
    "typecheck": "tsc",
    "test": "node --test scripts/build-data.test.mjs",
    "test:site": "node --test scripts/site.test.mjs"
  },
  "dependencies": {
    "@docusaurus/core": "3.10.2",
    "@docusaurus/preset-classic": "3.10.2",
    "@mdx-js/react": "^3.0.0",
    "clsx": "^2.0.0",
    "prism-react-renderer": "^2.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@docusaurus/module-type-aliases": "3.10.2",
    "@docusaurus/tsconfig": "3.10.2",
    "@docusaurus/types": "3.10.2",
    "@types/react": "^19.0.0",
    "typescript": "~6.0.2"
  },
  "browserslist": {
    "production": [">0.5%", "not dead", "not op_mini all"],
    "development": ["last 3 chrome version", "last 3 firefox version", "last 5 safari version"]
  },
  "engines": {
    "node": ">=20.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`, `.gitignore`, `.nvmrc`**

`tsconfig.json`:
```json
{
  "extends": "@docusaurus/tsconfig",
  "compilerOptions": {
    "baseUrl": ".",
    "ignoreDeprecations": "6.0",
    "strict": true,
    "resolveJsonModule": true
  },
  "exclude": [".docusaurus", "build", "node_modules"]
}
```

`.gitignore`:
```
node_modules/
build/
.docusaurus/
.cache-loader/
.DS_Store
npm-debug.log*
appendix/
```

`.nvmrc`:
```
22
```

- [ ] **Step 3: Write `docusaurus.config.ts`**

```ts
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// Overridden in CI so forks and renamed repos deploy correctly.
const url = process.env.SITE_URL ?? 'https://geth-hackathon.github.io';
const baseUrl = process.env.BASE_URL ?? '/GH26/';

const config: Config = {
  title: 'GeTH Hackathon 2027',
  tagline: 'Unlocking 50,000 Thai genomes for national precision medicine.',
  favicon: 'img/favicon.svg',
  future: {v4: true},
  url,
  baseUrl,
  trailingSlash: true,
  organizationName: 'GeTH-Hackathon',
  projectName: 'GH26',
  onBrokenLinks: 'throw',
  i18n: {defaultLocale: 'en', locales: ['en']},
  presets: [
    [
      'classic',
      {
        docs: false,
        blog: false,
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    colorMode: {defaultMode: 'light', disableSwitch: true, respectPrefersColorScheme: false},
    navbar: {
      title: 'geth.',
      items: [
        {to: '/#objectives', label: 'Objectives', position: 'left'},
        {to: '/#data', label: 'Data', position: 'left'},
        {to: '/#dates', label: 'Dates & Venue', position: 'left'},
        {to: '/#schedule', label: 'Schedule', position: 'left'},
        {to: '/#organizers', label: 'Organizers', position: 'left'},
        {to: '/#apply', label: 'Apply', position: 'right', className: 'navbar-apply'},
      ],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
```

- [ ] **Step 4: Write `static/img/favicon.svg` and a temporary `src/pages/index.tsx`**

`static/img/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#FF4A1C"/><text x="32" y="44" font-family="Helvetica Neue, Arial, sans-serif" font-size="36" font-weight="700" text-anchor="middle" fill="#0A0A0A">g.</text></svg>
```

`src/pages/index.tsx` (replaced in Task 3):
```tsx
import Layout from '@theme/Layout';

export default function Home() {
  return (
    <Layout>
      <main>
        <h1>geth.</h1>
      </main>
    </Layout>
  );
}
```

- [ ] **Step 5: Install and verify the build**

Run: `npm install && npm run typecheck && npm run build`
Expected: install succeeds, `tsc` prints nothing, build ends with `[SUCCESS] Generated static files in "build".`, and `build/index.html` exists.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore .nvmrc docusaurus.config.ts static src
git commit -m "chore: scaffold Docusaurus site" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: WGS data pipeline (TSV → `wgs.json`)

**Files:**
- Create: `data/wgs_projects.tsv` (copied), `scripts/build-data.mjs`, `scripts/build-data.test.mjs`, `src/data/wgs.json` (generated)
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces:
  - `parseWgsTsv(text: string) → Project[]`, where `Project = {id, type, group, name: string, wgs: number}`.
  - `aggregate(projects) → {totals: {wgs, projects, groups}, byGroup: {group, wgs, projects}[] (desc by wgs), projects: Project[]}`.
  - `src/data/wgs.json` has exactly that `aggregate` shape. Later tasks import it as `import wgs from '@site/src/data/wgs.json'`.

- [ ] **Step 1: Copy the data file**

Run: `mkdir -p data && cp appendix/wgs_projects_and_volunteer_counts.txt data/wgs_projects.tsv`

- [ ] **Step 2: Write the failing tests** in `scripts/build-data.test.mjs`

```js
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
```

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `npm test`
Expected: FAIL with `Cannot find module '.../scripts/build-data.mjs'`.

- [ ] **Step 4: Implement `scripts/build-data.mjs`**

```js
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
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npm test`
Expected: `# pass 9`, `# fail 0`.

- [ ] **Step 6: Wire the script into the npm lifecycle**

In `package.json` `scripts`, add these three entries after `"docusaurus"`:
```json
    "data": "node scripts/build-data.mjs",
    "prestart": "npm run data",
    "prebuild": "npm run data",
```

Run: `mkdir -p src/data && npm run data`
Expected: `build-data: 118 projects, 51461 WGSs -> src/data/wgs.json`, and the file exists.

Run: `printf '\nx\n' >> data/wgs_projects.tsv && npm run data; echo "exit=$?"; git checkout -- data/wgs_projects.tsv 2>/dev/null || cp appendix/wgs_projects_and_volunteer_counts.txt data/wgs_projects.tsv`
Expected: `build-data: data/wgs_projects.tsv line 120: expected 5 tab-separated fields, got 1` and `exit=1`. The data file is then restored.

- [ ] **Step 7: Commit**

```bash
git add data scripts/build-data.mjs scripts/build-data.test.mjs src/data/wgs.json package.json
git commit -m "feat: build aggregated WGS data from project TSV" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Design system, event data, footer and the Apply section

**Files:**
- Create: `src/css/custom.css`, `src/data/event.ts`, `src/components/ui/SlashHeading.tsx`, `src/components/ui/TBA.tsx`, `src/components/ui/ApplyButton.tsx`, `src/theme/Footer/index.tsx`, `src/theme/Footer/styles.module.css`, `src/components/sections/Apply.tsx`, `src/components/sections/Apply.module.css`, `src/pages/terms.md`, `src/pages/tre-guidelines.md`, `scripts/site.test.mjs`
- Modify: `docusaurus.config.ts` (add `customCss`, fonts), `src/pages/index.tsx`

The two placeholder pages are created here because the Apply section and footer link to them and `onBrokenLinks: 'throw'`. Task 7 finalises and tests them.

**Interfaces:**
- Consumes: nothing from Task 2.
- Produces:
  - `event` (named export of `src/data/event.ts`), typed `EventInfo` (see code).
  - `SlashHeading({children, as?: 'h1' | 'h2'})`.
  - `TBA({title?: string})`.
  - `ApplyButton()`.
  - Global CSS classes `container-swiss`, `section`, `section--flush`, `label`, `btn`, `tba`, `slash-heading`, `sr-only`, `navbar-apply`.
  - Section ids: `apply`.

- [ ] **Step 1: Write the failing site tests** in `scripts/site.test.mjs`

```js
// Assertions against the static HTML produced by `npm run build`.
// Run with: npm run build && npm run test:site
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const BASE = process.env.BASE_URL ?? '/GH26/';
const read = (path) => readFileSync(new URL(`../build/${path}`, import.meta.url), 'utf8');
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
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm run build && npm run test:site`
Expected: FAIL. The `apply` and `footer` tests fail (no `id="apply"`, no sign-off).

- [ ] **Step 3: Add fonts and custom CSS to `docusaurus.config.ts`**

Replace the `presets` block and add `headTags` and `stylesheets` directly under `i18n`:
```ts
  headTags: [
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.googleapis.com'}},
    {tagName: 'link', attributes: {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous'}},
  ],
  stylesheets: ['https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&display=swap'],
  presets: [
    [
      'classic',
      {
        docs: false,
        blog: false,
        theme: {customCss: './src/css/custom.css'},
      } satisfies Preset.Options,
    ],
  ],
```

- [ ] **Step 4: Write `src/css/custom.css`**

```css
/* GeTH Swiss design tokens. Colours: accent / ink / paper / mute / rule only. */
:root {
  --accent: #ff4a1c;
  --ink: #0a0a0a;
  --paper: #ffffff;
  --mute: #9a9a9a;
  --rule: #e6e6e6;
  --radius: 24px;
  --gutter: 16px;
  --maxw: 1440px;
  --font: 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif;

  --ifm-font-family-base: var(--font);
  --ifm-heading-font-family: var(--font);
  --ifm-font-size-base: 17px;
  --ifm-line-height-base: 1.5;
  --ifm-background-color: var(--paper);
  --ifm-font-color-base: var(--ink);
  --ifm-heading-color: var(--ink);
  --ifm-link-color: var(--ink);
  --ifm-link-hover-color: var(--ink);
  --ifm-color-primary: #0a0a0a;
  --ifm-color-primary-dark: #000000;
  --ifm-color-primary-darker: #000000;
  --ifm-color-primary-darkest: #000000;
  --ifm-color-primary-light: #262626;
  --ifm-color-primary-lighter: #333333;
  --ifm-color-primary-lightest: #4d4d4d;
  --ifm-navbar-background-color: var(--paper);
  --ifm-navbar-shadow: none;
  --ifm-navbar-link-color: var(--ink);
  --ifm-navbar-link-hover-color: var(--ink);
  --ifm-footer-background-color: var(--ink);
}

@media (min-width: 997px) {
  :root { --gutter: 32px; }
}

body { background: var(--paper); color: var(--ink); }

a { text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 2px; text-underline-offset: 3px; }
a:hover { text-decoration-color: currentColor; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; border-radius: 2px; }

.container-swiss { width: 100%; max-width: var(--maxw); margin: 0 auto; padding: 0 var(--gutter); }
.section { padding: clamp(64px, 10vw, 144px) 0; border-top: 1px solid var(--rule); scroll-margin-top: 60px; }
.section--flush { border-top: 0; }

.label { font-size: 11px; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; line-height: 1.4; }

.slash-heading { font-size: clamp(2.5rem, 7vw, 5.5rem); font-weight: 500; letter-spacing: -0.05em; line-height: 0.95; margin: 0 0 clamp(32px, 5vw, 64px); text-transform: lowercase; }
.slash-heading .slash { color: var(--mute); font-weight: 400; }

.btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 24px; border: 0; border-radius: 999px; background: var(--accent); color: var(--ink); font: 600 15px/1.2 var(--font); text-decoration: none; cursor: pointer; }
.btn:hover { background: var(--ink); color: var(--paper); text-decoration: none; }
.btn[disabled] { background: var(--rule); color: var(--ink); cursor: not-allowed; }

.tba { display: inline-block; margin-left: 8px; padding: 1px 6px; border: 1px solid var(--accent); border-radius: 4px; font-size: 10px; font-weight: 600; letter-spacing: 0.06em; line-height: 1.5; text-transform: uppercase; vertical-align: middle; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

.navbar { border-bottom: 1px solid var(--rule); }
.navbar__title { font-size: 1.6rem; font-weight: 600; letter-spacing: -0.05em; color: var(--accent); }
.navbar__link { font-size: 12px; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; text-decoration: none; }
.navbar__link--active { color: var(--ink); }
.navbar-apply { background: var(--accent); border-radius: 999px; padding: 6px 16px; margin-left: 8px; }
.navbar-apply:hover { background: var(--ink); color: var(--paper); }
```

- [ ] **Step 5: Write `src/data/event.ts`**

```ts
// Single source of editable event facts. Resolve a TBA by editing this file only.

export type ImportantDate = {label: string; date: string; exact: boolean};
export type ExternalLink = {label: string; href: string; note: string};
export type PartnerRole = 'Organizer' | 'Supported by' | 'Data partner';
export type Partner = {role: PartnerRole; name: string; href: string | null; logo: string | null};
export type DataType = {name: string; description: string};

export type EventInfo = {
  name: string;
  tagline: string;
  statusLine: string;
  dateRange: string;
  dateNote: string;
  venue: {name: string | null; city: string; country: string; airport: string};
  formUrl: string | null;
  applyOpensLabel: string;
  seatsLabel: string;
  contactEmail: string | null;
  copyright: string;
  objectives: string[];
  audience: string[];
  criteria: string[];
  accessNote: string;
  dataNote: string;
  dataPortal: ExternalLink;
  dataTypes: DataType[];
  importantDates: ImportantDate[];
  partners: Partner[];
  links: ExternalLink[];
};

const dataPortal: ExternalLink = {
  label: 'data.genomicsthailand.com',
  href: 'https://data.genomicsthailand.com',
  note: 'Genomics Thailand data portal',
};

export const event: EventInfo = {
  name: 'GeTH Hackathon 2027',
  tagline: 'Unlocking 50,000 Thai genomes for national precision medicine.',
  statusLine: 'FEB 7–12 2027 \\ CHIANG MAI \\ 50K GENOMES',
  dateRange: '7–12 February 2027',
  dateNote: 'Sunday afternoon to Friday morning. Six days on site.',
  venue: {
    name: null,
    city: 'Chiang Mai',
    country: 'Thailand',
    airport: 'Chiang Mai International Airport (CNX)',
  },
  formUrl: null,
  applyOpensLabel: 'Applications open November 2026',
  seatsLabel: 'About 50 seats',
  contactEmail: null,
  copyright: '© 2026 Faculty of Medicine, Chiang Mai University',
  objectives: [
    "Build a research community able to analyse Thailand's first 50,000 genomes.",
    'Stress-test a secure, no-download Trusted Research Environment at population scale.',
    'Produce a national Genomic Landscape Report and a prototype genomic and population dashboard.',
  ],
  audience: ['Researchers', 'Bioinformaticians', 'Clinicians', 'Data scientists'],
  criteria: [
    'Technical skill in genomic or data analysis',
    'Experience with genomics data',
    'Affiliation with a non-profit organisation',
    'Ability to comply with data-security requirements',
  ],
  accessNote:
    'Accepted participants sign a non-disclosure agreement and a data-use agreement before they receive access to the Trusted Research Environment.',
  dataNote:
    "Pseudonymised. Analysed in place inside NSTDA's Secure Data Environment. No download; only aggregate results leave through an airlock review.",
  dataPortal,
  dataTypes: [
    {name: 'VCF', description: 'Variant Call Format files of small variants (SNVs and indels).'},
    {name: 'PLINK', description: 'Genotypes in PLINK binary format for population-genetic and association analysis.'},
    {name: 'HLA', description: 'HLA allele calls for immunogenetics and drug-hypersensitivity research.'},
    {name: 'CYP', description: 'Cytochrome P450 (CYP) star-allele calls for pharmacogenomics.'},
    {name: 'Structural variants', description: 'Larger genomic rearrangements such as deletions and duplications.'},
    {name: 'Demographics', description: 'Basic pseudonymised metadata such as age, sex, region and disease group.'},
  ],
  importantDates: [
    {label: 'Applications open', date: 'November 2026', exact: false},
    {label: 'Application deadline', date: 'December 2026', exact: false},
    {label: 'Participants announced', date: 'January 2027', exact: false},
    {label: 'Hackathon', date: '7–12 February 2027', exact: true},
  ],
  partners: [
    {role: 'Organizer', name: 'Faculty of Medicine, Chiang Mai University', href: 'https://www.med.cmu.ac.th', logo: null},
    {role: 'Supported by', name: 'Health Systems Research Institute (HSRI)', href: 'https://www.hsri.or.th', logo: null},
    {role: 'Data partner', name: 'National Science and Technology Development Agency (NSTDA)', href: 'https://www.nstda.or.th', logo: null},
    {role: 'Data partner', name: 'Genomics Thailand', href: 'https://data.genomicsthailand.com', logo: null},
  ],
  links: [
    dataPortal,
    {label: 'BioHackathon 2026', href: 'https://2026.biohackathon.org', note: 'The DBCLS event that inspired ours'},
  ],
};
```

- [ ] **Step 6: Write the UI primitives**

`src/components/ui/SlashHeading.tsx`:
```tsx
import type {ReactNode} from 'react';

type Props = {children: ReactNode; as?: 'h1' | 'h2'};

// Renders "/ heading." in the site's Swiss heading style.
export default function SlashHeading({children, as: Tag = 'h2'}: Props) {
  return (
    <Tag className="slash-heading">
      <span className="slash" aria-hidden="true">/ </span>
      {children}.
    </Tag>
  );
}
```

`src/components/ui/TBA.tsx`:
```tsx
export default function TBA({title = 'To be announced'}: {title?: string}) {
  return <span className="tba" title={title}>TBA</span>;
}
```

`src/components/ui/ApplyButton.tsx`:
```tsx
import {event} from '@site/src/data/event';

// A real link once event.formUrl is set; until then a disabled button.
export default function ApplyButton() {
  if (!event.formUrl) {
    return (
      <button type="button" className="btn" disabled>
        {event.applyOpensLabel}
      </button>
    );
  }
  return (
    <a className="btn" href={event.formUrl} target="_blank" rel="noopener noreferrer">
      Apply now ↗
    </a>
  );
}
```

- [ ] **Step 7: Write the Apply section**

`src/components/sections/Apply.tsx`:
```tsx
import Link from '@docusaurus/Link';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import ApplyButton from '@site/src/components/ui/ApplyButton';
import {event} from '@site/src/data/event';
import styles from './Apply.module.css';

export default function Apply() {
  return (
    <section id="apply" className="section">
      <div className="container-swiss">
        <SlashHeading>apply</SlashHeading>
        <div className={styles.grid}>
          <div>
            <p className={styles.lead}>{event.seatsLabel}. Individual applications, reviewed by the organizing committee.</p>
            <h3 className="label">Who should apply</h3>
            <ul className={styles.list}>
              {event.audience.map((a) => <li key={a}>{a}</li>)}
            </ul>
            <h3 className="label">Selection criteria</h3>
            <ul className={styles.list}>
              {event.criteria.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <h3 className="label">Before data access</h3>
            <p>{event.accessNote}</p>
          </div>
          <aside className={styles.cta}>
            <ApplyButton />
            <p className={styles.small}>
              {event.formUrl ? 'Applications are made through Google Forms.' : 'The Google Form will be linked here when applications open.'}
            </p>
            <ul className={styles.docs}>
              <li><Link to="/terms">Terms &amp; Conditions</Link> <span className="label">Coming soon</span></li>
              <li><Link to="/tre-guidelines">TRE guideline instructions</Link> <span className="label">Coming soon</span></li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
```

`src/components/sections/Apply.module.css`:
```css
.grid { display: grid; gap: 48px; }
.lead { font-size: clamp(1.5rem, 3vw, 2.5rem); font-weight: 500; letter-spacing: -0.03em; line-height: 1.1; max-width: 22ch; }
.list { list-style: none; padding: 0; margin: 8px 0 32px; border-top: 1px solid var(--rule); }
.list li { padding: 10px 0; border-bottom: 1px solid var(--rule); }
.cta { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; }
.small { font-size: 14px; color: #555; margin: 0; }
.docs { list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 8px; }
@media (min-width: 997px) {
  .grid { grid-template-columns: 7fr 5fr; }
  .cta { position: sticky; top: 96px; align-self: start; }
}
```

- [ ] **Step 8: Swizzle the footer**

`src/theme/Footer/index.tsx`:
```tsx
import Link from '@docusaurus/Link';
import TBA from '@site/src/components/ui/TBA';
import {event} from '@site/src/data/event';
import styles from './styles.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container-swiss">
        <div className={styles.cols}>
          <div>
            <p className={styles.name}>{event.name}</p>
            <p className="label">{event.statusLine}</p>
          </div>
          <div>
            <p className="label">Contact</p>
            <p>
              {event.contactEmail ? (
                <a href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>
              ) : (
                <>To be announced<TBA /></>
              )}
            </p>
          </div>
          <ul className={styles.links}>
            <li><Link to="/#apply">Apply</Link></li>
            <li><Link to="/data">The data</Link></li>
            <li><Link to="/terms">Terms &amp; Conditions</Link></li>
            <li><Link to="/tre-guidelines">TRE guidelines</Link></li>
            {event.links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label} ↗</a>
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.signoff}>see you in chiang mai.</p>
        <div className={styles.base}>
          <span className="label">{event.copyright}</span>
          <a className="label" href="#__docusaurus">/ back to top</a>
        </div>
      </div>
    </footer>
  );
}
```

`src/theme/Footer/styles.module.css`:
```css
.footer { background: var(--ink); color: var(--paper); padding: 64px 0 24px; }
.footer a { color: var(--paper); }
.name { font-size: 1.5rem; font-weight: 600; letter-spacing: -0.03em; margin: 0 0 8px; }
.cols { display: grid; gap: 32px; }
.links { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
.signoff { color: var(--accent); font-size: clamp(3rem, 12vw, 13rem); font-weight: 600; letter-spacing: -0.055em; line-height: 0.85; margin: 72px 0 32px; overflow-wrap: anywhere; }
.base { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; border-top: 1px solid #2a2a2a; padding-top: 16px; }
@media (min-width: 997px) {
  .cols { grid-template-columns: 2fr 1fr 1fr; }
}
```

- [ ] **Step 9: Placeholder pages and home composition**

`src/pages/terms.md`:
```md
---
title: Terms & Conditions
description: Terms and conditions for GeTH Hackathon 2027 participants.
---

<h1 className="slash-heading"><span className="slash" aria-hidden="true">/ </span>terms &amp; conditions.</h1>

Will be announced soon.

[Back to how to apply](/#apply)
```

`src/pages/tre-guidelines.md`:
```md
---
title: TRE guideline instructions
description: How to work inside the Trusted Research Environment during GeTH Hackathon 2027.
---

<h1 className="slash-heading"><span className="slash" aria-hidden="true">/ </span>tre guidelines.</h1>

Will be announced soon.

[Back to how to apply](/#apply)
```

`src/pages/index.tsx`:
```tsx
import Layout from '@theme/Layout';
import Apply from '@site/src/components/sections/Apply';

export default function Home() {
  return (
    <Layout description="GeTH Hackathon 2027: six days in Chiang Mai analysing 50,000 Thai genomes inside a Trusted Research Environment.">
      <main>
        <Apply />
      </main>
    </Layout>
  );
}
```

- [ ] **Step 10: Run the tests and confirm they pass**

Run: `npm run typecheck && npm run build && npm run test:site`
Expected: `tsc` is clean, the build succeeds, and `# pass 4`, `# fail 0`.

- [ ] **Step 11: Commit**

```bash
git add docusaurus.config.ts src scripts/site.test.mjs
git commit -m "feat: Swiss design system, event data, footer and apply section" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Hero, Objectives and Data sections

**Files:**
- Create: `src/lib/format.ts`, `src/data/groups.ts`, `src/components/ui/Marquee.tsx`, `src/components/ui/Marquee.module.css`, `src/components/ui/GenomeBarcode.tsx`, `src/components/sections/Hero.tsx`, `Hero.module.css`, `Objectives.tsx`, `Objectives.module.css`, `Data.tsx`, `Data.module.css`
- Modify: `src/pages/index.tsx`, `scripts/site.test.mjs`

**Interfaces:**
- Consumes: `event` and `SlashHeading`/`ApplyButton` (Task 3), `wgs.json` (Task 2).
- Produces:
  - `fmt(n: number): string` (always `en-US` grouping).
  - `groupColor(group: string, onDark?: boolean): string`.
  - `Marquee({items: string[]})`.
  - `GenomeBarcode({height?: number, onDark?: boolean, className?: string})`.
  - Section ids: `objectives`, `data`.

- [ ] **Step 1: Add failing tests** by appending to `scripts/site.test.mjs`

```js
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
  for (const g of ['Rare Diseases', 'NCD', 'Cancer', 'Pharmacogenomics', 'Infectious Diseases', 'Popgen', 'Non-Rare &amp; Non-Cancer']) {
    assert.ok(html.includes(g), `missing group ${g}`);
  }
  for (const t of ['VCF', 'PLINK', 'HLA', 'CYP', 'STRUCTURAL VARIANTS', 'DEMOGRAPHICS']) assert.ok(html.includes(t), `missing ${t}`);
  assert.match(html, /href="https:\/\/data\.genomicsthailand\.com"/);
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm run build && npm run test:site`
Expected: FAIL on the `hero`, `objectives` and `data` tests.

- [ ] **Step 3: Write helpers**

`src/lib/format.ts`:
```ts
// Fixed locale so SSR and every browser render "51,461" identically.
export const fmt = (n: number): string => n.toLocaleString('en-US');
```

`src/data/groups.ts`:
```ts
const INK = '#0a0a0a';
const PAPER = '#ffffff';

// One tint per disease group, drawn from accent / ink / mute.
export const groupColors: Record<string, string> = {
  'Rare Diseases': '#ff4a1c',
  NCD: INK,
  Cancer: '#9a9a9a',
  Pharmacogenomics: '#ff9a7f',
  'Infectious Diseases': '#4d4d4d',
  Popgen: '#ffc8b8',
  'Non-Rare & Non-Cancer': '#cfcfcf',
};

export function groupColor(group: string, onDark = false): string {
  const c = groupColors[group] ?? '#9a9a9a';
  return onDark && c === INK ? PAPER : c;
}
```

- [ ] **Step 4: Write `Marquee` and `GenomeBarcode`**

`src/components/ui/Marquee.tsx`:
```tsx
import styles from './Marquee.module.css';

// Two identical runs scroll by 50% for a seamless loop; the copy is hidden from screen readers.
export default function Marquee({items}: {items: string[]}) {
  const run = items.join('  ·  ') + '  ·  ';
  return (
    <div className={styles.marquee}>
      <div className={styles.track}>
        <span>{run}</span>
        <span aria-hidden="true">{run}</span>
      </div>
    </div>
  );
}
```

`src/components/ui/Marquee.module.css`:
```css
.marquee { overflow: hidden; border-block: 1px solid currentColor; padding: 14px 0; }
.track { display: flex; width: max-content; white-space: pre; font-size: clamp(1.25rem, 3vw, 2.5rem); font-weight: 500; letter-spacing: -0.02em; animation: scroll 40s linear infinite; }
@keyframes scroll { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) {
  .track { animation: none; width: auto; white-space: normal; }
  .track span[aria-hidden='true'] { display: none; }
}
```

`src/components/ui/GenomeBarcode.tsx`:
```tsx
import wgs from '@site/src/data/wgs.json';
import {groupColor} from '@site/src/data/groups';

type Props = {height?: number; onDark?: boolean; className?: string};

// One bar per project, width proportional to its WGS count, grouped and coloured by disease group.
export default function GenomeBarcode({height = 120, onDark = false, className}: Props) {
  const total = wgs.totals.wgs;
  const gap = total * 0.0015;
  const minWidth = total * 0.0006;
  const sorted = [...wgs.projects].sort((a, b) => a.group.localeCompare(b.group) || b.wgs - a.wgs);
  let x = 0;
  const bars = sorted.map((p, i) => {
    const w = Math.max(p.wgs, minWidth);
    const bar = {key: `${p.id}-${i}`, x, w, fill: groupColor(p.group, onDark)};
    x += w + gap;
    return bar;
  });
  const width = x - gap;
  return (
    <svg
      role="img"
      aria-label={`Barcode of ${wgs.totals.projects} Genomics Thailand projects; bar width is proportional to whole genomes per project.`}
      viewBox={`0 0 ${width} 100`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className={className}>
      {bars.map((b) => <rect key={b.key} x={b.x} y={0} width={b.w} height={100} fill={b.fill} />)}
    </svg>
  );
}
```

- [ ] **Step 5: Write the three sections**

`src/components/sections/Hero.tsx`:
```tsx
import ApplyButton from '@site/src/components/ui/ApplyButton';
import GenomeBarcode from '@site/src/components/ui/GenomeBarcode';
import {event} from '@site/src/data/event';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <header className={styles.hero}>
      <div className="container-swiss">
        <div className={styles.status}>
          <span className="label">{event.statusLine}</span>
          <a className="label" href="#apply">Apply ↗</a>
        </div>
        <p className={styles.kicker}>/ hackathon 2027</p>
        <h1 className={styles.title}>
          <span className={styles.wordmark} aria-hidden="true">geth.</span>
          <span className="sr-only">{event.name}</span>
        </h1>
        <div className={styles.row}>
          <p className={styles.tagline}>{event.tagline}</p>
          <div className={styles.ctas}>
            <ApplyButton />
            <a href="#data">See the data ↓</a>
          </div>
        </div>
        <GenomeBarcode className={styles.barcode} height={96} />
      </div>
    </header>
  );
}
```

`src/components/sections/Hero.module.css`:
```css
.hero { padding: 12px 0 clamp(48px, 8vw, 96px); }
.status { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 16px; }
.status a { text-decoration: none; }
.kicker { margin: clamp(40px, 8vw, 112px) 0 0; font-size: clamp(1rem, 2vw, 1.5rem); color: var(--mute); }
.title { margin: 0; line-height: 0.8; }
.wordmark { display: block; color: var(--accent); font-size: clamp(5rem, 36vw, 34rem); font-weight: 600; letter-spacing: -0.06em; line-height: 0.8; margin-left: -0.04em; }
.row { display: grid; gap: 24px; margin-top: clamp(24px, 4vw, 48px); }
.tagline { margin: 0; max-width: 18ch; font-size: clamp(1.5rem, 3.4vw, 3rem); font-weight: 500; letter-spacing: -0.03em; line-height: 1.05; }
.ctas { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 24px; }
.barcode { display: block; margin-top: clamp(32px, 6vw, 72px); }
@media (min-width: 997px) {
  .row { grid-template-columns: 7fr 5fr; align-items: end; }
  .ctas { justify-content: flex-end; }
}
```

`src/components/sections/Objectives.tsx`:
```tsx
import SlashHeading from '@site/src/components/ui/SlashHeading';
import {event} from '@site/src/data/event';
import styles from './Objectives.module.css';

export default function Objectives() {
  return (
    <section id="objectives" className="section">
      <div className="container-swiss">
        <SlashHeading>objectives</SlashHeading>
        <ol className={styles.list}>
          {event.objectives.map((text, i) => (
            <li key={text} className={styles.item}>
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.text}>{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

`src/components/sections/Objectives.module.css`:
```css
.list { list-style: none; padding: 0; margin: 0; border-top: 1px solid var(--rule); }
.item { display: grid; grid-template-columns: 3rem 1fr; gap: 16px; padding: 24px 0; border-bottom: 1px solid var(--rule); }
.num { color: var(--mute); font-size: 1.25rem; font-weight: 500; }
.text { font-size: clamp(1.25rem, 2.6vw, 2.25rem); font-weight: 500; letter-spacing: -0.03em; line-height: 1.15; max-width: 32ch; }
@media (min-width: 997px) {
  .item { grid-template-columns: 6rem 1fr; }
}
```

`src/components/sections/Data.tsx`:
```tsx
import Link from '@docusaurus/Link';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import Marquee from '@site/src/components/ui/Marquee';
import GenomeBarcode from '@site/src/components/ui/GenomeBarcode';
import wgs from '@site/src/data/wgs.json';
import {event} from '@site/src/data/event';
import {fmt} from '@site/src/lib/format';
import styles from './Data.module.css';

export default function Data() {
  const max = wgs.byGroup[0]?.wgs ?? 1;
  return (
    <section id="data" className="section section--flush">
      <div className="container-swiss">
        <div className={styles.panel}>
          <span className={styles.vertical} aria-hidden="true">genomics thailand</span>
          <SlashHeading>the data</SlashHeading>
          <div className={styles.stats}>
            <p className={styles.big}>({fmt(wgs.totals.wgs)})</p>
            <dl className={styles.counters}>
              <div><dt className="label">Whole genomes</dt><dd>{fmt(wgs.totals.wgs)}</dd></div>
              <div><dt className="label">Projects</dt><dd>{fmt(wgs.totals.projects)}</dd></div>
              <div><dt className="label">Disease groups</dt><dd>{fmt(wgs.totals.groups)}</dd></div>
            </dl>
          </div>
          <ol className={styles.chart} aria-label="Whole genomes by disease group">
            {wgs.byGroup.map((g) => (
              <li key={g.group} className={styles.bar}>
                <span className={styles.barLabel}>{g.group}</span>
                <span className={styles.barTrack}>
                  <span className={styles.barFill} style={{width: `${(g.wgs / max) * 100}%`}} />
                </span>
                <span className={styles.barValue}>{fmt(g.wgs)}</span>
              </li>
            ))}
          </ol>
          <Marquee items={event.dataTypes.map((t) => t.name.toUpperCase())} />
          <p className={styles.note}>{event.dataNote}</p>
          <p className={styles.links}>
            <Link to="/data">Explore all {wgs.totals.projects} projects →</Link>
            <a href={event.dataPortal.href} target="_blank" rel="noopener noreferrer">{event.dataPortal.label} ↗</a>
          </p>
          <GenomeBarcode onDark height={56} className={styles.barcode} />
        </div>
      </div>
    </section>
  );
}
```

`src/components/sections/Data.module.css`:
```css
.panel { position: relative; background: var(--ink); color: var(--paper); border-radius: var(--radius); padding: clamp(32px, 6vw, 80px) clamp(20px, 5vw, 72px); overflow: hidden; }
.panel h2 { color: var(--paper); }
.panel a { color: var(--paper); }
.vertical { position: absolute; top: 32px; right: 12px; writing-mode: vertical-rl; font-size: 12px; letter-spacing: 0.04em; color: var(--mute); }
.stats { display: grid; gap: 24px; margin-bottom: 48px; }
.big { margin: 0; color: #5a5a5a; font-size: clamp(3.5rem, 13vw, 11rem); font-weight: 500; letter-spacing: -0.05em; line-height: 0.9; }
.counters { display: flex; flex-wrap: wrap; gap: 24px 48px; margin: 0; }
.counters dt { color: var(--mute); }
.counters dd { margin: 0; font-size: 2rem; font-weight: 500; letter-spacing: -0.03em; }
.chart { list-style: none; padding: 0; margin: 0 0 48px; display: grid; gap: 10px; }
.bar { display: grid; grid-template-columns: minmax(0, 1fr) 4.5rem; grid-template-areas: 'label value' 'track track'; gap: 4px 12px; align-items: center; }
.barLabel { grid-area: label; font-size: 14px; }
.barValue { grid-area: value; text-align: right; font-variant-numeric: tabular-nums; font-size: 14px; }
.barTrack { grid-area: track; height: 10px; background: #1f1f1f; border-radius: 999px; overflow: hidden; }
.barFill { display: block; height: 100%; background: var(--accent); border-radius: 999px; }
.note { max-width: 60ch; margin: 32px 0 16px; color: #d0d0d0; }
.links { display: flex; flex-wrap: wrap; gap: 12px 32px; margin: 0 0 32px; }
.barcode { display: block; }
@media (min-width: 997px) {
  .stats { grid-template-columns: 1fr auto; align-items: end; }
  .bar { grid-template-columns: 14rem minmax(0, 1fr) 5rem; grid-template-areas: 'label track value'; }
}
```

- [ ] **Step 6: Compose the home page**

`src/pages/index.tsx`:
```tsx
import Layout from '@theme/Layout';
import Hero from '@site/src/components/sections/Hero';
import Objectives from '@site/src/components/sections/Objectives';
import Data from '@site/src/components/sections/Data';
import Apply from '@site/src/components/sections/Apply';

export default function Home() {
  return (
    <Layout description="GeTH Hackathon 2027: six days in Chiang Mai analysing 50,000 Thai genomes inside a Trusted Research Environment.">
      <main>
        <Hero />
        <Objectives />
        <Data />
        <Apply />
      </main>
    </Layout>
  );
}
```

- [ ] **Step 7: Run the tests and confirm they pass**

Run: `npm run typecheck && npm run build && npm run test:site`
Expected: `# pass 7`, `# fail 0`.

- [ ] **Step 8: Commit**

```bash
git add src scripts/site.test.mjs
git commit -m "feat: hero, objectives and data sections with genome barcode" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Dates & Venue, Important Dates and Schedule

**Files:**
- Create: `src/data/schedule.ts`, `src/components/sections/DatesVenue.tsx`, `DatesVenue.module.css`, `ImportantDates.tsx`, `ImportantDates.module.css`, `Schedule.tsx`, `Schedule.module.css`
- Modify: `src/pages/index.tsx`, `scripts/site.test.mjs`

**Interfaces:**
- Consumes: `event`, `SlashHeading`, `TBA` (Task 3).
- Produces:
  - `schedule: ScheduleDay[]` and `hackDaysSummary: {dayLabel: string; dateLabel: string}`.
  - Types: `ScheduleItem = {time: string | null; title: string}` and `ScheduleDay = {dayLabel: string; dateLabel: string; kind: 'opening' | 'hack' | 'wrapup'; title: string; items: ScheduleItem[]}`.
  - Section ids: `dates`, `important-dates`, `schedule`.

- [ ] **Step 1: Add failing tests** by appending to `scripts/site.test.mjs`

```js
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
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm run build && npm run test:site`
Expected: FAIL on the three new tests.

- [ ] **Step 3: Write `src/data/schedule.ts`**

```ts
// Only the times supplied by the organizers are shown; other items appear in order without a time.
export type ScheduleItem = {time: string | null; title: string};
export type ScheduleDay = {
  dayLabel: string;
  dateLabel: string;
  kind: 'opening' | 'hack' | 'wrapup';
  title: string;
  items: ScheduleItem[];
};

const hackDay = (dayLabel: string, dateLabel: string): ScheduleDay => ({
  dayLabel,
  dateLabel,
  kind: 'hack',
  title: 'Hackathon day',
  items: [
    {time: '07:00–09:00', title: 'Breakfast'},
    {time: null, title: 'Hacking'},
    {time: '12:00', title: 'Lunch'},
    {time: null, title: 'Hacking'},
    {time: null, title: 'Dinner'},
  ],
});

export const schedule: ScheduleDay[] = [
  {
    dayLabel: '1',
    dateLabel: 'Sun 7 Feb',
    kind: 'opening',
    title: 'Opening workshop',
    items: [
      {time: '12:30', title: 'Registration opens'},
      {time: '13:00', title: 'Opening'},
      {time: null, title: 'Self-introduction of participants'},
      {time: null, title: 'TRE tutorial'},
      {time: null, title: 'Topic proposals & team grouping'},
      {time: null, title: 'Dinner'},
    ],
  },
  hackDay('2', 'Mon 8 Feb'),
  hackDay('3', 'Tue 9 Feb'),
  hackDay('4', 'Wed 10 Feb'),
  hackDay('5', 'Thu 11 Feb'),
  {
    dayLabel: '6',
    dateLabel: 'Fri 12 Feb',
    kind: 'wrapup',
    title: 'Wrap-up',
    items: [
      {time: '07:00–09:00', title: 'Breakfast'},
      {time: null, title: 'Wrap-up session'},
      {time: null, title: 'Depart from venue to CNX airport'},
    ],
  },
];

export const hackDaysSummary = {dayLabel: '2–5', dateLabel: 'Mon 8 – Thu 11 Feb'};
```

- [ ] **Step 4: Write the three sections**

`src/components/sections/DatesVenue.tsx`:
```tsx
import SlashHeading from '@site/src/components/ui/SlashHeading';
import TBA from '@site/src/components/ui/TBA';
import {event} from '@site/src/data/event';
import styles from './DatesVenue.module.css';

export default function DatesVenue() {
  const {venue} = event;
  return (
    <section id="dates" className="section">
      <div className="container-swiss">
        <SlashHeading>{'dates & venue'}</SlashHeading>
        <div className={styles.grid}>
          <div>
            <p className="label">When</p>
            <p className={styles.big}>{event.dateRange}</p>
            <p>{event.dateNote}</p>
          </div>
          <div>
            <p className="label">Where</p>
            <p className={styles.big}>{venue.city}, {venue.country}</p>
            <p>{venue.name ?? <>Hotel to be announced<TBA /></>}</p>
            <p>Nearest airport: {venue.airport}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

`src/components/sections/DatesVenue.module.css`:
```css
.grid { display: grid; gap: 48px; border-top: 1px solid var(--rule); padding-top: 24px; }
.big { margin: 8px 0 16px; font-size: clamp(2rem, 5vw, 4rem); font-weight: 500; letter-spacing: -0.04em; line-height: 1; }
@media (min-width: 997px) {
  .grid { grid-template-columns: 1fr 1fr; }
}
```

`src/components/sections/ImportantDates.tsx`:
```tsx
import SlashHeading from '@site/src/components/ui/SlashHeading';
import TBA from '@site/src/components/ui/TBA';
import {event} from '@site/src/data/event';
import styles from './ImportantDates.module.css';

export default function ImportantDates() {
  return (
    <section id="important-dates" className="section">
      <div className="container-swiss">
        <SlashHeading>important dates</SlashHeading>
        <ol className={styles.list}>
          {event.importantDates.map((d) => (
            <li key={d.label} className={styles.row}>
              <span className={styles.what}>{d.label}</span>
              <span className={styles.when}>
                {d.date}
                {!d.exact && <TBA title="Exact day to be announced" />}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

`src/components/sections/ImportantDates.module.css`:
```css
.list { list-style: none; padding: 0; margin: 0; border-top: 1px solid var(--rule); }
.row { display: grid; gap: 4px; padding: 20px 0; border-bottom: 1px solid var(--rule); }
.what { color: #555; }
.when { font-size: clamp(1.5rem, 3.4vw, 2.75rem); font-weight: 500; letter-spacing: -0.03em; line-height: 1.1; }
@media (min-width: 997px) {
  .row { grid-template-columns: 1fr 2fr; align-items: baseline; }
}
```

`src/components/sections/Schedule.tsx`:
```tsx
import clsx from 'clsx';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import {schedule, hackDaysSummary, type ScheduleDay} from '@site/src/data/schedule';
import styles from './Schedule.module.css';

function DayCard({day, className}: {day: ScheduleDay; className?: string}) {
  return (
    <article className={clsx(styles.card, day.kind !== 'hack' && styles.accent, className)}>
      <header className={styles.head}>
        <span className="label">Day {day.dayLabel}</span>
        <span className="label">{day.dateLabel}</span>
      </header>
      <h3 className={styles.title}>{day.title}</h3>
      <ol className={styles.items}>
        {day.items.map((it, i) => (
          <li key={i} className={styles.item}>
            <span className={styles.time}>{it.time ?? ''}</span>
            <span>{it.title}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

export default function Schedule() {
  const opening = schedule.filter((d) => d.kind === 'opening');
  const hack = schedule.filter((d) => d.kind === 'hack');
  const wrapup = schedule.filter((d) => d.kind === 'wrapup');
  // Phones see the four identical hacking days as one card; wider screens see each day.
  const combined: ScheduleDay | undefined = hack[0] && {...hack[0], ...hackDaysSummary, title: `Hackathon days ×${hack.length}`};
  return (
    <section id="schedule" className="section">
      <div className="container-swiss">
        <SlashHeading>schedule</SlashHeading>
        <div className={styles.grid}>
          {opening.map((d) => <DayCard key={d.dayLabel} day={d} />)}
          {combined && <DayCard day={combined} className={styles.mobileOnly} />}
          {hack.map((d) => <DayCard key={d.dayLabel} day={d} className={styles.desktopOnly} />)}
          {wrapup.map((d) => <DayCard key={d.dayLabel} day={d} />)}
        </div>
      </div>
    </section>
  );
}
```

`src/components/sections/Schedule.module.css`:
```css
.grid { display: grid; gap: 16px; }
.card { min-width: 0; border: 1px solid var(--rule); border-radius: var(--radius); padding: 24px; }
.accent { border-color: var(--ink); }
.head { display: flex; justify-content: space-between; gap: 8px; color: #555; }
.title { margin: 16px 0; font-size: 1.75rem; font-weight: 500; letter-spacing: -0.03em; }
.items { list-style: none; padding: 0; margin: 0; }
.item { display: grid; grid-template-columns: 6.5rem minmax(0, 1fr); gap: 8px; padding: 8px 0; border-top: 1px solid var(--rule); font-size: 15px; }
.time { font-variant-numeric: tabular-nums; color: #555; }
.desktopOnly { display: none; }
@media (min-width: 997px) {
  .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .mobileOnly { display: none; }
  .desktopOnly { display: block; }
}
```

- [ ] **Step 5: Update the home page**

`src/pages/index.tsx`:
```tsx
import Layout from '@theme/Layout';
import Hero from '@site/src/components/sections/Hero';
import Objectives from '@site/src/components/sections/Objectives';
import Data from '@site/src/components/sections/Data';
import DatesVenue from '@site/src/components/sections/DatesVenue';
import ImportantDates from '@site/src/components/sections/ImportantDates';
import Schedule from '@site/src/components/sections/Schedule';
import Apply from '@site/src/components/sections/Apply';

export default function Home() {
  return (
    <Layout description="GeTH Hackathon 2027: six days in Chiang Mai analysing 50,000 Thai genomes inside a Trusted Research Environment.">
      <main>
        <Hero />
        <Objectives />
        <Data />
        <DatesVenue />
        <ImportantDates />
        <Schedule />
        <Apply />
      </main>
    </Layout>
  );
}
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npm run typecheck && npm run build && npm run test:site`
Expected: `# pass 10`, `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add src scripts/site.test.mjs
git commit -m "feat: dates, important dates and schedule sections" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Organizers and Links; final home order

**Files:**
- Create: `src/components/sections/Organizers.tsx`, `Organizers.module.css`, `Links.tsx`, `Links.module.css`
- Modify: `src/pages/index.tsx`, `scripts/site.test.mjs`

**Interfaces:**
- Consumes: `event.partners`, `event.links`, `SlashHeading`.
- Produces: section ids `organizers` and `links`. Final section order: hero → objectives → data → dates → important-dates → schedule → apply → organizers → links.

- [ ] **Step 1: Add failing tests** by appending to `scripts/site.test.mjs`

```js
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
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm run build && npm run test:site`
Expected: FAIL on the three new tests.

- [ ] **Step 3: Write the sections**

`src/components/sections/Organizers.tsx`:
```tsx
import useBaseUrl from '@docusaurus/useBaseUrl';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import {event, type Partner, type PartnerRole} from '@site/src/data/event';
import styles from './Organizers.module.css';

const ROLES: {role: PartnerRole; plural: string}[] = [
  {role: 'Organizer', plural: 'Organizers'},
  {role: 'Supported by', plural: 'Supported by'},
  {role: 'Data partner', plural: 'Data partners'},
];

function PartnerMark({partner}: {partner: Partner}) {
  const logoUrl = useBaseUrl(partner.logo ?? '/');
  const mark = partner.logo ? (
    <img src={logoUrl} alt={partner.name} className={styles.logo} />
  ) : (
    <span className={styles.name}>{partner.name}</span>
  );
  if (!partner.href) return mark;
  return (
    <a href={partner.href} target="_blank" rel="noopener noreferrer" className={styles.link}>{mark}</a>
  );
}

export default function Organizers() {
  return (
    <section id="organizers" className="section">
      <div className="container-swiss">
        <SlashHeading>organizers</SlashHeading>
        {ROLES.map(({role, plural}) => {
          const partners = event.partners.filter((p) => p.role === role);
          if (partners.length === 0) return null;
          return (
            <div key={role} className={styles.row}>
              <p className="label">{partners.length > 1 ? plural : role}</p>
              <ul className={styles.list}>
                {partners.map((p) => <li key={p.name}><PartnerMark partner={p} /></li>)}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

`src/components/sections/Organizers.module.css`:
```css
.row { display: grid; gap: 12px; padding: 24px 0; border-top: 1px solid var(--rule); }
.list { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 16px 48px; }
.name { font-size: clamp(1.25rem, 2.6vw, 2rem); font-weight: 500; letter-spacing: -0.03em; line-height: 1.15; }
.link { text-decoration: none; }
.link:hover .name { text-decoration: underline; text-decoration-color: var(--accent); }
.logo { height: 48px; width: auto; }
@media (min-width: 997px) {
  .row { grid-template-columns: 1fr 3fr; align-items: baseline; }
}
```

`src/components/sections/Links.tsx`:
```tsx
import Link from '@docusaurus/Link';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import {event} from '@site/src/data/event';
import styles from './Links.module.css';

export default function Links() {
  return (
    <section id="links" className="section">
      <div className="container-swiss">
        <SlashHeading>links</SlashHeading>
        <ul className={styles.list}>
          {event.links.map((l) => (
            <li key={l.href} className={styles.row}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className={styles.link}>{l.label} ↗</a>
              <span className={styles.note}>{l.note}</span>
            </li>
          ))}
          <li className={styles.row}>
            <Link to="/terms" className={styles.link}>Terms &amp; Conditions</Link>
            <span className={styles.note}>Will be announced soon</span>
          </li>
          <li className={styles.row}>
            <Link to="/tre-guidelines" className={styles.link}>TRE guideline instructions</Link>
            <span className={styles.note}>Will be announced soon</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
```

`src/components/sections/Links.module.css`:
```css
.list { list-style: none; padding: 0; margin: 0; border-top: 1px solid var(--rule); }
.row { display: grid; gap: 4px; padding: 20px 0; border-bottom: 1px solid var(--rule); }
.link { font-size: clamp(1.5rem, 3.4vw, 2.75rem); font-weight: 500; letter-spacing: -0.03em; line-height: 1.1; overflow-wrap: anywhere; }
.note { color: #555; }
@media (min-width: 997px) {
  .row { grid-template-columns: 2fr 1fr; align-items: baseline; }
}
```

- [ ] **Step 4: Final home page**

`src/pages/index.tsx`:
```tsx
import Layout from '@theme/Layout';
import Hero from '@site/src/components/sections/Hero';
import Objectives from '@site/src/components/sections/Objectives';
import Data from '@site/src/components/sections/Data';
import DatesVenue from '@site/src/components/sections/DatesVenue';
import ImportantDates from '@site/src/components/sections/ImportantDates';
import Schedule from '@site/src/components/sections/Schedule';
import Apply from '@site/src/components/sections/Apply';
import Organizers from '@site/src/components/sections/Organizers';
import Links from '@site/src/components/sections/Links';

export default function Home() {
  return (
    <Layout description="GeTH Hackathon 2027: six days in Chiang Mai analysing 50,000 Thai genomes inside a Trusted Research Environment.">
      <main>
        <Hero />
        <Objectives />
        <Data />
        <DatesVenue />
        <ImportantDates />
        <Schedule />
        <Apply />
        <Organizers />
        <Links />
      </main>
    </Layout>
  );
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npm run typecheck && npm run build && npm run test:site`
Expected: `# pass 13`, `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add src scripts/site.test.mjs
git commit -m "feat: organizers and links sections" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: `/data` page and placeholder pages

**Files:**
- Create: `src/pages/data.tsx`, `src/pages/data.module.css`
- Modify: `scripts/site.test.mjs` (extend `PAGES`, add tests)

**Interfaces:**
- Consumes: `wgs.json`, `event.dataTypes`, `event.dataNote`, `fmt`, `SlashHeading`.
- Produces: routes `/data/`, `/terms/` and `/tre-guidelines/`. Each table row is `<tr data-row="project">`.

- [ ] **Step 1: Add failing tests** in `scripts/site.test.mjs`

Change the `PAGES` line near the top to:
```js
const PAGES = ['index.html', 'data/index.html', 'terms/index.html', 'tre-guidelines/index.html'];
```

Append:
```js
test('/data: one row per project, awkward rows rendered faithfully', () => {
  const html = read('data/index.html');
  assert.equal((html.match(/data-row="project"/g) ?? []).length, 118);
  assert.match(html, /<td>00-001<\/td><td>Service<\/td><td>Rare Diseases<\/td><td>—<\/td>/);
  assert.ok(html.includes('709/2561 (EC3)'));
  assert.ok(html.includes('Non-Rare &amp; Non-Cancer'));
  assert.ok(html.includes('51,461'));
  for (const t of ['VCF', 'PLINK', 'HLA', 'CYP', 'Structural variants', 'Demographics']) assert.ok(html.includes(t), t);
});

test('/data: default sort is WGS descending', () => {
  const html = read('data/index.html');
  const first = html.indexOf('<td>00-001</td>');
  const second = html.indexOf('<td>64-128</td>');
  assert.ok(first > -1 && second > first, 'largest project (13,017) should be listed before 64-128 (3,700)');
  assert.match(html, /aria-sort="descending"/);
});

test('placeholder pages say "Will be announced soon" and link back to apply', () => {
  for (const page of ['terms/index.html', 'tre-guidelines/index.html']) {
    const html = read(page);
    assert.match(html, /Will be announced soon\./, page);
    assert.match(html, /href="[^"]*#apply"/, page);
  }
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm run build && npm run test:site`
Expected: FAIL with `ENOENT ... build/data/index.html`.

- [ ] **Step 3: Write `src/pages/data.tsx`**

```tsx
import {useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import wgs from '@site/src/data/wgs.json';
import {event} from '@site/src/data/event';
import {fmt} from '@site/src/lib/format';
import styles from './data.module.css';

type Key = 'id' | 'type' | 'group' | 'name' | 'wgs';
type Sort = {key: Key; dir: 1 | -1};

const COLUMNS: {key: Key; label: string; numeric?: boolean}[] = [
  {key: 'id', label: 'Project ID'},
  {key: 'type', label: 'Type'},
  {key: 'group', label: 'Group'},
  {key: 'name', label: 'Project name'},
  {key: 'wgs', label: 'WGSs', numeric: true},
];

export default function DataPage() {
  const [sort, setSort] = useState<Sort>({key: 'wgs', dir: -1});
  const rows = [...wgs.projects].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    const c = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return c * sort.dir || a.id.localeCompare(b.id);
  });
  const toggle = (key: Key) =>
    setSort((s) => (s.key === key ? {key, dir: s.dir === 1 ? -1 : 1} : {key, dir: key === 'wgs' ? -1 : 1}));

  return (
    <Layout title="The data" description="The 50,000 Thai whole genomes available at GeTH Hackathon 2027, by project and disease group.">
      <main className="container-swiss section section--flush">
        <SlashHeading as="h1">the data</SlashHeading>
        <dl className={styles.stats}>
          <div><dt className="label">Whole genomes</dt><dd>{fmt(wgs.totals.wgs)}</dd></div>
          <div><dt className="label">Projects</dt><dd>{fmt(wgs.totals.projects)}</dd></div>
          <div><dt className="label">Disease groups</dt><dd>{fmt(wgs.totals.groups)}</dd></div>
        </dl>
        <p className={styles.note}>{event.dataNote}</p>

        <h2 className="label">Data types</h2>
        <dl className={styles.types}>
          {event.dataTypes.map((t) => (
            <div key={t.name} className={styles.type}>
              <dt>{t.name}</dt>
              <dd>{t.description}</dd>
            </div>
          ))}
        </dl>

        <h2 className="label">Projects contributing genomes</h2>
        <p className={styles.caption}>Values as recorded by Genomics Thailand. Select a column heading to sort.</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={c.numeric ? styles.num : undefined}
                    aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" className={styles.sortBtn} onClick={() => toggle(c.key)}>
                      {c.label}
                      {sort.key === c.key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={`${p.id}-${i}`} data-row="project">
                  <td>{p.id}</td>
                  <td>{p.type}</td>
                  <td>{p.group}</td>
                  <td>{p.name || '—'}</td>
                  <td className={styles.num}>{fmt(p.wgs)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={4}>Total</th>
                <td className={styles.num}>{fmt(wgs.totals.wgs)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p><Link to="/#apply">How to apply →</Link></p>
      </main>
    </Layout>
  );
}
```

`src/pages/data.module.css`:
```css
.stats { display: flex; flex-wrap: wrap; gap: 24px 64px; margin: 0 0 24px; }
.stats dd { margin: 0; font-size: clamp(2rem, 5vw, 4rem); font-weight: 500; letter-spacing: -0.04em; line-height: 1; }
.note { max-width: 60ch; margin-bottom: 64px; }
.types { display: grid; gap: 0; margin: 12px 0 64px; border-top: 1px solid var(--rule); }
.type { display: grid; gap: 4px; padding: 16px 0; border-bottom: 1px solid var(--rule); }
.type dt { font-size: 1.25rem; font-weight: 600; letter-spacing: -0.02em; }
.type dd { margin: 0; }
.caption { color: #555; font-size: 14px; }
.tableWrap { overflow-x: auto; margin: 0 0 48px; border-top: 1px solid var(--ink); }
.table { display: table; width: 100%; border-collapse: collapse; font-size: 14px; }
.table th, .table td { border: 0; border-bottom: 1px solid var(--rule); padding: 10px 12px 10px 0; text-align: left; vertical-align: top; }
.table tr { background: transparent; border: 0; }
.table tfoot th, .table tfoot td { border-bottom: 0; border-top: 1px solid var(--ink); font-weight: 600; }
.num { text-align: right !important; font-variant-numeric: tabular-nums; white-space: nowrap; }
.sortBtn { all: unset; cursor: pointer; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
.sortBtn:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
@media (min-width: 997px) {
  .types { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 48px; }
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm run typecheck && npm run build && npm run test:site`
Expected: `# pass 16`, `# fail 0`. The base-url and dead-link tests now also cover all four pages.

- [ ] **Step 5: Commit**

```bash
git add src/pages scripts/site.test.mjs
git commit -m "feat: data page with sortable project table" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Deploy workflow, docs and viewport verification

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md`, `CLAUDE.md`
- Scratch (not committed): `$SCRATCH/overflow/check.mjs`

**Interfaces:**
- Consumes: the npm scripts from Tasks 1–3 and 7.
- Produces: GitHub Pages deployment on push to `main`.

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: Build and deploy

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      SITE_URL: https://${{ github.repository_owner }}.github.io
      BASE_URL: /${{ github.event.repository.name }}/
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run typecheck
      - run: npm run build
      - run: npm run test:site
      - uses: actions/upload-pages-artifact@v3
        with:
          path: build

  deploy:
    if: github.event_name != 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Rewrite `README.md`**

````markdown
# GH26: GeTH Hackathon 2027 website

Static site for **GeTH Hackathon 2027** (Genomics Thailand Hackathon, 7–12 February 2027, Chiang Mai). It is built with [Docusaurus](https://docusaurus.io) and deployed to GitHub Pages.

## Develop

```bash
npm install
npm start            # dev server at http://localhost:3000/GH26/
npm test             # data-pipeline unit tests
npm run build        # regenerates src/data/wgs.json, then builds to build/
npm run test:site    # checks the built HTML (run after build)
npm run typecheck
```

## Updating content

- **Dates, venue, Google Form URL, contact, partners, links:** edit `src/data/event.ts` only. Setting `formUrl` turns the disabled Apply button into a live link. A `null` value or `exact: false` shows a TBA tag.
- **Schedule:** `src/data/schedule.ts`.
- **Genome counts:** replace `data/wgs_projects.tsv` (tab-separated, header `Project ID	Type	Group	Project Name	WGSs`). The build fails with a line number if a row is malformed.
- **Logos:** put the files in `static/img/logos/` and set `logo: '/img/logos/<file>'` on the partner in `event.ts`.
- **Terms & Conditions / TRE guidelines:** edit `src/pages/terms.md` and `src/pages/tre-guidelines.md`.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which tests, builds and publishes to `https://<owner>.github.io/<repo>/`. One-time setup: **Settings → Pages → Source: GitHub Actions**. Free GitHub Pages requires a public repo.
````

- [ ] **Step 3: Update `CLAUDE.md`**

Replace everything from `## Repository status` up to (but not including) `## Domain constraints that shape anything built here` with:

````markdown
## Commands

```bash
npm start                         # dev server (runs `npm run data` first) at http://localhost:3000/GH26/
npm run build                     # regenerates src/data/wgs.json, builds to build/
npm test                          # unit tests for scripts/build-data.mjs (node:test)
node --test --test-name-pattern="CRLF" scripts/build-data.test.mjs   # single test
npm run build && npm run test:site   # assertions on built HTML (scripts/site.test.mjs)
npm run typecheck
```

## Architecture

- Docusaurus 3.10 with only the pages plugin (docs and blog disabled). `baseUrl` comes from `BASE_URL` (default `/GH26/`) and `url` from `SITE_URL`. `trailingSlash: true` and `onBrokenLinks: 'throw'`.
- The home page (`src/pages/index.tsx`) is a stack of section components in `src/components/sections/`. Each section has an anchor id (`objectives`, `data`, `dates`, `important-dates`, `schedule`, `apply`, `organizers`, `links`) that the navbar and tests rely on.
- **All editable facts** (dates, venue, form URL, partners, links, copy) live in `src/data/event.ts`, and the agenda lives in `src/data/schedule.ts`. Sections must not hard-code these. `formUrl: null` renders a disabled Apply button.
- Data flow: `data/wgs_projects.tsv` → `scripts/build-data.mjs` (runs as prestart/prebuild) → `src/data/wgs.json` (committed, but regenerated on every build). Both the barcode art and the `/data` table read it.
- The footer is swizzled at `src/theme/Footer/`. Design tokens and shared classes (`container-swiss`, `section`, `slash-heading`, `btn`, `tba`, `label`) are in `src/css/custom.css`.
- Deploy: `.github/workflows/deploy.yml` runs tests and the build, then deploys with `actions/deploy-pages`.

## Reference material

`appendix/` is git-ignored because the repo is public and the brief contains internal budget data. It holds:

- `appendix/genomics_thailand_hackathon_brief.md`: the grant brief and source of event facts. The site intentionally omits the budget.
- `appendix/wgs_projects_and_volunteer_counts.txt`: the original of `data/wgs_projects.tsv`. It has 118 rows totalling 51,461 WGSs. Quirks: the ID `709/2561 (EC3)`, group labels that contradict project names (`709/2561 (EC3)`, `00-000`), and `00-001` has an empty name and the largest count (13,017). The site shows these rows as-is.
````

- [ ] **Step 4: Verify the viewport has no horizontal overflow (Review Focus #5)**

Run in terminal A: `npm run build && npm run serve -- --port 3000 --no-open`

Run in terminal B:
```bash
SCRATCH=/private/tmp/claude-501/-Users-golf-dev-GeTH-hackathon-web/1bd20cc3-df6c-4af0-8a43-648293e1fb0b/scratchpad
mkdir -p "$SCRATCH/overflow" && cd "$SCRATCH/overflow" && npm init -y >/dev/null && npm i playwright@1 >/dev/null
cat > check.mjs <<'EOF'
import {chromium} from 'playwright';
const browser = await chromium.launch({channel: 'chrome'});
let failed = false;
for (const width of [360, 768, 1440]) {
  for (const path of ['', 'data/', 'terms/', 'tre-guidelines/']) {
    const page = await browser.newPage({viewport: {width, height: 800}});
    await page.goto(`http://localhost:3000/GH26/${path}`, {waitUntil: 'networkidle'});
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const name = `${width}-${path.replace(/\W/g, '') || 'home'}`;
    await page.screenshot({path: `${name}.png`, fullPage: true});
    console.log(name, over > 0 ? `OVERFLOW ${over}px` : 'ok');
    if (over > 0) failed = true;
    await page.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
EOF
node check.mjs
```
Expected: 12 lines ending in `ok`, exit code 0. If Chrome isn't installed, run `npx playwright install chromium` and drop `channel: 'chrome'`. Open `360-home.png` and `1440-home.png` and confirm:
- the wordmark fills the width;
- the Data panel is black with accent bars;
- the schedule shows 3 cards on the 360 screenshot and 6 on the 1440 one;
- the footer sign-off is accent-coloured.

For any overflow, find the widest element with `document.querySelectorAll('*')` filtered by `getBoundingClientRect().right > innerWidth`, fix its CSS, and rerun.

- [ ] **Step 5: Final full check**

Run: `npm ci && npm test && npm run typecheck && npm run build && npm run test:site`
Expected: all green, with `# pass 9` (unit) and `# pass 16` (site).

- [ ] **Step 6: Commit**

```bash
git add .github README.md CLAUDE.md
git commit -m "ci: deploy to GitHub Pages; document commands and architecture" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 7: Hand off (do not push without the user's go-ahead)**

Report to the user that the branch `feat/website` is ready. Ask before any of these outward-facing actions: pushing, opening a PR, and switching Pages to "GitHub Actions" (`gh api -X POST repos/GeTH-Hackathon/GH26/pages -f build_type=workflow`).
