# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repo (`GeTH-hackathon-web`, README title "GH26") is at its starting point: there is no application code, build system, package manifest, linter, or test suite yet. When a stack is chosen, add its build, dev-server, lint, and single-test commands here.

The only content is reference material in `appendix/`:

- `appendix/genomics_thailand_hackathon_brief.md`: condensed English brief of the HSRI-funded **Genomics Thailand Hackathon** (FY2026 / B.E. 2569). Host: Chiang Mai University, Faculty of Medicine. Data partner: NSTDA. It is a 6-day event in Chiang Mai with about 50 participants analysing the first ~50,000 Thai whole-genome sequences. Deliverables: a Genomic Landscape Report, a prototype analytics dashboard, and a research network. The brief is the source of truth for event facts (objectives, timeline, governance, budget, risks).
- `appendix/wgs_projects_and_volunteer_counts.txt`: tab-separated table. Columns: `Project ID`, `Type` (Research/Service), `Group`, `Project Name`, `WGSs`. It has 118 data rows totalling 51,461 WGSs. Groups are Cancer, Rare Diseases, Pharmacogenomics, NCD, Infectious Diseases, Popgen, and Non-Rare & Non-Cancer. The last line has no trailing newline, so `wc -l` undercounts by one.
  - Data quirks to keep in mind: one Project ID is not in `YY-NNN` form (`709/2561 (EC3)`). Some `Group` values contradict the project name (e.g. `709/2561 (EC3)` and `00-000`). The `00-001` Service row has an empty name and holds the largest count (13,017).

## Domain constraints that shape anything built here

- All real genomic analysis happens inside NSTDA's Secure Data Environment, which allows no data egress. Only aggregate, non-identifiable results leave it, and only through an airlock review. Any website or dashboard in this repo must therefore work with **aggregate/summary data only**. Never design features that ingest, store, or display individual-level genomic or participant data.
- The project-level counts in `appendix/` are already aggregate and are fine to publish or visualise.
- The public site is English only (decided 2026-09-26); no i18n.
