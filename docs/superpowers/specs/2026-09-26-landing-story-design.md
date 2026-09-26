# Landing page redesign: "the data tells the story"

- Date: 2026-09-26
- Status: awaiting review
- Builds on: `PRODUCT.md` (brand register; credibility, excitement to hack, clarity; anti-reference: startup SaaS landing), `DESIGN.md` ("The Genome Poster"), the home-page critique of 2026-09-26 (23/40), and the user's choices in brainstorming: direction **B** (scroll-driven data story), **pinned scenes on desktop, simple stacked story on phones**, **GSAP + ScrollTrigger**.

## 1. Goal

Make the home page more animated and more memorable while staying credible and readable. The data carries the story: one genome barcode becomes the thread from the hero into the dataset, then into the week in Chiang Mai, ending on a clear Apply moment with the deadline. Success means a first-time visitor on desktop remembers the barcode regrouping and the timeline, and every visitor (phone, reduced motion, no JavaScript) still gets the complete content and can apply in one tap from the hero.

**Out of scope:** changes to `/data`, `/terms`, `/tre-guidelines`; new facts not yet supplied (cost, travel, accommodation, contact email); dark-mode redesign (tokens already cover it); WebGL/canvas.

## 2. Page structure (scroll order)

| Act | Section id(s) | Desktop (≥997px, motion allowed) | Phone (<997px, motion allowed) | Reduced motion / no JS |
|---|---|---|---|---|
| 1 Hero | (header) | Load choreography, about 1.2s | Same choreography, shorter distances | Static, fully visible |
| 2 Why | `objectives` | Stagger reveal on enter | Same | Static |
| 3 The data | `data` | **Pinned**, scrubbed 4-step scene | Each step reveals inline on enter | Static final state (grouped chart) |
| 4 Road to Chiang Mai | `dates`, `important-dates`, `schedule` | **Pinned** horizontal timeline, scrubbed | Vertical timeline, items reveal on enter | Static vertical timeline |
| 5 Apply | `apply`, then `organizers` | Finale reveal on enter | Same | Static |
| Footer | | unchanged | unchanged | unchanged |

The **Links** section is removed; its links already live in the footer (external links, Terms, TRE guidelines, data). All other anchors keep working; `#dates`, `#important-dates` and `#schedule` land on the corresponding part of Act 4. The navbar keeps its items; the "Dates & Venue" and "Schedule" links both go into Act 4.

### Act 1: Hero
- Order on load: status line fades in (0ms) → "GeTH" then "Hackathon" rise from a clip mask (each 700ms, ease-out-expo, 90ms apart) → tagline and buttons fade up 12px (500ms) → barcode bars scale up from the baseline left to right (total 600ms, per-bar stagger derived from position). Total ≤ 1.2s.
- The primary action gains its deadline: the Apply button is followed by the line **"Apply by December 2026 · Results January 2027"**, read from `event.importantDates`.
- Tagline copy changes (the critique flagged "Unlocking" as a banned buzzword). Stored in `event.tagline`; the user chose **"Unlocking 50k Thai Genomes for National Precision Medicine."** (2026-09-27)
- The status-line "Apply ↗" in-page link loses the external-link arrow and becomes "Apply ↓".

### Act 2: Why (Objectives)
- Content unchanged (intro paragraphs + five objectives). On enter: paragraphs fade up (400ms), then objectives stagger 80ms apart (500ms each, 16px travel, ease-out-quint). Numbers 01–05 are kept (the list is a real sequence of goals).

### Act 3: The data (pinned on desktop)
Stage: the existing always-dark panel. One SVG barcode with 118 bars and two computed layouts:
- **Strip layout:** the current barcode arrangement (bars side by side, width ∝ WGS, grouped by disease group).
- **Grouped layout:** seven columns, one per disease group (largest first), each column a stack of its projects' bars whose heights ∝ WGS, column labels with group name and total, same group tint as the strip.

Scroll steps (desktop pins the panel for about 3 viewport heights of scroll; progress is scrubbed):
1. Strip visible; the headline counter counts from 0 to **51,461** genomes; "118 projects · 7 disease groups" appears.
2. Bars move from strip to grouped layout (each bar tweens x, y, width, height); column labels fade in as their bars arrive. The grouped chart is the colour legend.
3. The six data types appear as a 2×3 (desktop) / 1-column (phone) list of name + one-line description (from `event.dataTypes`), replacing the marquee.
4. The governance note and the two links ("Explore all 118 projects" → `/data`, the data portal) fade in.

The previous ghost number "(51,461)" and the duplicate counter row are removed (critique: hero-metric pattern). The bar chart of group totals is replaced by the grouped barcode. The `Marquee` component is removed from the home page.

Phone: no pin. The strip shows, then regroups once when the panel scrolls into view (1s, ease-in-out-cubic), then steps 3–4 reveal inline. Reduced motion / no JS: the grouped layout, data-type list and note are shown statically.

