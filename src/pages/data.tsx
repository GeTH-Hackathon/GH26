import {useRef, useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import SlashHeading from '@site/src/components/ui/SlashHeading';
import wgs from '@site/src/data/wgs.json';
import {event} from '@site/src/data/event';
import {fmt} from '@site/src/lib/format';
import {filterProjects} from '@site/src/lib/filterProjects';
import {paginate, pageNumbers} from '@site/src/lib/paginate';
import DatasetMap from '@site/src/components/data/DatasetMap';
import styles from './data.module.css';

type Key = 'id' | 'type' | 'group' | 'name' | 'wgs';
type Sort = {key: Key; dir: 1 | -1};

const PER_PAGE = 10;

const COLUMNS: {key: Key; label: string; numeric?: boolean}[] = [
  {key: 'id', label: 'Project ID'},
  {key: 'type', label: 'Type'},
  {key: 'group', label: 'Group'},
  {key: 'name', label: 'Project name'},
  {key: 'wgs', label: 'WGSs', numeric: true},
];

export default function DataPage() {
  const [sort, setSort] = useState<Sort>({key: 'wgs', dir: -1});
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const tableRef = useRef<HTMLDivElement>(null);
  const matches = filterProjects(wgs.projects, query);
  const matchedWgs = matches.reduce((sum, p) => sum + p.wgs, 0);
  const rows = [...matches].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    const c = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return c * sort.dir || a.id.localeCompare(b.id);
  });
  const pager = paginate(rows.length, page, PER_PAGE);
  const pageRows = rows.slice(pager.start, pager.end);
  const filtered = query.trim() !== '';
  const toggle = (key: Key) => {
    setSort((s) => (s.key === key ? {key, dir: s.dir === 1 ? -1 : 1} : {key, dir: key === 'wgs' ? -1 : 1}));
    setPage(1);
  };
  // Keep the table header in view after paging (matters on phones, where the pager is far below it).
  const goTo = (n: number) => {
    setPage(n);
    const top = tableRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) tableRef.current?.scrollIntoView({block: 'start'});
  };

  return (
    <Layout title="The data" description="The 50,000 Thai whole genomes available at GeTH Hackathon 2027, by project and disease group.">
      <main className="section section--flush">
        <div className="container-swiss">
          <SlashHeading as="h1">the data</SlashHeading>
          <dl className={styles.stats}>
            <div><dt className="label">Whole genomes</dt><dd>{fmt(wgs.totals.wgs)}</dd></div>
            <div><dt className="label">Projects</dt><dd>{fmt(wgs.totals.projects)}</dd></div>
            <div><dt className="label">Disease groups</dt><dd>{fmt(wgs.totals.groups)}</dd></div>
          </dl>
          <p className={styles.note}>{event.dataNote}</p>

          <h2 className="label">Data types</h2>
          <dl className={styles.types}>
            {event.dataTypes.map((t) => (
              <div key={t.name} className={styles.type}>
                <dt>{t.name}</dt>
                <dd>{t.description}</dd>
              </div>
            ))}
          </dl>

          <h2 className="label">Dataset map</h2>
          <DatasetMap />

          <h2 className="label">Projects contributing genomes</h2>
          <p className={styles.caption}>Values as recorded by Genomics Thailand. Search, or select a column heading to sort.</p>
          <div className={styles.search}>
            <label htmlFor="project-search" className="label">Search projects</label>
            <input
              id="project-search"
              type="search"
              className={styles.searchInput}
              placeholder="e.g. tuberculosis, pharmacogenomics, 64-1"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              autoComplete="off"
            />
            <p className={styles.status} aria-live="polite">
              {rows.length === 0
                ? `Showing 0 of ${wgs.totals.projects} projects`
                : `Showing ${pager.start + 1}–${pager.end} of ${rows.length} ${filtered ? 'matching ' : ''}projects`}
              {' · '}
              {fmt(matchedWgs)} genomes
            </p>
          </div>
          <div className={styles.tableWrap} ref={tableRef}>
            <table className={styles.table}>
              <caption className="sr-only">Projects contributing whole genomes to Genomics Thailand, with WGS counts</caption>
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      className={c.numeric ? styles.num : undefined}
                      aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                      <button type="button" className={styles.sortBtn} onClick={() => toggle(c.key)}>
                        {c.label}
                        {sort.key === c.key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.empty}>No projects match “{query.trim()}”.</td>
                  </tr>
                )}
                {pageRows.map((p, i) => (
                  <tr key={`${p.id}-${i}`} data-row="project">
                    <td>{p.id}</td>
                    <td>{p.type}</td>
                    <td>{p.group}</td>
                    <td>{p.name || '—'}</td>
                    <td className={styles.num}>{fmt(p.wgs)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={4}>{query.trim() ? 'Total (filtered)' : 'Total'}</th>
                  <td className={styles.num}>{fmt(matchedWgs)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {pager.pageCount > 1 && (
          <nav className={styles.pager} aria-label="Project table pages">
            <button type="button" className={styles.pageStep} disabled={pager.page === 1} onClick={() => goTo(pager.page - 1)}>← Previous</button>
            <ol className={styles.pages}>
              {pageNumbers(pager.page, pager.pageCount).map((n, i) =>
                n === 'gap' ? (
                  <li key={`gap-${i}`} className={styles.gap} aria-hidden="true">…</li>
                ) : (
                  <li key={n}>
                    <button
                      type="button"
                      className={styles.pageNum}
                      aria-current={n === pager.page ? 'page' : undefined}
                      aria-label={`Page ${n}`}
                      onClick={() => goTo(n)}>{n}</button>
                  </li>
                ),
              )}
            </ol>
            <button type="button" className={styles.pageStep} disabled={pager.page === pager.pageCount} onClick={() => goTo(pager.page + 1)}>Next →</button>
            <span className={styles.pageOf}>Page {pager.page} of {pager.pageCount}</span>
          </nav>
        )}
        <p><Link to="/#apply">How to apply →</Link></p>
        </div>
      </main>
    </Layout>
  );
}
