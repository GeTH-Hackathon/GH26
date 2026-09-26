# Landing Page Scroll-Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the home page into a five-act, data-driven scroll story (animated hero, objectives reveal, pinned barcode-regrouping data scene, pinned "road to Chiang Mai" timeline, Apply finale) that stays fully readable without motion.

**Architecture:**
- GSAP + ScrollTrigger is loaded dynamically inside one hook, `useMotionScene`. It runs per-act scene functions under `gsap.matchMedia` with three cases: desktop (pinned and scrubbed), phone (reveal on enter), and reduced motion (nothing).
- The server-rendered HTML is always the final, visible state.
- The hero's pre-animation hiding is gated by a `data-motion-intro` attribute that a head script sets, with a 1.5s fail-safe.
- The barcode's two arrangements come from a pure, unit-tested `barcodeLayouts()`.

**Tech Stack:** Docusaurus 3.10, React 19, TypeScript, CSS Modules, GSAP 3.15 (ScrollTrigger), node:test, Playwright (scratch verification only).

**Spec:** `docs/superpowers/specs/2026-09-26-landing-story-design.md`

## Global Constraints

- **Breakpoints:** desktop is `(min-width: 997px) and (prefers-reduced-motion: no-preference)`; phone is `(max-width: 996px) and (prefers-reduced-motion: no-preference)`; reduced motion runs no GSAP code.
- **Loading:** GSAP is imported only via dynamic `import()` from home-page components. `main.*.js` must not contain `ScrollTrigger`.
- **Server HTML:** no inline `opacity:0` or `visibility:hidden` in the server HTML. Every element is visible without JavaScript.
- **Hero timing:** ≤ 1.2s total, ease-out-expo, 400–700ms per element. Scroll scenes use `scrub: 0.6`. Hover and colour changes: 150ms `ease`. Press: `scale(0.97)` only under `(hover: hover) and (pointer: fine)`.
- **Animated properties:** only transform and opacity, plus SVG rect `x/y/width/height` for the barcode.
- **Colours:** tokens only (no hard-coded greys in component CSS; a site test enforces this).
- **Anchors:** keep `objectives`, `data`, `dates`, `important-dates`, `schedule`, `apply`, `organizers`, and register every section id via `useAnchor`.
- **Copy:**
  - tagline: `50,000 Thai genomes. Six days in Chiang Mai. Real clinical questions.`
  - deadline line: `Apply by December 2026 · Results January 2027`
  - status link: `Apply ↓`
- **Removed from the home page:** Links section, Marquee, ghost `(51,461)`, duplicate counter row, the four separate hacking-day cards.
- **Commit trailer:** `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

1. **Resizing across the 997px breakpoint mid-page:** the scenes revert cleanly (no stuck pin spacers, bars and counter back to final values, timeline back to vertical). This is covered by the matchMedia cleanup in each scene, and checked in Task 7 by resizing with Playwright.
2. **Arriving via `/#schedule` or `/#apply` while the pinned scenes exist:** the page lands on the right content, not in the middle of a pin spacer showing an empty stage. Checked in Task 7.
3. **Slow or blocked GSAP:** the hero becomes visible within 1.5s, and the scroll scenes simply don't run. Covered by the Task 2 site test, plus a Task 7 check with the chunk blocked.
4. **Visitor already scrolled down on reload:** reveal targets above or inside the viewport are not hidden. Covered by `revealItems` only hiding items below the fold (Task 4), and checked in Task 7.
5. **Dark theme on the new elements:** legend, data-type list and timeline are all token-based. The Task 7 contrast script (light and dark) enforces AA.

---

## File map

| File | Responsibility | Task |
|---|---|---|
| `src/lib/barcodeLayouts.ts` + `scripts/barcode.test.mjs` | Pure strip/grouped layouts | 1 |
| `package.json` (gsap dep, test script) | Deps and scripts | 1–2 |
| `src/motion/useMotionScene.ts` | Dynamic GSAP load + matchMedia runner | 2 |
| `docusaurus.config.ts` (head script) | `data-motion-intro` + 1.5s fail-safe | 2 |
| `src/components/ui/ApplyCta.tsx` + css | Apply button + deadline line | 3 |
| `src/motion/scenes/heroIntro.ts`, `Hero.tsx/.module.css`, `event.ts` tagline | Act 1 | 3 |
| `src/motion/scenes/reveal.ts` | `reveal` scene + `revealItems` helper | 4 |
| `Objectives.tsx`, `Apply.tsx`, `Organizers.tsx` | Act 2 / Act 5 reveal hooks | 4 |
| `src/motion/scenes/dataScene.ts`, `Data.tsx/.module.css` | Act 3 | 5 |
| `src/motion/scenes/roadScene.ts`, `Road.tsx/.module.css` | Act 4 | 6 |
| `src/pages/index.tsx`; delete `Links`, `DatesVenue`, `ImportantDates`, `Schedule`, `Marquee` | Composition | 5–6 |
| `src/css/custom.css` | Press feedback | 3 |
| `scripts/site.test.mjs` | Built-HTML assertions | 2–6 |
| `CLAUDE.md` | Docs | 7 |

---

### Task 1: `barcodeLayouts` (pure) and the GSAP dependency

**Files:**
- Create: `src/lib/barcodeLayouts.ts`, `scripts/barcode.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `barcodeLayouts(projects: BarProject[], opts: LayoutOptions): BarcodeLayouts`.
  - `BarProject = {id, group, wgs}`
  - `Rect = {x, y, width, height}`
  - `Column = {group, x, width, total, projects}`
  - `BarcodeLayouts = {order, strip, grouped, columns}`, index-aligned.
  - `LayoutOptions = {width, height, gap?, minWidth?, columnGap?}` (default `columnGap` is 0.04 of the width).

- [ ] **Step 1: Write the failing tests** in `scripts/barcode.test.mjs`

```js
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
```

- [ ] **Step 2: Add the test file to `npm test` and confirm it fails**

```bash
node -e 'const p=require("./package.json");p.scripts.test+=" scripts/barcode.test.mjs";require("fs").writeFileSync("package.json",JSON.stringify(p,null,2)+"\n")'
npm test
```
Expected: FAIL with `ERR_MODULE_NOT_FOUND ... src/lib/barcodeLayouts.ts`.

- [ ] **Step 3: Implement `src/lib/barcodeLayouts.ts`**

```ts
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
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test`
Expected: all unit tests pass, including the 6 new ones.

- [ ] **Step 5: Install GSAP**

Run: `npm install gsap@^3.15.0`
Expected: `gsap` appears in `dependencies`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/barcodeLayouts.ts scripts/barcode.test.mjs package.json package-lock.json
git commit -m "feat: barcodeLayouts (strip and grouped) and gsap dependency" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Motion runner and the hero fail-safe head script

**Files:**
- Create: `src/motion/useMotionScene.ts`
- Modify: `docusaurus.config.ts` (headTags), `scripts/site.test.mjs`

**Interfaces:**
- Produces:
  - `MEDIA`, the desktop and phone media queries.
  - `type Conditions = {desktop: boolean; phone: boolean}`.
  - `type SceneContext = {gsap; ScrollTrigger; root: HTMLElement; conditions: Conditions}`.
  - `type Scene = (ctx: SceneContext) => void | (() => void)`.
  - `useMotionScene(ref: RefObject<HTMLElement | null>, scene: Scene): void`.
  - The html attribute `data-motion-intro`, present from head-script time until the hero intro starts or 1500ms pass.

- [ ] **Step 1: Write the failing site tests**. Append to `scripts/site.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm run build && npm run test:site`
Expected: both new tests FAIL. There's no head script, and no chunk contains ScrollTrigger yet.

- [ ] **Step 3: Write `src/motion/useMotionScene.ts`**

```ts
import {useEffect, type RefObject} from 'react';
import type {gsap as GSAP} from 'gsap';
import type {ScrollTrigger as ST} from 'gsap/ScrollTrigger';

