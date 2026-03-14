import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['./tests/globalSetup.ts'],
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts', 'composables/**/*.ts'],
      exclude: ['server/utils/prisma.ts'],
      thresholds: { lines: 50, functions: 50, branches: 50 },
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, '.'),
    },
  },
})
