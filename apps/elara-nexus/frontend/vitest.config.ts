import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

const testSuite = process.env.TEST_SUITE ?? 'all'

const includeBySuite: Record<string, string[]> = {
  unit: ['src/**/*.unit.test.ts', 'src/**/*.unit.test.tsx'],
  integration: ['src/**/*.integration.test.ts', 'src/**/*.integration.test.tsx'],
  smoke: ['src/**/*.smoke.test.ts', 'src/**/*.smoke.test.tsx'],
  all: ['src/**/*.unit.test.ts', 'src/**/*.unit.test.tsx', 'src/**/*.integration.test.ts', 'src/**/*.integration.test.tsx', 'src/**/*.smoke.test.ts', 'src/**/*.smoke.test.tsx'],
}

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: includeBySuite[testSuite] ?? includeBySuite.all,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/features/**/*.tsx',
        'src/lib/api/client.ts',
        'src/lib/state/settings.ts',
        'src/routes/index.tsx',
      ],
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
})
