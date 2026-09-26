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