export const MEDIA = {
  desktop: '(min-width: 997px) and (prefers-reduced-motion: no-preference)',
  phone: '(max-width: 996px) and (prefers-reduced-motion: no-preference)',
};

export type Conditions = {desktop: boolean; phone: boolean};
export type SceneContext = {gsap: typeof GSAP; ScrollTrigger: typeof ST; root: HTMLElement; conditions: Conditions};
export type Scene = (ctx: SceneContext) => void | (() => void);

// Browser-only: loads GSAP on demand and runs `scene` once per matching media condition.
// Reduced motion matches neither condition, so nothing animates and the server HTML stays as is.
export function useMotionScene(ref: RefObject<HTMLElement | null>, scene: Scene): void {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let cancelled = false;
    let revert: (() => void) | undefined;
    Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([{gsap}, {ScrollTrigger}]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();
        mm.add(
          MEDIA,
          (ctx) => scene({gsap, ScrollTrigger, root, conditions: ctx.conditions as Conditions}) ?? undefined,
          root,
        );
        revert = () => mm.revert();
        document.fonts?.ready.then(() => {
          if (!cancelled) ScrollTrigger.refresh();
        });
      })
      .catch(() => {
        /* Motion is an enhancement; the page is already complete without it. */
      });
    return () => {
      cancelled = true;
      revert?.();
    };
  }, [ref, scene]);
}
```

- [ ] **Step 4: Add the head script** to `docusaurus.config.ts` `headTags`, after the two preconnect links:

```ts
    {
      // Hides the hero parts only while its intro is about to run; removed by the intro, or after 1.5s regardless.
      tagName: 'script',
      attributes: {},
      innerHTML:
        "(function(){try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){var d=document.documentElement;d.setAttribute('data-motion-intro','');setTimeout(function(){d.removeAttribute('data-motion-intro')},1500)}}catch(e){}})();",
    },
```

- [ ] **Step 5: Make the build contain a GSAP chunk.** The code-split test needs a consumer, so add a temporary no-op use in `src/pages/index.tsx` (Task 3 replaces it with the real hero scene):

```tsx
import {useRef} from 'react';
import {useMotionScene} from '@site/src/motion/useMotionScene';
// inside Home(), before return:
const pageRef = useRef<HTMLElement>(null);
useMotionScene(pageRef, () => undefined);
// and put ref={pageRef} on <main>
```

- [ ] **Step 6: Run everything and confirm it passes**

Run: `npm test && npm run typecheck && npm run build && npm run test:site`
Expected: all pass, including the two new tests.

- [ ] **Step 7: Commit**

```bash
git add src/motion/useMotionScene.ts docusaurus.config.ts src/pages/index.tsx scripts/site.test.mjs
git commit -m "feat: GSAP motion runner (matchMedia) and hero intro fail-safe" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Act 1, the hero (intro, deadline, new tagline) and press feedback

**Files:**
- Create: `src/components/ui/ApplyCta.tsx`, `src/components/ui/ApplyCta.module.css`, `src/motion/scenes/heroIntro.ts`
- Modify: `src/components/sections/Hero.tsx`, `Hero.module.css`, `src/data/event.ts` (tagline), `src/css/custom.css` (btn), `src/pages/index.tsx` (remove the temporary hook), `scripts/site.test.mjs`

**Interfaces:**
- Consumes: `useMotionScene` and `Scene` (Task 2).
- Produces:
  - `ApplyCta()`, rendering `ApplyButton` plus a `<p>` with `deadlineLine()`.
  - `deadlineLine(): string | null`.
  - `heroIntro: Scene`.
  - Markup hooks `data-intro="status" | "line" | "rest" | "barcode"`.

- [ ] **Step 1: Write the failing tests**

```js
test('hero: new tagline, deadline next to Apply, in-page status link', () => {
  const html = read('index.html');
  const hero = html.slice(html.indexOf('<header'), html.indexOf('id="objectives"'));
  assert.match(hero, /50,000 Thai genomes\. Six days in Chiang Mai\. Real clinical questions\./);
  assert.doesNotMatch(html, /Unlocking/);
  assert.match(hero, /Apply by December 2026 · Results January 2027/);
  assert.match(hero, /href="#apply"[^>]*>Apply ↓</);
  for (const k of ['status', 'line', 'rest', 'barcode']) assert.match(hero, new RegExp(`data-intro="${k}"`));
});
```

Also update the existing hero test's `h1` expectation (it stays `GeTH Hackathon 2027`), so no change is needed there.

- [ ] **Step 2: Confirm it fails**

Run: `npm run build && npm run test:site`
Expected: the new hero test FAILS.

- [ ] **Step 3: Implement**

`src/data/event.ts`: change the tagline line to
```ts
  tagline: '50,000 Thai genomes. Six days in Chiang Mai. Real clinical questions.',
```

`src/components/ui/ApplyCta.tsx`:
```tsx
import ApplyButton from './ApplyButton';
import {event} from '@site/src/data/event';
import styles from './ApplyCta.module.css';

const dateOf = (label: string) => event.importantDates.find((d) => d.label === label)?.date;

// "Apply by December 2026 · Results January 2027", read from event.importantDates.
export function deadlineLine(): string | null {
  const deadline = dateOf('Application deadline');
  const results = dateOf('Participants announced');
  if (!deadline) return null;
  return `Apply by ${deadline}${results ? ` · Results ${results}` : ''}`;
}

export default function ApplyCta() {
  const line = deadlineLine();
  return (
    <div className={styles.cta}>
      <ApplyButton />
      {line && <p className={styles.deadline}>{line}</p>}
    </div>
  );
}
```

