import {test} from 'node:test';
import assert from 'node:assert/strict';
import {filterProjects} from '../src/lib/filterProjects.ts';

const P = [
  {id: '64-106', type: 'Research', group: 'Cancer', name: 'EGFR inhibitors in Thai lung cancer patients', wgs: 203},
  {id: '64-179', type: 'Research', group: 'Infectious Diseases', name: 'Genetic characteristics of tuberculosis patients', wgs: 532},
  {id: '709/2561 (EC3)', type: 'Research', group: 'Rare Diseases', name: 'To support cancer patient services', wgs: 313},
  {id: '00-001', type: 'Service', group: 'Rare Diseases', name: '', wgs: 13017},
];
const ids = (q) => filterProjects(P, q).map((p) => p.id);

test('empty or whitespace query returns every project in order', () => {
  assert.deepEqual(ids(''), ['64-106', '64-179', '709/2561 (EC3)', '00-001']);
  assert.deepEqual(ids('   '), ['64-106', '64-179', '709/2561 (EC3)', '00-001']);
});

test('matches name, group, type and id, ignoring case', () => {
  assert.deepEqual(ids('TUBERCULOSIS'), ['64-179']);
  assert.deepEqual(ids('infectious'), ['64-179']);
  assert.deepEqual(ids('service'), ['709/2561 (EC3)', '00-001']);
  assert.deepEqual(ids('64-1'), ['64-106', '64-179']);
});

test('every word must match (AND)', () => {
  assert.deepEqual(ids('cancer lung'), ['64-106']);
  assert.deepEqual(ids('cancer rare'), ['709/2561 (EC3)']);
});

test('ids with punctuation are searchable', () => {
  assert.deepEqual(ids('709/2561'), ['709/2561 (EC3)']);
  assert.deepEqual(ids('(ec3)'), ['709/2561 (EC3)']);
});

test('projects with an empty name are still found by other fields', () => {
  assert.deepEqual(ids('00-001'), ['00-001']);
});

test('no match returns an empty list', () => {
  assert.deepEqual(ids('zebrafish'), []);
});
