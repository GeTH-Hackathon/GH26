// Pure, dependency-free so node:test can import it directly (Node strips the types).
export type PageInfo = {page: number; pageCount: number; start: number; end: number};

// Clamps `page` into range; `start`/`end` are slice indexes into the result list.
export function paginate(total: number, page: number, perPage = 10): PageInfo {
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (p - 1) * perPage;
  return {page: p, pageCount, start, end: Math.min(start + perPage, total)};
}

// First, last and current ±1; a gap of a single page shows that page instead of an ellipsis.
export function pageNumbers(current: number, pageCount: number): (number | 'gap')[] {
  const shown = [...new Set([1, current - 1, current, current + 1, pageCount])]
    .filter((n) => n >= 1 && n <= pageCount)
    .sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  shown.forEach((n, i) => {
    const prev = shown[i - 1];
    if (prev !== undefined && n - prev === 2) out.push(prev + 1);
    else if (prev !== undefined && n - prev > 2) out.push('gap');
    out.push(n);
  });
  return out;
}
