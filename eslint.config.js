import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const TRYSTERO_ONLY_IN_ADAPTER =
  'Use the Transport interface. Only src/net/trystero-transport.ts imports Trystero.';

// Every browser global, plus the ways around them (`globalThis.document`) and
// the clock. The sim may still clone data and log while debugging.
const SIM_ALLOWED_GLOBALS = new Set(['structuredClone', 'console']);
const SIM_FORBIDDEN_GLOBALS = [
  ...Object.keys(globals.browser).filter((name) => !SIM_ALLOWED_GLOBALS.has(name)),
  'globalThis',
  'Date',
];

export default defineConfig(
  { ignores: ['dist/'] },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Plain JS config files aren't part of tsconfig, so type-aware rules can't run on them.
  { files: ['**/*.js'], extends: [tseslint.configs.disableTypeChecked] },
  // The game talks to the network only through src/net/transport.ts.
  {
    ignores: ['src/net/trystero-transport.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['trystero', 'trystero/*', '@trystero-p2p/*'],
              message: TRYSTERO_ONLY_IN_ADAPTER,
            },
          ],
        },
      ],
      // no-restricted-imports doesn't see dynamic import().
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression[source.value=/^(trystero|@trystero-p2p)/]',
          message: TRYSTERO_ONLY_IN_ADAPTER,
        },
      ],
    },
  },
  // The simulation is pure: the same world and inputs always give the same
  // next world, on host and guest alike. So no browser, clock or randomness.
  {
    files: ['src/sim/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...SIM_FORBIDDEN_GLOBALS.map((name) => ({
          name,
          message: 'src/sim/ is pure logic: pass time and inputs in through step().',
        })),
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Use the seeded PRNG in src/sim/rng.ts, so runs can be replayed.',
        },
      ],
    },
  },
  // Last, so it switches off every rule that would fight Prettier.
  prettier,
);
