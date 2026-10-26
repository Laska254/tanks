// Runs Prettier over the repo, also skipping files in git's local exclude list.
// `git rev-parse` finds that list in linked worktrees too, where `.git` is a file.
import { execFileSync, spawnSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const excludePath = execFileSync('git', ['rev-parse', '--git-path', 'info/exclude'], {
  encoding: 'utf8',
}).trim();
const prettierBin = fileURLToPath(import.meta.resolve('prettier/bin/prettier.cjs'));

const { status } = spawnSync(
  process.execPath,
  [
    prettierBin,
    ...process.argv.slice(2),
    '.',
    '--ignore-path',
    '.gitignore',
    '--ignore-path',
    '.prettierignore',
    '--ignore-path',
    excludePath,
  ],
  { stdio: 'inherit' },
);
process.exit(status ?? 1);
