import type {Scene} from '../useMotionScene';
import {revealItems} from './reveal';
import {registerAnchorResolver} from '../scrollAnchor';

// Desktop: switch to the horizontal layout, pin the section, scrub the rail sideways and advance the current stop.
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
  // Pin the whole section (heading + venue + rail) so the timeline keeps its context; skip most of the top padding.
  const section = root.closest('section') ?? root;
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      pin: section,
      start: () => `top+=${Math.max(0, parseFloat(getComputedStyle(section).paddingTop) - 32)} 64px`,
      end: () => `+=${distance() + window.innerHeight * 0.5}`,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (st) => mark(st.progress),
    },
  });
  tl.to(rail, {x: () => -distance(), ease: 'none'}, 0);
  // A deep link to a stop scrolls to the point where that stop is the current one.
  const st = tl.scrollTrigger;
  const unregister = registerAnchorResolver((el) => {
    const i = stops.indexOf(el as HTMLElement);
    if (i < 0 || !st) return null;
    return st.start + (i / Math.max(1, stops.length - 1)) * (st.end - st.start);
  });
  if (progress) tl.fromTo(progress, {scaleX: 0}, {scaleX: 1, ease: 'none'}, 0);
  return () => {
    unregister();
    root.removeAttribute('data-layout');
    stops.forEach((s) => s.removeAttribute('data-current'));
  };
};
