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
  // Last, so it switches off every rule that would fight Prettier.
  prettier,
);
