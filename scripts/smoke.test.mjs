// Browser smoke tests for the home-page motion (runs locally, not in CI).
// Needs a served build and system Chrome:  npm run build && npm run serve  (then)  npm run test:smoke
// Override the URL with SMOKE_URL.
import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const URL = (process.env.SMOKE_URL ?? 'http://localhost:3000/').replace(/\/?$/, '/');
let browser;
before(async () => {
  browser = await chromium.launch({channel: 'chrome'});
});
after(async () => {
  await browser?.close();
});

async function open(path = '', viewport = {width: 1440, height: 900}, opts = {}) {
  const ctx = await browser.newContext({viewport, ...opts});
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL + path, {waitUntil: 'networkidle'});
  await page.waitForTimeout(1800); // intro + fonts-ready refresh + any position restore
  return {ctx, page, errors};
}
const rect = (page, sel) => page.evaluate((s) => {
  const r = document.querySelector(s).getBoundingClientRect();
  return {top: r.top, bottom: r.bottom, left: r.left, right: r.right, vw: innerWidth, vh: innerHeight};
}, sel);
const inView = (r) => r.top < r.vh && r.bottom > 60 && r.left < r.vw && r.right > 0;

test('desktop deep link #apply lands on the Apply section', async () => {
  const {ctx, page, errors} = await open('#apply');
  const r = await rect(page, '#apply');
  assert.ok(r.top >= -5 && r.top < 200, `apply top at ${Math.round(r.top)}`);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('desktop deep link #schedule shows Day 1 on screen, as the current stop', async () => {
  const {ctx, page} = await open('#schedule');
  const r = await rect(page, '#schedule');
  assert.ok(inView(r), `Day 1 off screen: ${JSON.stringify(r)}`);
  assert.equal(await page.evaluate(() => document.querySelector('#schedule').hasAttribute('data-current')), true);
  await ctx.close();
});

test('navbar Schedule link never scrolls the timeline rail sideways (scrollLeft stays 0)', async () => {
  const {ctx, page} = await open();
  await page.click('a.navbar__link:has-text("Schedule")');
  await page.waitForTimeout(1500);
  const left = await page.evaluate(() => document.querySelector('[data-rail]').parentElement.scrollLeft);
  assert.equal(left, 0);
  assert.ok(inView(await rect(page, '#schedule')), 'Day 1 not on screen after clicking Schedule');
  await ctx.close();
});

for (const vp of [{width: 1280, height: 720}, {width: 1366, height: 768}, {width: 1440, height: 900}]) {
  test(`data panel pins and fits the viewport at ${vp.width}x${vp.height}`, async () => {
    const {ctx, page} = await open('', vp);
    await page.evaluate(() => document.querySelector('#data').scrollIntoView());
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(900);
    const r = await page.evaluate(() => {
      const panel = document.querySelector('[data-count]').closest('div');
      const b = panel.getBoundingClientRect();
      const legend = document.querySelector('[data-col]:last-child').getBoundingClientRect();
      return {panelBottom: b.bottom, legendBottom: legend.bottom, vh: innerHeight, pinned: !!panel.closest('.pin-spacer'), top: b.top};
    });
    assert.ok(r.pinned && Math.abs(r.top - 76) < 2, `panel not pinned under the navbar (pinned=${r.pinned}, top=${Math.round(r.top)})`);
    assert.ok(r.panelBottom <= r.vh, `pinned panel cut off: bottom ${Math.round(r.panelBottom)} > ${r.vh}`);
    await ctx.close();
  });
}

test('dimmed (non-current) timeline text keeps AA contrast in light and dark', async () => {
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({viewport: {width: 1440, height: 900}});
    await ctx.addInitScript((t) => localStorage.setItem('theme-097', t), theme);
    const page = await ctx.newPage();
    await page.goto(URL, {waitUntil: 'networkidle'});
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelector('#dates').scrollIntoView());
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(900);
    const worst = await page.evaluate(() => {
      const parse = (c) => c.match(/[\d.]+/g).map(Number);
      const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
      const bg = parse(getComputedStyle(document.body).backgroundColor);
      let min = 99;
      for (const stop of document.querySelectorAll('[data-stop]:not([data-current])')) {
        const op = +getComputedStyle(stop).opacity;
        for (const el of stop.querySelectorAll('p, h3, li span')) {
          if (!el.textContent.trim()) continue;
          const c = parse(getComputedStyle(el).color);
          const a = (c[3] ?? 1) * op;
          const mixed = [0, 1, 2].map((i) => c[i] * a + bg[i] * (1 - a));
          const L1 = lum(mixed), L2 = lum(bg);
          min = Math.min(min, (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05));
        }
      }
      return min;
    });
    assert.ok(worst >= 4.5, `${theme}: dimmed stop text at ${worst.toFixed(2)}:1`);
    await ctx.close();
  }
});

test('crossing the 997px breakpoint keeps the reader where they were', async () => {
  const {ctx, page} = await open('#apply');
  await page.setViewportSize({width: 800, height: 900});
  await page.waitForTimeout(1500);
  assert.ok(inView(await rect(page, '#apply')), 'lost position after resize');
  await ctx.close();
});

test('reloading mid-page returns to the same section', async () => {
  const {ctx, page} = await open();
  await page.evaluate(() => document.querySelector('#organizers').scrollIntoView());
  await page.waitForTimeout(600);
  await page.reload({waitUntil: 'networkidle'});
  await page.waitForTimeout(1800);
  const r = await rect(page, '#organizers');
  assert.ok(r.top > -200 && r.top < 300, `organizers at ${Math.round(r.top)} after reload`);
  await ctx.close();
});

test('reduced motion: no pins and nothing hidden', async () => {
  const {ctx, page} = await open('', {width: 1440, height: 900}, {reducedMotion: 'reduce'});
  const r = await page.evaluate(() => ({
    pins: document.querySelectorAll('.pin-spacer').length,
    hidden: [...document.querySelectorAll('[data-intro],[data-reveal],[data-stop],[data-col]')].filter((e) => getComputedStyle(e).opacity !== '1').length,
  }));
  assert.deepEqual(r, {pins: 0, hidden: 0});
  await ctx.close();
});