`src/components/ui/ApplyCta.module.css`:
```css
.cta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; }
.deadline { margin: 0; font-size: 14px; font-weight: 600; }
```

`src/motion/scenes/heroIntro.ts`:
```ts
import type {Scene} from '../useMotionScene';

// Load choreography: status → wordmark lines rise from their masks → tagline and actions → barcode draws in. ≈1.2s.
export const heroIntro: Scene = ({gsap, root}) => {
  const html = document.documentElement;
  // The 1.5s fail-safe already revealed the hero: never hide it again.
  if (!html.hasAttribute('data-motion-intro')) return;
  const status = root.querySelectorAll('[data-intro="status"]');
  const lines = root.querySelectorAll('[data-intro="line"]');
  const rest = root.querySelectorAll('[data-intro="rest"]');
  const bars = root.querySelectorAll('[data-intro="barcode"] rect');
  gsap.set(status, {opacity: 0});
  gsap.set(lines, {yPercent: 110});
  gsap.set(rest, {opacity: 0, y: 12});
  gsap.set(bars, {scaleY: 0, transformOrigin: '50% 100%'});
  html.removeAttribute('data-motion-intro');
  const tl = gsap.timeline({defaults: {ease: 'expo.out'}});
  tl.to(status, {opacity: 1, duration: 0.4, stagger: 0.05}, 0)
    .to(lines, {yPercent: 0, duration: 0.7, stagger: 0.09}, 0.05)
    .to(rest, {opacity: 1, y: 0, duration: 0.5, stagger: 0.06}, 0.35)
    .to(bars, {scaleY: 1, duration: 0.45, stagger: {amount: 0.35}}, 0.4);
  return () => {
    tl.kill();
  };
};
```

`src/components/sections/Hero.tsx`:
```tsx
import {Fragment, useRef} from 'react';
import ApplyCta from '@site/src/components/ui/ApplyCta';
import GenomeBarcode from '@site/src/components/ui/GenomeBarcode';
import {event} from '@site/src/data/event';
import {useMotionScene} from '@site/src/motion/useMotionScene';
import {heroIntro} from '@site/src/motion/scenes/heroIntro';
import styles from './Hero.module.css';

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  useMotionScene(ref, heroIntro);
  return (
    <header className={styles.hero} ref={ref}>
      <div className="container-swiss">
        <div className={styles.status} data-intro="status">
          <span className="label">{event.statusLine}</span>
          <a className="label" href="#apply">Apply ↓</a>
        </div>
        <p className={styles.kicker} data-intro="status">/ Hackathon 2027</p>
        <h1 className={styles.title}>
          <span className={styles.wordmark}>
            {event.brand.split(' ').map((word, i) => (
              <Fragment key={word}>
                {i > 0 && ' '}
                <span className={styles.line}>
                  <span className={styles.lineInner} data-intro="line">{word}</span>
                </span>
              </Fragment>
            ))}
          </span>
          <span className="sr-only">{event.name.replace(event.brand, '')}</span>
        </h1>
        <div className={styles.row}>
          <p className={styles.tagline} data-intro="rest">{event.tagline}</p>
          <div className={styles.ctas} data-intro="rest">
            <ApplyCta />
            <a href="#data">See the data ↓</a>
          </div>
        </div>
        <div data-intro="barcode">
          <GenomeBarcode className={styles.barcode} height={96} />
        </div>
      </div>
    </header>
  );
}
```

`Hero.module.css` changes:
- Replace `.line { display: block; }` with:
  ```css
  .line { display: block; overflow: clip; padding: 0.05em 0.04em; margin: -0.05em -0.04em; }
  .lineInner { display: inline-block; }
  :global(html[data-motion-intro]) .hero [data-intro] { opacity: 0; }
  ```
- In the `@media (min-width: 997px)` block, replace `.line { display: inline; }` with:
  ```css
  .line { display: inline-block; vertical-align: top; }
  ```

`src/css/custom.css`: replace the `.btn` rule's end and add the press rules:
```css
.btn { transition: background-color 150ms ease, color 150ms ease, transform 150ms ease-out; }
@media (hover: hover) and (pointer: fine) {
  .btn:active { transform: scale(0.97); }
}
@media (prefers-reduced-motion: reduce) {
  .btn { transition: none; }
}
```
(These are added as new rules after the existing `.btn[disabled]` rule.)

`src/pages/index.tsx`: remove the temporary `useMotionScene` from Task 2 (the hero now provides the GSAP consumer), and restore `<main>` without a ref.

- [ ] **Step 4: Run everything and confirm it passes**

Run: `npm test && npm run typecheck && npm run build && npm run test:site`
Expected: all pass. The earlier hero test (`h1` text and status line) and the code-split test still pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ApplyCta.tsx src/components/ui/ApplyCta.module.css src/motion/scenes/heroIntro.ts src/components/sections/Hero.tsx src/components/sections/Hero.module.css src/data/event.ts src/css/custom.css src/pages/index.tsx scripts/site.test.mjs
git commit -m "feat: hero intro choreography, deadline beside Apply, new tagline, press feedback" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Reveal scene for Acts 2 and 5 (Objectives, Apply, Organizers)

**Files:**
- Create: `src/motion/scenes/reveal.ts`
- Modify: `Objectives.tsx`, `Apply.tsx`, `Organizers.tsx`, `scripts/site.test.mjs`

**Interfaces:**
- Consumes: `Scene`, `SceneContext` (Task 2); `ApplyCta` (Task 3).
- Produces:
  - `reveal: Scene`, which animates `[data-reveal]` descendants of the root.
  - `revealItems(gsap, ScrollTrigger, items: HTMLElement[]): void`, which only hides items below the fold, then reveals them in batches on enter.

- [ ] **Step 1: Write the failing test**

```js
test('reveal hooks on objectives, apply and organizers; Apply section shows the deadline too', () => {
  const html = read('index.html');
  const part = (a, b) => html.slice(html.indexOf(`id="${a}"`), b ? html.indexOf(`id="${b}"`) : undefined);
  assert.ok((part('objectives', 'data').match(/data-reveal/g) ?? []).length >= 7, 'intro paragraphs + 5 objectives');
  assert.ok((part('apply', 'organizers').match(/data-reveal/g) ?? []).length >= 3);
  assert.ok((part('organizers').match(/data-reveal/g) ?? []).length >= 3);
  assert.equal((html.match(/Apply by December 2026 · Results January 2027/g) ?? []).length, 2, 'hero and Apply');
});
```

