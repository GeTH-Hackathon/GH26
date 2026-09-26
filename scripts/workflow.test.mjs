import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const yml = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
const deployJob = yml.slice(yml.indexOf('\n  deploy:'));

test('deploy job only runs for main (not PRs or manual runs on other branches)', () => {
  assert.match(deployJob, /if: github\.ref == 'refs\/heads\/main' && github\.event_name != 'pull_request'/);
});

test('a running deploy on main is never cancelled by a newer push', () => {
  assert.match(yml, /cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/);
});
