# src/lib

Shared state stores, theme helpers, and non-visual utilities exported by the main package.

## Directories

- None.

## Files

- `chatGlobalsStore.ts`: Zustand store for chat-level globals and request-input defaults.
- `chatStore.ts`: Zustand store for transcript state, callbacks, and loading state.
- `index.ts`: Public export barrel for stores, theme helpers, and utilities.
- `inputFieldStore.ts`: Zustand store for the shared chat input state and validation hooks.
- `messageButtons.ts`: Helpers for inspecting message buttons and whether they block input.
- `messageParts.ts`: Helpers for extracting plain text from structured message parts.
- `persistentButtonStore.ts`: Zustand store for persistent action buttons outside the transcript.
- `themes.ts`: Built-in theme presets and helpers for resolving chat theme tokens.
- `utils.ts`: Utility helpers such as Tailwind-aware class name merging.

## Writing Rules

- No additional local writing rules.
- Follow inherited AGENTS.md guidance when applicable.
