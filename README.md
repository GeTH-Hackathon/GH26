# GH26: GeTH Hackathon 2027 website

Static site for **GeTH Hackathon 2027** (Genomics Thailand Hackathon, 7–12 February 2027, Chiang Mai). It is built with [Docusaurus](https://docusaurus.io) and deployed to GitHub Pages.

## Develop

```bash
npm install
npm start            # dev server at http://localhost:3000/GH26/
npm test             # data-pipeline unit tests
npm run build        # regenerates src/data/wgs.json, then builds to build/
npm run test:site    # checks the built HTML (run after build)
npm run typecheck
```

## Updating content

- **Dates, venue, Google Form URL, contact, partners, links:** edit `src/data/event.ts` only. Setting `formUrl` turns the disabled Apply button into a live link. A `null` value or `exact: false` shows a TBA tag.
- **Schedule:** `src/data/schedule.ts`.
- **Genome counts:** replace `data/wgs_projects.tsv` (tab-separated, header `Project ID	Type	Group	Project Name	WGSs`). The build fails with a line number if a row is malformed.
- **Logos:** put the files in `static/img/logos/` and set `logo: '/img/logos/<file>'` on the partner in `event.ts`.
- **Terms & Conditions / TRE guidelines:** edit `src/pages/terms.md` and `src/pages/tre-guidelines.md`.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which tests, builds and publishes to `https://<owner>.github.io/<repo>/`. One-time setup: **Settings → Pages → Source: GitHub Actions**. Free GitHub Pages requires a public repo.
