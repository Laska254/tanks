import { execSync } from 'node:child_process';
import { env } from 'node:process';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { PROTOCOL_VERSION } from './src/net/protocol-version';

const HASH_LENGTH = 7;

// CI sets GITHUB_SHA. Locally, ask git. Both give the full hash, cut to the
// same length, so the same commit always gets the same short hash.
function commitHash(): string {
  try {
    const full =
      env.GITHUB_SHA ||
      execSync('git rev-parse HEAD', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    return full.slice(0, HASH_LENGTH);
  } catch {
    return 'dev';
  }
}

const hash = commitHash();
const builtAt = new Date().toISOString();

// Writes dist/version.json, so a running page can tell that a newer build is live.
function versionJson(): Plugin {
  return {
    name: 'version-json',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ hash, protocol: PROTOCOL_VERSION, builtAt }),
      });
    },
  };
}

export default defineConfig({
  // Served from laska254.github.io/tanks/
  base: '/tanks/',
  define: {
    __BUILD_HASH__: JSON.stringify(hash),
    __BUILT_AT__: JSON.stringify(builtAt),
  },
  plugins: [versionJson()],
  test: {
    // Tests go in test/, next to src/ and mirroring its layout.
    include: ['test/**/*.test.ts'],
    // The simulation has no DOM, so tests don't get one by default.
    environment: 'node',
  },
});
