# e2e/support

Shared Playwright utilities for opening example apps and interacting with the common chat UI.

## Directories

- None.

## Files

- `chat.ts`: Helper functions for navigation, locating transcript regions, submitting input, and clicking chat actions across all runnable examples.

## Writing Rules

- Keep selectors role- and label-based, and return reusable `Locator` objects so specs can compose assertions without re-querying the DOM structure.
- Follow inherited AGENTS.md guidance when applicable.
