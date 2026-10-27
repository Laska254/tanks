import { execSync } from 'node:child_process';
import { env } from 'node:process';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { PROTOCOL_VERSION } from './src/net/protocol-version';

// CI sets GITHUB_SHA. Locally, ask git. Both are cut to 7 characters so the
// same commit always gets the same hash.
function commitHash(): string {
  if (env.GITHUB_SHA) return env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
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
    // Tests sit next to the code they cover.
    include: ['src/**/*.test.ts'],
    // The simulation has no DOM, so tests don't get one by default.
    environment: 'node',
  },
});
