# src

Published source for the `react-actions-chat` package, including public exports, UI components, types, stores, and generated distributable CSS.

## Directories

- `__tests__/`: Vitest coverage for package behavior, stores, and example-backed flows.
- `components/`: React components and button helpers that make up the chat UI API.
- `js/`: Public TypeScript types and small cross-package helpers.
- `lib/`: Internal Zustand stores, theme helpers, and utility functions exported by the package.

## Files

- `index.css`: Tailwind source stylesheet used to generate the package's standalone CSS.
- `index.ts`: Main public entry point that re-exports components, types, and helpers.
- `styles.css`: Built CSS bundle generated from `index.css` and Tailwind.
  Rules:
  - Regenerate it with the style build script instead of hand-editing.
- `vite-plugin.d.ts`: Type declarations for the published Vite dedupe plugin entry point.
- `vite-plugin.js`: Vite plugin that deduplicates React packages when this library is consumed.

## Writing Rules

- When adding or removing a public API under `src`, update `src/index.ts` and any affected nested barrels in the same change so the package export surface stays synchronized.
- Follow inherited AGENTS.md guidance when applicable.
