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