- [ ] **Step 2: Confirm it fails**

Run: `npm run build && npm run test:site`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/motion/scenes/reveal.ts`:
```ts
import type {Scene, SceneContext} from '../useMotionScene';

// Fade items up as they enter. Items already above or inside the viewport stay visible (no flash on reload mid-page).
export function revealItems(gsap: SceneContext['gsap'], ScrollTrigger: SceneContext['ScrollTrigger'], items: HTMLElement[]): void {
  const below = items.filter((el) => el.getBoundingClientRect().top > window.innerHeight);
  if (!below.length) return;
  gsap.set(below, {opacity: 0, y: 16});
  ScrollTrigger.batch(below, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, {opacity: 1, y: 0, duration: 0.5, ease: 'power4.out', stagger: 0.08, overwrite: true}),
  });
}

export const reveal: Scene = ({gsap, ScrollTrigger, root}) => {
  revealItems(gsap, ScrollTrigger, Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]')));
};
```

`Objectives.tsx`: add `useRef`, `useMotionScene(ref, reveal)`, `ref` on the `container-swiss` div, `data-reveal` on each intro `<p>` and each `<li className={styles.item}>`:
```tsx
import {useRef} from 'react';
import {useMotionScene} from '@site/src/motion/useMotionScene';
import {reveal} from '@site/src/motion/scenes/reveal';
// in the component:
const ref = useRef<HTMLDivElement>(null);
useMotionScene(ref, reveal);
// <div className="container-swiss" ref={ref}>
// {event.objectivesIntro.map((p) => <p key={p.slice(0, 32)} data-reveal>{p}</p>)}
// <li key={text} className={styles.item} data-reveal>
```

`Apply.tsx`: the same hook on the `container-swiss` div; add `data-reveal` to the `intro` div, the `aside` and the `details` div. Replace `<ApplyButton />` in the aside with `<ApplyCta />` and swap the import (`import ApplyCta from '@site/src/components/ui/ApplyCta';`).

`Organizers.tsx`: the same hook on the `container-swiss` div; add `data-reveal` to each role row `<div key={role} className={styles.row}>`.

- [ ] **Step 4: Run everything and confirm it passes**

Run: `npm test && npm run typecheck && npm run build && npm run test:site`
Expected: all pass. The earlier Apply test (the button precedes "Who should apply") still passes, because `ApplyCta` contains "Apply now ↗".

- [ ] **Step 5: Commit**

```bash
git add src/motion/scenes/reveal.ts src/components/sections/Objectives.tsx src/components/sections/Apply.tsx src/components/sections/Organizers.tsx scripts/site.test.mjs
git commit -m "feat: scroll reveals for objectives, apply and organizers; deadline in Apply" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Act 3, the data scene (pinned barcode regroup)

**Files:**
- Create: `src/motion/scenes/dataScene.ts`
- Modify (rewrite): `src/components/sections/Data.tsx`, `src/components/sections/Data.module.css`
- Delete: `src/components/ui/Marquee.tsx`, `src/components/ui/Marquee.module.css`
- Modify: `scripts/site.test.mjs`

**Interfaces:**
- Consumes: `barcodeLayouts` (Task 1), `useMotionScene`/`Scene` (Task 2), `reveal` (Task 4), `groupColor(group, onDark)`, `fmt`.
- Produces:
  - `CHART = {width: 1200, height: 360}`.
  - `dataScene: Scene`.
  - Markup hooks: `rect[data-bar]` (118, in `order`, rendered in the grouped layout), `[data-count]`, `[data-col]` (7).

- [ ] **Step 1: Replace the obsolete tests and add the new ones.** In `scripts/site.test.mjs`:
- Delete the test `'marquee: pauses on hover and keyboard focus (WCAG 2.2.2)'`.
- Replace the test `'data: en-US formatted totals, all seven groups and the data types'` with:

```js
test('data: counter, grouped barcode (118 bars, 7 labelled columns), data-type descriptions, no marquee', () => {
  const html = read('index.html');
  const data = html.slice(html.indexOf('id="data"'), html.indexOf('id="dates"'));
  assert.match(data, /data-count="51461"[^>]*>51,461</);
  assert.match(data, /118 projects · 7 disease groups/);
  assert.equal((data.match(/<rect[^>]*data-bar/g) ?? []).length, 118);
  assert.equal((data.match(/data-col/g) ?? []).length, 7);
  for (const g of ['Rare Diseases', 'NCD', 'Cancer', 'Pharmacogenomics', 'Infectious Diseases', 'Popgen', 'Non-Rare & Non-Cancer']) assert.ok(data.includes(g), g);
  for (const d of ['Variant Call Format files', 'PLINK binary format', 'HLA allele calls', 'star-allele calls', 'Larger genomic rearrangements', 'pseudonymised metadata']) assert.ok(data.includes(d), d);
  assert.match(data, /href="https:\/\/data\.genomicsthailand\.com"/);
  assert.doesNotMatch(html, /hover or focus to pause/);
  assert.doesNotMatch(data, /\(51,461\)/);
});
```

- [ ] **Step 2: Confirm it fails**

Run: `npm run build && npm run test:site`
Expected: the new data test FAILS.

- [ ] **Step 3: Implement**

`src/motion/scenes/dataScene.ts`:
```ts
import type {Scene} from '../useMotionScene';
import wgs from '@site/src/data/wgs.json';
import {barcodeLayouts} from '@site/src/lib/barcodeLayouts';
import {fmt} from '@site/src/lib/format';

export const CHART = {width: 1200, height: 360};

// Desktop: pin the panel and scrub (count up, then strip → disease-group columns, then legend).
// Phone: the same sequence plays once when the panel enters. The server HTML is the final grouped state.
export const dataScene: Scene = ({gsap, root, conditions}) => {
  const {strip, grouped} = barcodeLayouts(wgs.projects, CHART);
  const bars = Array.from(root.querySelectorAll<SVGRectElement>('rect[data-bar]'));
  const counter = root.querySelector<HTMLElement>('[data-count]');
  const legend = root.querySelectorAll('[data-col]');
  const total = wgs.totals.wgs;
  const n = {v: 0};
  const setCount = () => {
    if (counter) counter.textContent = fmt(Math.round(n.v));
  };

  bars.forEach((b, i) => gsap.set(b, {attr: strip[i]}));
  gsap.set(legend, {opacity: 0});
  setCount();

  const tl = gsap.timeline(
    conditions.desktop
      ? {scrollTrigger: {trigger: root, start: 'top 76px', end: '+=180%', pin: true, scrub: 0.6}}
      : {scrollTrigger: {trigger: root, start: 'top 70%', once: true}},
  );
  tl.to(n, {v: total, duration: 1, ease: conditions.desktop ? 'none' : 'power2.out', onUpdate: setCount}, 0);
  bars.forEach((b, i) => tl.to(b, {attr: grouped[i], duration: 1.2, ease: 'power2.inOut'}, 0.8 + i * 0.004));
  tl.to(legend, {opacity: 1, duration: 0.4, stagger: 0.08}, '-=0.5');
  if (conditions.phone) tl.timeScale(1.6);

  return () => {
    n.v = total;
    setCount();
  };
};
```

