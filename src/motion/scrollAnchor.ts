// Keeps scroll position meaningful while pinned scenes change the page's length:
// - deep links (#apply, #schedule, …) are re-applied after the scenes have measured themselves;
// - same-page hash links scroll to the right place (a pinned timeline stop maps to its scroll position);
// - crossing a breakpoint (matchMedia revert + refresh) or reloading keeps the reader on the same section.
import type {SceneContext} from './useMotionScene';

type ST = SceneContext['ScrollTrigger'];
type Anchor = {id: string; fraction: number};
type Resolver = (el: Element) => number | null;

const NAV = 60; // sticky navbar height
const KEY = 'geth-scroll-anchor';
const resolvers = new Set<Resolver>();

/** Lets a scene map an element inside it (e.g. a timeline stop) to an exact scroll position. */
export function registerAnchorResolver(fn: Resolver): () => void {
  resolvers.add(fn);
  return () => {
    resolvers.delete(fn);
  };
}

const sections = () => Array.from(document.querySelectorAll<HTMLElement>('main > header, main section[id]'));
// A pinned element sits inside a .pin-spacer, which is what actually scrolls with the page.
const box = (el: Element) => (el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el).getBoundingClientRect();
const idOf = (el: HTMLElement) => el.id || '__hero';
const byId = (id: string) => (id === '__hero' ? document.querySelector('main > header') : document.getElementById(id));

function currentAnchor(): Anchor | null {
  for (const s of sections()) {
    const r = box(s);
    if (r.top <= NAV + 1 && r.bottom > NAV + 1) return {id: idOf(s), fraction: (NAV - r.top) / r.height};
  }
  return null;
}

function yForAnchor(a: Anchor): number | null {
  const el = byId(a.id);
  if (!el) return null;
  const r = box(el);
  return window.scrollY + r.top + a.fraction * r.height - NAV;
}

function yForHash(hash: string): number | null {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  const el = id && document.getElementById(id);
  if (!el) return null;
  for (const resolve of resolvers) {
    const y = resolve(el);
    if (y != null) return y;
  }
  return window.scrollY + box(el).top - NAV;
}

const jump = (y: number | null, smooth = false) => {
  if (y == null) return;
  window.scrollTo({top: Math.max(0, Math.round(y)), behavior: smooth ? 'smooth' : 'instant'});
};

let users = 0;
let uninstall: (() => void) | undefined;

/** Reference-counted: the first scene installs the listeners, the last one to unmount removes them. */
export function installScrollAnchor(ScrollTrigger: ST): () => void {
  users += 1;
  if (users === 1) uninstall = install(ScrollTrigger);
  return () => {
    users -= 1;
    if (users === 0) uninstall?.();
  };
}

function install(ScrollTrigger: ST): () => void {
  const path = location.pathname;
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  let stored: Anchor | null = null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (saved?.path === path && (nav?.type === 'reload' || nav?.type === 'back_forward')) stored = saved.anchor;
  } catch {
    /* storage unavailable */
  }
  const initialHash = location.hash;
  // The initial target (hash or restored section) is re-applied on each refresh while the page settles,
  // until the visitor scrolls themselves: later refreshes can still change the pin spacers' lengths.
  let pendingInitial = Boolean(initialHash || stored);
  const settleUntil = performance.now() + 4000;
  const onUserIntent = () => {
    pendingInitial = false;
  };
  let anchor: Anchor | null = null;
  let frozen = false; // true from a resize until the following refresh has restored the position
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const previousRestoration = history.scrollRestoration;
  history.scrollRestoration = 'manual';

  const onScroll = () => {
    if (frozen || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      anchor = currentAnchor() ?? anchor;
    });
  };
  const onResize = () => {
    if (!frozen) anchor = currentAnchor() ?? anchor;
    frozen = true;
  };
  // Runs after every ScrollTrigger.refresh; debounced so the last refresh (all scenes built, fonts in) wins.
  const onRefresh = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (pendingInitial && performance.now() < settleUntil) {
        jump(initialHash ? yForHash(initialHash) : stored ? yForAnchor(stored) : null);
      } else if (frozen && anchor) {
        jump(yForAnchor(anchor));
      }
      frozen = false;
      anchor = currentAnchor() ?? anchor;
    }, 120);
  };
  // Same-page hash links: take over from the browser/router so pinned scenes can map the target.
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href*="#"]') as HTMLAnchorElement | null;
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    const y = yForHash(url.hash);
    if (y == null) return;
    e.preventDefault();
    history.pushState(history.state, '', url.hash);
    jump(y, true);
  };
  const onPageHide = () => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({path, anchor: currentAnchor() ?? anchor}));
    } catch {
      /* storage unavailable */
    }
  };

  window.addEventListener('scroll', onScroll, {passive: true});
  for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) window.addEventListener(type, onUserIntent, {passive: true});
  window.addEventListener('resize', onResize);
  window.addEventListener('pagehide', onPageHide);
  document.addEventListener('click', onClick, true);
  ScrollTrigger.addEventListener('refresh', onRefresh);
  return () => {
    window.removeEventListener('scroll', onScroll);
    for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const) window.removeEventListener(type, onUserIntent);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pagehide', onPageHide);
    document.removeEventListener('click', onClick, true);
    ScrollTrigger.removeEventListener('refresh', onRefresh);
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    history.scrollRestoration = previousRestoration;
  };
}
