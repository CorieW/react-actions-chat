# src/__tests__

Vitest coverage for the package's public behavior, stores, theming, and representative example flows.

## Directories

- None.

## Files

- `Chat.test.tsx`: Component-level tests for transcript rendering, buttons, and input orchestration.
- `chatStore.test.ts`: Unit tests for the core chat store state transitions.
- `inputBarConfig.test.ts`: Tests for input-bar behavior, mode, and validation configuration helpers.
- `inputFieldStore.test.ts`: Unit tests for the shared input field store.
- `loginExample.test.tsx`: Integration coverage for the login example flow.
- `messageParts.test.tsx`: Tests for message-part helpers and rendering behavior.
- `persistentButtonStore.test.ts`: Unit tests for persistent button state management.
- `qaBotExample.test.tsx`: Integration coverage for the QA bot example flow.
- `requestButtonDefinitions.test.ts`: Tests for the request-input and request-confirmation button APIs.
- `setup.ts`: Shared Vitest setup for DOM assertions and test environment configuration.
- `themes.test.ts`: Unit tests for theme presets and theme resolution helpers.

## Writing Rules

- No additional local writing rules.
- Follow inherited AGENTS.md guidance when applicable.
