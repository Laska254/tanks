import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Served from laska254.github.io/tanks/
  base: '/tanks/',
  test: {
    // Tests sit next to the code they cover.
    include: ['src/**/*.test.ts'],
    // The simulation has no DOM, so tests don't get one by default.
    environment: 'node',
  },
});
