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