`src/components/sections/Data.tsx` (full rewrite):
```tsx
import {useRef} from 'react';
import Link from '@docusaurus/Link';
import {useAnchor} from '@site/src/lib/useAnchor';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import wgs from '@site/src/data/wgs.json';
import {event} from '@site/src/data/event';
import {groupColor} from '@site/src/data/groups';
import {fmt} from '@site/src/lib/format';
import {barcodeLayouts} from '@site/src/lib/barcodeLayouts';
import {useMotionScene} from '@site/src/motion/useMotionScene';
import {dataScene, CHART} from '@site/src/motion/scenes/dataScene';
import {reveal} from '@site/src/motion/scenes/reveal';
import styles from './Data.module.css';

const layouts = barcodeLayouts(wgs.projects, CHART);
const summary = layouts.columns.map((c) => `${c.group} ${fmt(c.total)}`).join(', ');

export default function Data() {
  const stageRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  useMotionScene(stageRef, dataScene);
  useMotionScene(detailsRef, reveal);
  return (
    <section id={useAnchor('data')} className="section section--flush">
      <div className="container-swiss">
        <div className={styles.panel} ref={stageRef}>
          <span className={styles.vertical} aria-hidden="true">genomics thailand</span>
          <SlashHeading>Genomics data</SlashHeading>
          <p className={styles.count}>
            <span data-count={wgs.totals.wgs}>{fmt(wgs.totals.wgs)}</span> <span className={styles.unit}>whole genomes</span>
          </p>
          <p className={styles.sub}>{wgs.totals.projects} projects · {wgs.totals.groups} disease groups</p>
          <figure className={styles.chart}>
            <svg
              viewBox={`0 0 ${CHART.width} ${CHART.height}`}
              preserveAspectRatio="none"
              className={styles.svg}
              role="img"
              aria-label={`Whole genomes by disease group: ${summary}.`}>
              {layouts.order.map((p, i) => {
                const b = layouts.grouped[i];
                return (
                  <rect key={`${p.id}-${i}`} data-bar x={b.x} y={b.y} width={b.width} height={b.height} style={{fill: groupColor(p.group, true)}} />
                );
              })}
            </svg>
            <ol className={styles.legend}>
              {layouts.columns.map((c) => (
                <li key={c.group} data-col>
                  <span className={styles.swatch} style={{background: groupColor(c.group, true)}} aria-hidden="true" />
                  <span className={styles.colName}>{c.group}</span>
                  <span className={styles.colTotal}>{fmt(c.total)}</span>
                </li>
              ))}
            </ol>
          </figure>
        </div>
        <div className={styles.details} ref={detailsRef}>
          <h3 className={styles.detailsHeading} data-reveal>What's in the data</h3>
          <dl className={styles.types}>
            {event.dataTypes.map((t) => (
              <div key={t.name} className={styles.type} data-reveal>
                <dt>{t.name}</dt>
                <dd>{t.description}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.note} data-reveal>{event.dataNote}</p>
          <p className={styles.links} data-reveal>
            <Link to="/data">Explore all {wgs.totals.projects} projects →</Link>
            <a href={event.dataPortal.href} target="_blank" rel="noopener noreferrer">{event.dataPortal.label} ↗</a>
          </p>
        </div>
      </div>
    </section>
  );
}
```

`src/components/sections/Data.module.css` (full rewrite):
```css
.panel { position: relative; background: var(--panel-bg); color: var(--panel-text); border: 1px solid var(--panel-edge); border-radius: var(--radius); padding: clamp(28px, 5vw, 64px) clamp(20px, 5vw, 64px); overflow: hidden; }
.panel h2 { color: var(--panel-text); padding-right: 20px; margin-bottom: clamp(16px, 3vw, 28px); }
.panel a { color: var(--panel-text); }
.vertical { position: absolute; top: 32px; right: 12px; writing-mode: vertical-rl; font-size: 12px; letter-spacing: 0.04em; color: var(--panel-label); }
.count { margin: 0; font-size: clamp(2.75rem, 7vw, 5.5rem); font-weight: 500; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums; }
.unit { font-size: 0.32em; letter-spacing: -0.01em; color: var(--panel-note); }
.sub { margin: 8px 0 clamp(20px, 3vw, 32px); color: var(--panel-note); }
.chart { margin: 0; }
.svg { display: block; width: 100%; height: clamp(180px, 32vh, 340px); }
.svg rect { stroke: var(--panel-bg); stroke-width: 1; vector-effect: non-scaling-stroke; }
.legend { list-style: none; padding: 0; margin: 12px 0 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; font-size: 13px; }
.legend li { display: grid; grid-template-columns: 10px minmax(0, 1fr); column-gap: 8px; align-items: baseline; }
.swatch { width: 10px; height: 10px; border-radius: 2px; align-self: center; }
.colName { grid-column: 2; }
.colTotal { grid-column: 2; color: var(--panel-note); font-variant-numeric: tabular-nums; }
.details { padding-top: clamp(40px, 6vw, 72px); }
.detailsHeading { font-size: clamp(1.25rem, 2.2vw, 1.75rem); font-weight: 500; letter-spacing: -0.02em; margin: 0 0 16px; }
.types { display: grid; margin: 0 0 32px; border-top: 1px solid var(--rule); }
.type { display: grid; gap: 4px; padding: 14px 0; border-bottom: 1px solid var(--rule); }
.type dt { font-weight: 600; }
.type dd { margin: 0; color: var(--text-2); }
.note { max-width: 60ch; margin: 0 0 16px; }
.links { display: flex; flex-wrap: wrap; gap: 12px 32px; margin: 0; }
@media (min-width: 997px) {
  /* 7 legend entries under their columns: the same 4% gap as the SVG layout. */
  .legend { grid-template-columns: repeat(7, minmax(0, 1fr)); column-gap: 4%; }
  .types { grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 32px; }
}
```

Delete `src/components/ui/Marquee.tsx` and `src/components/ui/Marquee.module.css` (`git rm`).

- [ ] **Step 4: Run everything and confirm it passes**

Run: `npm test && npm run typecheck && npm run build && npm run test:site`
Expected: all pass, including the "no hard-coded greys" test and the "/ Genomics data." heading test.

