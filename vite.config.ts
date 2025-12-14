import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'src/test/**',
        'src/main.tsx',
        'src/App.tsx',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/components/ui/**', // UI components from shadcn
        'src/components/RequestConfirmationButton.tsx', // Helper utilities
        'src/components/RequestInputButton.tsx', // Helper utilities
      ],
      all: true,
      thresholds: {
        lines: 84,
        functions: 90,
        branches: 85,
        statements: 84,
      },
    },
  },
});
