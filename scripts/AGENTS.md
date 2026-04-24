# scripts

Repository automation scripts for building styles, docs, and examples, plus running E2E workflows.

## Directories

- None.

## Files

- `build-docs-assistant-corpus.js`: Generates retrieval-ready docs chunks for the Firebase docs assistant backend.
- `build-docs-assistant-embeddings.js`: Generates semantic embeddings for the Firebase docs assistant corpus.
- `build-e2e-examples.js`: Builds the example apps in deterministic or live modes for Playwright runs.
- `build-pages.js`: Builds the GitHub Pages output by combining docs and selected example apps.
- `build-styles-simple.js`: Alternate Tailwind CLI script for generating `src/styles.css`.
- `build-styles-v4.js`: Main Tailwind v4 build script for generating `src/styles.css`.
- `check-docs-assistant-corpus.js`: Regenerates the docs assistant corpus and fails when generation breaks or produces an empty output.
- `check-docs.js`: Validates selected docs reference lists against source types and typechecks marked TS/TSX docs snippets.
- `check-styles.js`: CI check that regenerates and verifies `src/styles.css` is up to date.
- `dev-docs-assistant.js`: Starts the docs assistant local stack by combining corpus generation, the Firebase emulator, and the VitePress dev server.
- `refresh-all.js`: Refreshes local build outputs and caches across the repository.
- `run-e2e.js`: Runs the Playwright suite in PR, live, or matrix modes.
- `watch-docs-assistant-corpus.js`: Watches docs markdown changes and regenerates the docs assistant corpus during local development.

## Writing Rules

- Always leave a comment at the top of the script describing what the script does, and how it does it in steps.
- Follow inherited AGENTS.md guidance when applicable.
