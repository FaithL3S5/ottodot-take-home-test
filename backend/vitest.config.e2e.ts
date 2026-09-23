import './src/database/load-env.js';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? '' },
    globalSetup: ['./test/migrate-test-database.ts'],
    fileParallelism: false,
  },
});
