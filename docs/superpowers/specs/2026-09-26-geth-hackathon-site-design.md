# GeTH Hackathon 2027 website: design spec

- Date: 2026-09-26
- Status: awaiting review
- Sources: `appendix/genomics_thailand_hackathon_brief.md`, `appendix/wgs_projects_and_volunteer_counts.txt`, the user's brainstorming answers, and a Swiss-style visual reference (the "silence." skate site).

## 1. Goal and audience

This is a static English-language site that promotes **GeTH Hackathon 2027** (Genomics Thailand Hackathon) and explains it. Its main job is to get qualified researchers, bioinformaticians, clinicians and data scientists to apply for one of about 50 seats through a Google Form.

A visitor who lands on the site should be able to:

1. understand what the event is and what data they will work with;
2. judge whether they are eligible;
3. see every deadline;
4. find the Apply button.

The event is modelled on DBCLS BioHackathon 2026 (https://2026.biohackathon.org).

**Out of scope:** Thai or any other i18n, blog, search, CMS, analytics, any individual-level data, and the grant budget table from the brief, which is internal.

## 2. Fixed facts

| Item | Value |
|---|---|
| Name | GeTH Hackathon 2027 (Genomics Thailand Hackathon) |
| Dates | Sun 7 – Fri 12 February 2027 (6 days) |
| Venue | A hotel in Chiang Mai, Thailand (exact hotel TBA). Nearest airport: Chiang Mai International (CNX) |
| Organizer | Faculty of Medicine, Chiang Mai University |
| Supported by | Health Systems Research Institute (HSRI) |
| Data partners | NSTDA (Secure Data Environment / TRE host) and Genomics Thailand |
| Application window | Opens Nov 2026 · Deadline Dec 2026 · Participants announced Jan 2027 (exact days TBA) |
| Application form | Google Form, URL TBA |
| Terms & Conditions | "Will be announced soon" |
| TRE guideline instructions | "Will be announced soon" |
| Links | https://data.genomicsthailand.com, https://2026.biohackathon.org (inspiration) |
| Hosting | GitHub Pages at the default `https://<owner>.github.io/<repo>/` |

## 3. Architecture

**Stack:** Docusaurus 3 (classic preset) with TypeScript and React 18 on Node 20+, using npm. The `docs` and `blog` plugins are disabled; only the pages plugin is used. Colour-mode switching is off and the site is light-only. `onBrokenLinks: 'throw'`.

```
docusaurus.config.ts        url/baseUrl from env (SITE_URL, BASE_URL), defaults for *.github.io
src/pages/index.tsx         one-page home, composing section components in order
src/pages/data.tsx          full project table + data-type descriptions
src/pages/terms.md          "will be announced soon"
src/pages/tre-guidelines.md "will be announced soon"
src/components/sections/    Hero, Objectives, Data, DatesVenue, ImportantDates,
                            Schedule, Apply, Organizers, Links (one file + CSS module each)
src/components/ui/          small shared pieces: SlashHeading, ApplyButton, Marquee, GenomeBarcode, TBA
src/data/event.ts           the single source of editable facts (dates, venue, formUrl, links, TBA flags)
src/data/schedule.ts        per-day agenda
src/data/wgs.json           generated; do not edit by hand
data/wgs_projects.tsv       copy of the appendix TSV used by the build
scripts/build-data.mjs      TSV → wgs.json
scripts/build-data.test.mjs node:test unit tests for the aggregation
src/css/custom.css          design tokens and global type
.github/workflows/deploy.yml
```

**Dependency rule:** section components read only from `src/data/*`. A section component never contains a date, URL or venue string. When a TBA is resolved, only `event.ts` changes.

`event.ts` shape (illustrative):

```ts
export const event = {
  name: 'GeTH Hackathon 2027',
  start: '2027-02-07', end: '2027-02-12',
  venue: { name: null, city: 'Chiang Mai', country: 'Thailand', airport: 'Chiang Mai International Airport (CNX)' },
  formUrl: null as string | null,          // null → Apply button disabled with "Applications open November 2026"
  importantDates: [
    { label: 'Applications open', date: 'November 2026', exact: false },
    { label: 'Application deadline', date: 'December 2026', exact: false },
    { label: 'Participants announced', date: 'January 2027', exact: false },
    { label: 'Hackathon', date: '7–12 February 2027', exact: true },
  ],
  links: [...], organizers: [...],
};
```

A `null` value or `exact: false` renders with a small "TBA" tag.

## 4. Visual system (Swiss, based on the reference)

- **Colour:** `--accent #FF4A1C`, `--ink #0A0A0A`, `--paper #FFFFFF`, `--mute #9A9A9A`, `--rule #E6E6E6`. No other hues. The only extra colours are the disease-group tints in the charts and barcode: six steps from accent through ink and mute.
- **Type:** Inter Tight (Google Fonts, weights 400/500/600), falling back to Helvetica Neue and Arial. Display size `clamp(4rem, 18vw, 16rem)` with letter-spacing −0.05em, set lowercase with a trailing full stop. H2 is about 4rem. Body text is 16–18px. Labels are 11px uppercase with letter-spacing +0.04em.
- **Motifs:**
  - a `/ ` prefix on every section heading;
  - a small uppercase status bar reading `FEB 7–12 2027 \ CHIANG MAI \ 50K GENOMES`;
  - hairline-divided lists;
  - black rounded panels (radius 24px) with rotated vertical captions;
  - a scrolling marquee strip;
  - ghost-grey oversized numbers such as "(51,461)";
  - `↗` on external links;
  - a black footer with a giant accent-coloured sign-off.
- **Imagery:** there are no photos yet. `GenomeBarcode` is an inline SVG built from `wgs.json`, with one vertical bar per project, width proportional to its WGS count and colour by group. It appears in the hero and on the Data panel. Real photos can replace it later without changing the layout.
- **Grid and responsiveness:** 12 columns on desktop and 4 on mobile. The side gutter is 16px on phones. There must be no horizontal page scroll at 360px width.
- **Accessibility:**
  - Accent colour is used for display type and fills only.
  - Small links are ink-coloured with an accent underline.
  - The Apply button is ink text on an accent fill.
  - Focus rings are visible.
  - The marquee stops under `prefers-reduced-motion`.
  - The barcode SVG has `role="img"` and a text summary.

## 5. Page content (home, in scroll order)

1. **Hero**
   - Status bar, the giant "geth." wordmark, the kicker "/ hackathon 2027", and the tagline "Unlocking 50,000 Thai genomes for national precision medicine."
   - Primary Apply button and a secondary "See the data ↓" link.
   - Barcode art.
2. **/ objectives.** A numbered hairline list with three items, taken from brief §3:
   - 01 Build a research community able to analyse Thailand's first 50,000 genomes.
   - 02 Stress-test a secure, no-download Trusted Research Environment at population scale.
   - 03 Produce a national Genomic Landscape Report and a prototype genomic and population dashboard.
3. **/ the data.** A black panel containing:
   - a ghost-grey "(51,461)" WGS count, and "118 projects" and "7 groups" counters;
   - a CSS bar chart of WGS by group;
   - a marquee listing `VCF · PLINK · HLA · CYP · STRUCTURAL VARIANTS · DEMOGRAPHICS`;
   - the note: "Pseudonymised. Analysed in place inside NSTDA's Secure Data Environment. No download; only aggregate results leave through an airlock review";
   - a link to `/data` and to data.genomicsthailand.com ↗.
4. **/ dates & venue.** "7–12 February 2027", "Chiang Mai, Thailand", hotel TBA, and a CNX airport note.
5. **/ important dates.** A hairline table built from `event.importantDates`, with TBA tags where days aren't exact.
6. **/ schedule.** Six day-cards (Sun 7 – Fri 12 Feb). Only times the user supplied are shown; other items appear in order with no time.
   - **Day 1, Sun 7 (Opening workshop):** 12:30 Registration opens · 13:00 Opening · Self-introduction of participants · TRE tutorial · Topic proposals & team grouping · Dinner.
   - **Days 2–5, Mon 8 – Thu 11 (Hackathon days):** 07:00–09:00 Breakfast · Hacking · 12:00 Lunch · Hacking · Dinner. These four days are shown as one "×4" card on mobile and as four cards on desktop.
   - **Day 6, Fri 12 (Wrap-up):** Breakfast · Wrap-up session · Depart from venue to CNX airport.
7. **/ apply.**
   - Who should apply: researchers, bioinformaticians, clinicians and data scientists.
   - Selection criteria from brief §5: technical skill, genomics experience, non-profit affiliation, and ability to meet data-security requirements.
   - About 50 seats.
   - Accepted participants must sign an NDA and a data-use agreement before TRE access.
   - The Apply button, plus links to Terms & Conditions and TRE guidelines, both marked "coming soon".
8. **/ organizers.** Three labelled rows: Organizer (CMU Faculty of Medicine), Supported by (HSRI), Data partners (NSTDA, Genomics Thailand). Logos go in `static/img/logos/`. Until the files are supplied, a name set in type stands in for each logo.
9. **/ links.** data.genomicsthailand.com ↗, BioHackathon 2026 ↗, Terms & Conditions, TRE guidelines.
10. **Footer.** Black background. The giant accent sign-off "see you in chiang mai.", a contact line (TBA), the links, "© 2026 Faculty of Medicine, Chiang Mai University", and "/ back to top".

**`/data`:** the headline stats, a short paragraph on each data type (VCF, PLINK, HLA, CYP, structural variants, demographics), and a sortable project table with columns ID, Type, Group, Name and WGSs. The table shows source values exactly as they are. An empty project name is displayed as "—".

**`/terms` and `/tre-guidelines`:** a slash heading, "Will be announced soon.", and a link back to the Apply section.

## 6. Data pipeline

`scripts/build-data.mjs` runs as `npm run data` and automatically before `start` and `build`. It:

- reads `data/wgs_projects.tsv`;
- checks the header matches `Project ID, Type, Group, Project Name, WGSs`;
- checks every row has 5 fields and a non-negative integer WGS value;
- **exits non-zero with the line number** on any violation, which fails the build instead of shipping wrong numbers;
- tolerates a missing trailing newline;
- writes `src/data/wgs.json` in this form:
  `{ totals: { wgs, projects, groups }, byGroup: [{ group, wgs, projects }] (sorted desc), projects: [{ id, type, group, name, wgs }] }`.

`wgs.json` is committed, so the site still renders in editors, but the build always regenerates it.

Expected values for the current file are 51,461 WGSs, 118 projects and 7 groups. These are asserted in tests.

## 7. Deployment

`.github/workflows/deploy.yml` triggers on push to `main` and on `workflow_dispatch`. It runs `actions/checkout` → `setup-node@v4` (Node 20, npm cache) → `npm ci` → `npm run build` → `actions/upload-pages-artifact` (from `build/`) → `actions/deploy-pages`.

It sets `BASE_URL=/${{ github.event.repository.name }}/` and `SITE_URL=https://${{ github.repository_owner }}.github.io`.

Pages must be set to "GitHub Actions" in the repo settings. That is a one-time manual step and is documented in the README.

## 8. Verification

- `npm run typecheck` (tsc) passes.
- `node --test scripts/` passes. The tests cover:
  - the totals above;
  - rejection of a bad column count;
  - rejection of a non-integer WGS value;
  - handling of a missing trailing newline.
- `npm run build` passes with no broken links (`onBrokenLinks: 'throw'`).
- Manual check with `npm run serve` at 360px and 1440px widths:
  - no horizontal scroll;
  - every section renders;
  - the Apply button is disabled and shows the November message while `formUrl` is null;
  - with reduced motion enabled, the marquee is still.

## 9. Open items (resolved by editing `event.ts` / assets, no code change)

- Exact application dates, hotel name, Google Form URL, and contact email.
- Organizer and partner logo files.
- Terms & Conditions and TRE guideline content (replace the two placeholder pages).
- GitHub owner/repo, which is picked up automatically by the workflow.
- The repo must be **public** for free GitHub Pages. That means `appendix/` (including the brief's budget table) would be public. The site itself only needs `data/wgs_projects.tsv`. Decide whether to commit `appendix/` or keep it untracked (default: add `appendix/` to `.gitignore`).
