import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

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
              message:
                'Use the Transport interface. Only src/net/trystero-transport.ts imports Trystero.',
            },
          ],
        },
      ],
    },
  },
  // Last, so it switches off every rule that would fight Prettier.
  prettier,
);