- [ ] **Step 5: Commit**

```bash
git add -A src/motion/scenes/dataScene.ts src/components/sections/Data.tsx src/components/sections/Data.module.css src/components/ui scripts/site.test.mjs
git commit -m "feat: pinned data scene, barcode regroups into disease-group columns" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Act 4, the road to Chiang Mai (one timeline); remove Links

**Files:**
- Create: `src/components/sections/Road.tsx`, `Road.module.css`, `src/motion/scenes/roadScene.ts`
- Delete: `DatesVenue.*`, `ImportantDates.*`, `Schedule.*`, `Links.*` in `src/components/sections/`
- Modify: `src/pages/index.tsx`, `scripts/site.test.mjs`

**Interfaces:**
- Consumes: `useMotionScene`/`Scene`, `revealItems` (Task 4), `schedule`, `hackDaysSummary`, `ScheduleDay`, `event.importantDates`, `event.venue`, `TBA`.
- Produces:
  - `Road()` with section id `dates`.
  - `id="important-dates"` on the first milestone and `id="schedule"` on Day 1.
  - `roadScene: Scene` (desktop sets `data-layout="horizontal"` on the viewport).
  - Hooks: `[data-rail]`, `[data-progress]`, `[data-stop]` (6).

- [ ] **Step 1: Update and replace tests** in `scripts/site.test.mjs`:
- In `'important dates: four milestones, inexact ones tagged TBA'`, change the loop list to `['November 2026', 'December 2026', 'January 2027']`.
- In `'schedule: supplied times and every day present'`, replace the day list with `['Sun 7 Feb', 'Mon 8 – Thu 11 Feb', 'Fri 12 Feb']`.
- In `'home: every section present in spec order'`, change `ids` to `['objectives', 'data', 'dates', 'important-dates', 'schedule', 'apply', 'organizers']`.
- Replace `'links: external links open safely in a new tab'` with:
```js
test('links section removed; its links live in the footer and open safely in a new tab', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /id="links"/);
  const footer = html.slice(html.lastIndexOf('<footer'));
  assert.match(footer, /href="https:\/\/data\.genomicsthailand\.com"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.match(footer, /href="https:\/\/2026\.biohackathon\.org"/);
  assert.match(footer, /href="\/terms\/"/);
  assert.match(footer, /href="\/tre-guidelines\/"/);
});
```
- In `'home: Terms no longer marked "coming soon"; TRE guidelines still are'`, delete the two `id="links"` assertions (keep the Apply-section ones).
- Add:
```js
test('road: one timeline, milestones then the three stretches of the week, in order', () => {
  const html = read('index.html');
  const road = html.slice(html.indexOf('id="dates"'), html.indexOf('id="apply"'));
  assert.equal((road.match(/data-stop/g) ?? []).length, 6);
  const order = ['Applications open', 'Application deadline', 'Participants announced', 'Opening workshop', 'Hackathon days ×4', 'Wrap-up'];
  const pos = order.map((s) => road.indexOf(s));
  pos.forEach((p, i) => assert.ok(p > -1, `missing ${order[i]}`));
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
  assert.match(road, /<h2 class="slash-heading">.*The road to Chiang Mai\.<\/h2>/s);
});
```

- [ ] **Step 2: Confirm the new and updated tests fail**

Run: `npm run build && npm run test:site`
Expected: road, links-removed and schedule tests FAIL.

- [ ] **Step 3: Implement**

`src/motion/scenes/roadScene.ts`:
```ts
import type {Scene} from '../useMotionScene';
import {revealItems} from './reveal';

// Desktop: switch to the horizontal layout, pin the viewport, scrub the rail sideways and advance the current stop.
// Phone: keep the vertical timeline and reveal stops as they enter.
export const roadScene: Scene = ({gsap, ScrollTrigger, root, conditions}) => {
  const rail = root.querySelector<HTMLElement>('[data-rail]');
  const progress = root.querySelector<HTMLElement>('[data-progress]');
  const stops = Array.from(root.querySelectorAll<HTMLElement>('[data-stop]'));
  if (!rail || !stops.length) return;

  if (!conditions.desktop) {
    revealItems(gsap, ScrollTrigger, stops);
    return;
  }

  root.setAttribute('data-layout', 'horizontal');
  const distance = () => Math.max(0, rail.scrollWidth - root.clientWidth);
  let current = -1;
  const mark = (p: number) => {
    const i = Math.min(stops.length - 1, Math.round(p * (stops.length - 1)));
    if (i === current) return;
    current = i;
    stops.forEach((s, j) => s.toggleAttribute('data-current', j === i));
  };
  mark(0);
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: 'top 96px',
      end: () => `+=${distance() + window.innerHeight * 0.5}`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (st) => mark(st.progress),
    },
  });
  tl.to(rail, {x: () => -distance(), ease: 'none'}, 0);
  if (progress) tl.fromTo(progress, {scaleX: 0}, {scaleX: 1, ease: 'none'}, 0);
  return () => {
    root.removeAttribute('data-layout');
    stops.forEach((s) => s.removeAttribute('data-current'));
  };
};
```

`src/components/sections/Road.tsx`:
```tsx
import {useRef} from 'react';
import clsx from 'clsx';
import {useAnchor} from '@site/src/lib/useAnchor';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import TBA from '@site/src/components/ui/TBA';
import {event} from '@site/src/data/event';
import {schedule, hackDaysSummary, type ScheduleDay} from '@site/src/data/schedule';
import {useMotionScene} from '@site/src/motion/useMotionScene';
import {roadScene} from '@site/src/motion/scenes/roadScene';
import styles from './Road.module.css';

type Stop = {key: string; anchor?: 'important-dates' | 'schedule'; when: string; title: string; exact: boolean; items?: ScheduleDay['items']; onSite: boolean};

// Milestones before the event, then Day 1, Days 2–5 (shared agenda shown once) and Day 6.
function buildStops(): Stop[] {
  const milestones: Stop[] = event.importantDates
    .filter((d) => d.label !== 'Hackathon')
    .map((d, i) => ({key: d.label, anchor: i === 0 ? 'important-dates' : undefined, when: d.date, title: d.label, exact: d.exact, onSite: false}));
  const opening = schedule.find((d) => d.kind === 'opening');
  const hack = schedule.filter((d) => d.kind === 'hack');
  const wrap = schedule.find((d) => d.kind === 'wrapup');
  const days: Stop[] = [];
  if (opening) days.push({key: 'day-1', anchor: 'schedule', when: `Day ${opening.dayLabel} · ${opening.dateLabel}`, title: opening.title, exact: true, items: opening.items, onSite: true});
  if (hack[0]) days.push({key: 'days-2-5', when: `Days ${hackDaysSummary.dayLabel} · ${hackDaysSummary.dateLabel}`, title: `Hackathon days ×${hack.length}`, exact: true, items: hack[0].items, onSite: true});
  if (wrap) days.push({key: 'day-6', when: `Day ${wrap.dayLabel} · ${wrap.dateLabel}`, title: wrap.title, exact: true, items: wrap.items, onSite: true});
  return [...milestones, ...days];
}