### Act 4: The road to GeTH Hackathon 2027 (pinned on desktop; heading chosen by the user 2026-09-27)
One timeline replaces Dates & venue, Important dates and Schedule:
- **Milestones:** Applications open (November 2026) → Application deadline (December 2026) → Participants announced (January 2027) → the six event days (Sun 7 – Fri 12 February 2027), each day showing its title and agenda items (from `schedule.ts`). TBA tags stay on inexact dates.
- **Venue block** at the start: "Chiang Mai, Thailand · hotel to be announced · nearest airport CNX".
- **Desktop:** the section pins; vertical scroll moves the track horizontally (transform only) and a vermilion progress line with a marker advances; the day under the marker is highlighted (ink border, full opacity) and others are muted.
- **Phone / reduced motion / no JS:** the same content as a vertical timeline (hairline spine, milestone dots); on phones items reveal on enter.
- The four identical hacking-day cards become one timeline stretch "Days 2–5 · Mon 8 – Thu 11 Feb · Hacking" with the shared agenda shown once (critique: identical cards).

### Act 5: Apply finale
- The existing Apply layout (headings, roles line, boxed notice, criteria, CTA first on phones) is kept. Added on enter: the section heading and lead fade up; the Apply button gets the same deadline line as the hero.
- Organizers section unchanged apart from a stagger reveal.

## 3. Motion system (implementation shape)

- **Dependency:** `gsap` (^3.15, standard no-charge licence) with `ScrollTrigger`. Imported dynamically inside a client effect, only from home-page components, so other routes do not load it.
- **`src/motion/useMotionScene.ts`:** `useMotionScene(ref, build)`. It loads GSAP + ScrollTrigger, creates `gsap.matchMedia()` with conditions `desktop: (min-width: 997px) and (prefers-reduced-motion: no-preference)` and `phone: (max-width: 996px) and (prefers-reduced-motion: no-preference)`, calls `build({gsap, ScrollTrigger, root, conditions})`, and reverts on unmount.
- **Scene files** in `src/motion/scenes/`: `heroIntro.ts`, `reveal.ts` (generic stagger for Acts 2 and 5), `dataScene.ts`, `roadScene.ts`. Each exports one `build` function.
- **`src/lib/barcodeLayouts.ts`:** pure function `barcodeLayouts(projects, {width, height})` → `{strip: Rect[], grouped: Rect[], columns: {group, x, width, total}[]}` in the same bar order. No imports (so `node --test` can import it, like `filterProjects.ts`).
- **Visible by default:** server HTML renders the final state. For the hero only, a small inline head script adds `html.motion-intro` when `prefers-reduced-motion` is not `reduce`; CSS hides the hero parts under that class; the intro scene removes the class when it starts; a 1500ms timeout in the same head script removes it regardless (fail-safe: slow or failed JS never leaves a blank hero). Scroll scenes never hide content before GSAP has taken over (they set start states themselves).
- **Timing:** hero 400–700ms per element, ease-out-expo, ≤1.2s total; scroll scenes scrubbed (`scrub: 0.6`); hover/colour 150ms `ease`; button press `scale(0.97)` under `@media (hover: hover) and (pointer: fine)`; nothing animates layout properties except the barcode SVG rect attributes.
- **Stability:** pinned scenes use ScrollTrigger pin spacers (no layout shift after load); `ScrollTrigger.refresh()` after fonts load.

## 4. Testing and verification

- **Unit (`node:test`):** `barcodeLayouts`: 118 bars in both layouts; strip bars stay inside the width and do not overlap; grouped columns are ordered by total, one per group, with heights ∝ WGS inside the height; the same project index maps to the same bar in both layouts.
- **Site tests (built HTML):**
  - Every retained anchor id still present; `id="links"` gone and its links still in the footer.
  - Server HTML is the final visible state: no inline `opacity:0` / `visibility:hidden` styles in `index.html`.
  - The head script with the 1500ms fail-safe is present; `motion-intro` is not baked into the server HTML's `<html>` class.
  - Hero shows the deadline line and the new tagline; "Unlocking" is gone.
  - The data panel contains the grouped barcode (118 bars, 7 labelled columns) and the six data-type descriptions; no marquee on the home page.
  - The timeline contains all milestones and six days' agendas in order.
  - `/data/index.html` and `/terms/index.html` do not load the GSAP chunk.
- **Browser (Playwright, scratch scripts):**
  - Desktop 1440: the data and road scenes pin (the section's top stays fixed across a scroll range), bars end in the grouped layout at scene end, the timeline marker reaches Friday.
  - Phone 390: no pinning; each act's content visible after scrolling to it.
  - `reducedMotion: 'reduce'`: no GSAP triggers created; all content visible immediately.
  - GSAP chunk blocked: hero visible within 1.5s; page fully readable.
  - No console errors or hydration warnings; no horizontal overflow at 360/768/1440; AA contrast in light and dark (existing contrast script).
- The existing unit and site tests keep passing, except tests for removed elements (Links section, marquee, old schedule cards), which are replaced by the tests above.
