# scripts

Repository automation scripts for building styles, docs, and examples, plus running E2E workflows.

## Directories

- None.

## Files

- `build-e2e-examples.js`: Builds the example apps in deterministic or live modes for Playwright runs.
- `build-pages.js`: Builds the GitHub Pages output by combining docs and selected example apps.
- `build-styles-simple.js`: Alternate Tailwind CLI script for generating `src/styles.css`.
- `build-styles-v4.js`: Main Tailwind v4 build script for generating `src/styles.css`.
- `check-docs.js`: Validates selected docs reference lists against source types and typechecks marked TS/TSX docs snippets.
- `check-styles.js`: CI check that regenerates and verifies `src/styles.css` is up to date.
- `refresh-all.js`: Refreshes local build outputs and caches across the repository.
- `run-e2e.js`: Runs the Playwright suite in PR, live, or matrix modes.

## Writing Rules

- Always leave a comment at the top of the script describing what the script does, and how it does it in steps.
- Follow inherited AGENTS.md guidance when applicable.