export default function Road() {
  const ref = useRef<HTMLDivElement>(null);
  useMotionScene(ref, roadScene);
  const ids = {'important-dates': useAnchor('important-dates'), schedule: useAnchor('schedule')};
  const {venue} = event;
  return (
    <section id={useAnchor('dates')} className="section">
      <div className="container-swiss">
        <SlashHeading>The road to Chiang Mai</SlashHeading>
        <p className={styles.venue}>
          <strong>{event.dateRange}</strong> · {venue.city}, {venue.country} · {venue.name ?? <>Hotel to be announced<TBA /></>} · Nearest airport: {venue.airport}
        </p>
      </div>
      <div className={styles.viewport} ref={ref}>
        <div className={styles.rail} data-rail>
          <span className={styles.progress} data-progress aria-hidden="true" />
          <ol className={styles.track}>
            {buildStops().map((s) => (
              <li key={s.key} id={s.anchor ? ids[s.anchor] : undefined} className={clsx(styles.stop, s.onSite && styles.onSite)} data-stop>
                <span className={styles.dot} aria-hidden="true" />
                <p className={styles.when}>
                  {s.when}
                  {!s.exact && <TBA title="Exact day to be announced" />}
                </p>
                <h3 className={styles.title}>{s.title}</h3>
                {s.items && (
                  <ol className={styles.items}>
                    {s.items.map((it, i) => (
                      <li key={i}>
                        <span className={styles.time}>{it.time ?? ''}</span>
                        <span>{it.title}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
```

`src/components/sections/Road.module.css`:
```css
.venue { margin: 0 0 clamp(32px, 5vw, 56px); font-size: clamp(1.05rem, 1.6vw, 1.25rem); max-width: 70ch; }
.viewport { position: relative; }
.rail { position: relative; max-width: var(--maxw); margin: 0 auto; padding: 0 var(--gutter); }
.progress { display: none; }
.track { list-style: none; margin: 0; padding: 0; }
.stop { position: relative; margin-left: 5px; padding: 0 0 28px 28px; border-left: 1px solid var(--rule); }
.dot { position: absolute; left: -6px; top: 4px; width: 11px; height: 11px; border-radius: 50%; background: var(--paper); border: 2px solid var(--ink); }
.onSite .dot { background: var(--accent); border-color: var(--accent); }
.when { margin: 0 0 4px; font-size: 13px; font-weight: 600; letter-spacing: 0.02em; color: var(--text-2); }
.title { margin: 0 0 8px; font-size: clamp(1.25rem, 2.2vw, 1.75rem); font-weight: 500; letter-spacing: -0.02em; line-height: 1.15; }
.items { list-style: none; padding: 0; margin: 0; max-width: 34rem; }
.items li { display: grid; grid-template-columns: 6.5rem minmax(0, 1fr); gap: 8px; padding: 6px 0; border-top: 1px solid var(--rule); font-size: 15px; }
.time { color: var(--text-2); font-variant-numeric: tabular-nums; }

/* Desktop motion only (roadScene sets data-layout): a horizontal rail that scrolls sideways while pinned. */
.viewport[data-layout='horizontal'] { overflow: hidden; }
.viewport[data-layout='horizontal'] .rail { max-width: none; width: max-content; margin: 0; padding: 12px var(--gutter) 0 max(var(--gutter), calc((100vw - var(--maxw)) / 2 + var(--gutter))); }
.viewport[data-layout='horizontal'] .progress { display: block; position: absolute; top: 12px; left: 0; right: 0; height: 2px; background: var(--accent); transform-origin: left center; }
.viewport[data-layout='horizontal'] .track { display: flex; gap: 32px; }
.viewport[data-layout='horizontal'] .stop { width: min(30vw, 380px); margin: 0; padding: 24px 0 0; border-left: 0; border-top: 2px solid var(--rule); opacity: 0.45; transition: opacity 150ms ease; }
.viewport[data-layout='horizontal'] .stop[data-current] { opacity: 1; }
.viewport[data-layout='horizontal'] .dot { left: 0; top: -7px; }
@media (prefers-reduced-motion: reduce) {
  .viewport[data-layout='horizontal'] .stop { transition: none; }
}
```

`src/pages/index.tsx`: replace the `DatesVenue`, `ImportantDates`, `Schedule` and `Links` imports and elements with `import Road from '@site/src/components/sections/Road';` and `<Road />` between `<Data />` and `<Apply />`. The resulting order is Hero, Objectives, Data, Road, Apply, Organizers.

Delete (`git rm`):
- `src/components/sections/DatesVenue.tsx` and `DatesVenue.module.css`
- `ImportantDates.tsx` and `ImportantDates.module.css`
- `Schedule.tsx` and `Schedule.module.css`
- `Links.tsx` and `Links.module.css`

- [ ] **Step 4: Run everything and confirm it passes**

Run: `npm test && npm run typecheck && npm run build && npm run test:site`
Expected: all pass, including `'dates & venue'`, `'schedule: Friday shows no breakfast time'`, `'important dates … TBA'` (3 TBA tags between the first milestone and Day 1), and `'sentence case'`.

- [ ] **Step 5: Commit**

```bash
git add -A src/components/sections src/motion/scenes/roadScene.ts src/pages/index.tsx scripts/site.test.mjs
git commit -m "feat: road to Chiang Mai timeline (pinned horizontal on desktop); remove Links section" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Browser verification and docs

**Files:**
- Modify: `CLAUDE.md`
- Scratch (not committed): `$SCRATCH/overflow/story.mjs`

- [ ] **Step 1: Build and serve.** Run `npm run build`, then in the background `npx docusaurus serve --port 3000 --no-open`.

- [ ] **Step 2: Run the scenario script** (`$SCRATCH/overflow/story.mjs`, where Playwright is already installed):

```js
import {chromium} from 'playwright';
const b = await chromium.launch({channel: 'chrome'});
const URL = 'http://localhost:3000/';
const out = {};
const errs = [];
const page = async (opts = {}) => {
  const ctx = await b.newContext({viewport: {width: 1440, height: 900}, ...opts});
  const p = await ctx.newPage();
  p.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text().slice(0, 160)));
  p.on('pageerror', (e) => errs.push(String(e)));
  return {ctx, p};
};

// Desktop: the hero intro ends visible; the data scene pins and ends grouped; the road pins and reaches the last stop.
{
  const {ctx, p} = await page();
  await p.goto(URL, {waitUntil: 'networkidle'});
  await p.waitForTimeout(1600);
  out.heroVisible = await p.evaluate(() => [...document.querySelectorAll('[data-intro]')].every((e) => getComputedStyle(e).opacity === '1'));
  out.introAttrGone = await p.evaluate(() => !document.documentElement.hasAttribute('data-motion-intro'));
  const panelTop = async () => p.evaluate(() => Math.round(document.querySelector('[data-count]').closest('div').getBoundingClientRect().top));
  await p.evaluate(() => document.querySelector('#data').scrollIntoView());
  await p.waitForTimeout(300);
  const t1 = await panelTop();
  await p.mouse.wheel(0, 700);
  await p.waitForTimeout(600);
  const t2 = await panelTop();
  out.dataPinned = Math.abs(t1 - t2) <= 2;
  await p.mouse.wheel(0, 2500);
  await p.waitForTimeout(900);
  out.counterFinal = await p.textContent('[data-count]');
  out.barsGrouped = await p.evaluate(() => {
    const r = document.querySelector('rect[data-bar]');
    return +r.getAttribute('height') < 360;
  });
  await p.evaluate(() => document.querySelector('#dates').scrollIntoView());
  await p.waitForTimeout(400);
  out.roadHorizontal = await p.evaluate(() => !!document.querySelector('[data-layout="horizontal"]'));
  for (let i = 0; i < 12; i++) {
    await p.mouse.wheel(0, 500);
    await p.waitForTimeout(120);
  }
  await p.waitForTimeout(800);
  out.lastStopCurrent = await p.evaluate(() => [...document.querySelectorAll('[data-stop]')].at(-1).hasAttribute('data-current'));
  await p.goto(URL + '#apply', {waitUntil: 'networkidle'});
  await p.waitForTimeout(800);
  out.applyAnchorLands = await p.evaluate(() => {
    const r = document.querySelector('#apply').getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0;
  });
  // Resize across the breakpoint: the road returns to vertical, bars stay at their final layout.
  await p.setViewportSize({width: 800, height: 900});
  await p.waitForTimeout(600);
  out.resizeReverts = await p.evaluate(() => !document.querySelector('[data-layout="horizontal"]') && document.querySelectorAll('.pin-spacer').length === 0);
  await ctx.close();
}

// Phone: no pinning; content visible after scrolling.
{
  const {ctx, p} = await page({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  await p.goto(URL, {waitUntil: 'networkidle'});
  out.phonePins = await p.evaluate(() => document.querySelectorAll('.pin-spacer').length);
  for (let y = 0; y < 12000; y += 700) {
    await p.evaluate((y) => scrollTo(0, y), y);
    await p.waitForTimeout(120);
  }
  await p.waitForTimeout(1500);
  out.phoneAllVisible = await p.evaluate(() => [...document.querySelectorAll('[data-reveal],[data-stop],[data-col]')].every((e) => +getComputedStyle(e).opacity > 0.99));
  await ctx.close();
}

// Reduced motion: no ScrollTriggers, everything visible immediately.
{
  const {ctx, p} = await page({reducedMotion: 'reduce'});
  await p.goto(URL, {waitUntil: 'networkidle'});
  out.reducedPins = await p.evaluate(() => document.querySelectorAll('.pin-spacer').length);
  out.reducedVisible = await p.evaluate(() => [...document.querySelectorAll('[data-intro],[data-reveal],[data-stop],[data-col]')].every((e) => getComputedStyle(e).opacity === '1'));
  await ctx.close();
}

// GSAP blocked: the hero is visible within 1.5s.
{
  const {ctx, p} = await page();
  await p.route(/\/assets\/js\/(?!main|runtime).*\.js$/, (r) => r.abort());
  await p.goto(URL, {waitUntil: 'domcontentloaded'});
  await p.waitForTimeout(1700);
  out.blockedHeroVisible = await p.evaluate(() => [...document.querySelectorAll('[data-intro]')].every((e) => getComputedStyle(e).opacity === '1'));
  await ctx.close();
}

console.log(JSON.stringify(out, null, 2));
console.log('console/page errors:', errs.filter((e) => !/Failed to load resource/.test(e)));
await b.close();
```

Expected:
- `true` for `heroVisible`, `introAttrGone`, `dataPinned`, `barsGrouped`, `roadHorizontal`, `lastStopCurrent`, `applyAnchorLands`, `resizeReverts`, `phoneAllVisible`, `reducedVisible` and `blockedHeroVisible`;
- `counterFinal` = `"51,461"`;
- `0` for `phonePins` and `reducedPins`;
- no errors apart from the intentionally blocked chunks.

For any failure, fix the scene or CSS, rebuild and rerun.

- [ ] **Step 3: Re-run the existing overflow and contrast checks** (`check.mjs`, `theme.mjs`) and take screenshots of the hero at 1440 and 390, the data scene mid-scroll, and the road mid-scroll. Look at them.

Expected: 12/12 overflow checks OK; the contrast check reports no failures in light and dark.

- [ ] **Step 4: Update `CLAUDE.md`.** Replace the home-page architecture bullet with:

```markdown
- The home page (`src/pages/index.tsx`) is a five-act scroll story: Hero, Objectives, Data, Road (dates, milestones and schedule as one timeline), Apply, Organizers. Anchor ids: `objectives`, `data`, `dates`, `important-dates` (first milestone), `schedule` (Day 1), `apply`, `organizers`; each is set via `useAnchor` or the anchor checker fails the build.
- Motion: GSAP + ScrollTrigger, loaded only through `useMotionScene(ref, scene)` (`src/motion/`), which runs each scene under `gsap.matchMedia` (desktop ≥997px pins and scrubs; phones reveal on enter; reduced motion runs nothing). Server HTML is always the final visible state. Only the hero hides content before animating, gated by `html[data-motion-intro]`, which a head script sets with a 1.5s fail-safe. Scenes live in `src/motion/scenes/`. The barcode's strip and grouped layouts come from the pure `src/lib/barcodeLayouts.ts` (unit-tested in `scripts/barcode.test.mjs`).
```

- [ ] **Step 5: Final full run and commit**

Run: `npm ci && npm test && npm run typecheck && npm run build && npm run test:site`
Expected: all green.

```bash
git add CLAUDE.md
git commit -m "docs: document the scroll-story motion system" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Hand off.** Report the local URLs (dev http://localhost:3001/, build http://localhost:3000/). **Do not push** until the user has reviewed it locally.
