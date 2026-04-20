import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      // Only use text and json reporters - html/lcov fail on Windows with paths containing ':'
      // These are sufficient for CI/CD and terminal viewing
      reporter: ['text', 'json'],
      exclude: [
        'node_modules/',
        'src/main.tsx',
        'src/vite-env.d.ts',
        '**/*.d.ts',
        'test/',
        '**/index.ts',
        '**/types.ts',
        // Exclude files that cause Windows path issues with special characters
        '**/__mocks__/**',
        '**/__fixtures__/**',
        'src/vite-env.d.ts'
      ],
      // Clean coverage output directory before each run
      clean: true
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})