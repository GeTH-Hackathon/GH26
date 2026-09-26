# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                         # dev server (runs `npm run data` first) at http://localhost:3000/
npm run build                     # regenerates src/data/wgs.json, builds to build/
npm test                          # unit tests for scripts/build-data.mjs (node:test)
node --test --test-name-pattern="CRLF" scripts/build-data.test.mjs   # single test
npm run build && npm run test:site   # assertions on built HTML (scripts/site.test.mjs)
npm run typecheck
```

## Architecture

- Docusaurus 3.10 with only the pages plugin (docs and blog disabled) and `future.v4` (Docusaurus Faster, so `@docusaurus/faster` is required). `baseUrl` comes from `BASE_URL` (default `/`) and `url` from `SITE_URL` (default `https://gh27.bat.or.th`, the GitHub Pages custom domain; DNS is a Cloudflare CNAME to `geth-hackathon.github.io`). `trailingSlash: true`, and both `onBrokenLinks` and `onBrokenAnchors` are `'throw'`.
- The home page (`src/pages/index.tsx`) is a stack of section components in `src/components/sections/`. Each section has an anchor id (`objectives`, `data`, `dates`, `important-dates`, `schedule`, `apply`, `organizers`, `links`) that the navbar and tests rely on. A section's id must be set with `id={useAnchor('x')}` (`src/lib/useAnchor.ts`), or the anchor checker fails the build.
- **All editable facts** (dates, venue, form URL, partners, links, copy) live in `src/data/event.ts`, and the agenda lives in `src/data/schedule.ts`. Sections must not hard-code these. `formUrl: null` renders a disabled Apply button.
- Data flow: `data/wgs_projects.tsv` → `scripts/build-data.mjs` then `scripts/build-graph.mjs` (both run as prestart/prebuild; the graph uses `data/graph-topics.json` and a seeded d3-force layout, written to `src/data/graph.json`) → `src/data/wgs.json` (committed, but regenerated on every build). Both the barcode art and the `/data` table read it. The `/data` search uses the pure `src/lib/filterProjects.ts`, which `scripts/filter.test.mjs` imports directly (Node strips the types, so keep that file free of imports and non-erasable TS syntax). Tests pin the current totals (51,461 / 118 / 7 groups); a data refresh must update those expectations in both test files, and any new group must be added to `src/data/groups.ts`.
- Light/dark theme: all colours are CSS tokens in `src/css/custom.css` (`:root` for light, `html[data-theme='dark']` for dark). Never hard-code a grey in a component; a site test fails on the known literals. The Data panel (`--panel-*`) and footer (`--footer-*`) are always-dark surfaces, and text on accent fills uses `--on-accent`.
- The footer is swizzled at `src/theme/Footer/`. Design tokens and shared classes (`container-swiss`, `section`, `slash-heading`, `btn`, `tba`, `label`) are in `src/css/custom.css`.
- `scripts/site.test.mjs` normalises the minified HTML: it strips `<!-- -->`, restores attribute quotes and decodes `&amp;`. The swc minifier drops optional end tags (`</p>`, `</li>`, `</td>`), so assertions must not rely on them.
- Deploy: `.github/workflows/deploy.yml` runs tests and the build (for `https://gh27.bat.or.th/`), then deploys with `actions/deploy-pages`.

## Reference material

`appendix/` is git-ignored because the repo is public and the brief contains internal budget data. It holds:

- `appendix/genomics_thailand_hackathon_brief.md`: the grant brief and source of event facts. The site intentionally omits the budget.
- `appendix/wgs_projects_and_volunteer_counts.txt`: the original of `data/wgs_projects.tsv`. It has 118 rows totalling 51,461 WGSs. Quirks: the ID `709/2561 (EC3)`, group labels that contradict project names (`709/2561 (EC3)`, `00-000`), and `00-001` has an empty name and the largest count (13,017). The site shows these rows as-is.

## Domain constraints that shape anything built here

- All real genomic analysis happens inside NSTDA's Secure Data Environment, which allows no data egress. Only aggregate, non-identifiable results leave it, and only through an airlock review. Any website or dashboard in this repo must therefore work with **aggregate/summary data only**. Never design features that ingest, store, or display individual-level genomic or participant data.
- The project-level counts in `data/wgs_projects.tsv` are already aggregate and are fine to publish or visualise.
- The public site is English only (decided 2026-09-26); no i18n.
