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

  // Pin only when the whole panel fits under the navbar; otherwise play once like on phones.
  const pin = conditions.desktop && root.offsetHeight <= window.innerHeight - 84;

  bars.forEach((b, i) => gsap.set(b, {attr: strip[i]}));
  gsap.set(legend, {opacity: 0});
  setCount();

  const tl = gsap.timeline(
    pin
      ? {scrollTrigger: {trigger: root, start: 'top 76px', end: '+=180%', pin: true, scrub: 0.6}}
      : {scrollTrigger: {trigger: root, start: 'top 70%', once: true}},
  );
  tl.to(n, {v: total, duration: 1, ease: pin ? 'none' : 'power2.out', onUpdate: setCount}, 0);
  bars.forEach((b, i) => tl.to(b, {attr: grouped[i], duration: 1.2, ease: 'power2.inOut'}, 0.8 + i * 0.004));
  tl.to(legend, {opacity: 1, duration: 0.4, stagger: 0.08}, '-=0.5');
  if (!pin) tl.timeScale(1.6);

  return () => {
    n.v = total;
    setCount();
  };
};
