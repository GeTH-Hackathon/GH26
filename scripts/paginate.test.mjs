import {test} from 'node:test';
import assert from 'node:assert/strict';
import {paginate, pageNumbers} from '../src/lib/paginate.ts';

test('first page of 118 shows rows 0–10 of 12 pages', () => {
  assert.deepEqual(paginate(118, 1), {page: 1, pageCount: 12, start: 0, end: 10});
});

test('last page is partial (rows 110–118)', () => {
  assert.deepEqual(paginate(118, 12), {page: 12, pageCount: 12, start: 110, end: 118});
});

test('out-of-range pages are clamped', () => {
  assert.equal(paginate(118, 99).page, 12);
  assert.equal(paginate(118, 0).page, 1);
  assert.equal(paginate(118, -3).page, 1);
  assert.equal(paginate(118, Number.NaN).page, 1);
});

test('empty and single-page results', () => {
  assert.deepEqual(paginate(0, 1), {page: 1, pageCount: 1, start: 0, end: 0});
  assert.deepEqual(paginate(5, 2), {page: 1, pageCount: 1, start: 0, end: 5});
});

test('page numbers: first, last, current ±1, with gaps', () => {
  assert.deepEqual(pageNumbers(1, 12), [1, 2, 'gap', 12]);
  assert.deepEqual(pageNumbers(6, 12), [1, 'gap', 5, 6, 7, 'gap', 12]);
  assert.deepEqual(pageNumbers(12, 12), [1, 'gap', 11, 12]);
  assert.deepEqual(pageNumbers(1, 1), [1]);
  assert.deepEqual(pageNumbers(2, 3), [1, 2, 3]);
});

test('a gap of exactly one page shows that page instead of an ellipsis', () => {
  assert.deepEqual(pageNumbers(4, 12), [1, 2, 3, 4, 5, 'gap', 12]);
  assert.deepEqual(pageNumbers(9, 12), [1, 'gap', 8, 9, 10, 11, 12]);
});
