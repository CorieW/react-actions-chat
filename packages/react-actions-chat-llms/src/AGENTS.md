# packages/react-actions-chat-llms/src

Published source for the LLM companion package, including the chat flow helpers, backend client, and test coverage.

## Directories

- `__tests__/`: Automated tests for the companion package helpers.
- `chatTextGenerationFlow/`: Internal modules for chat text-generation flow contracts, transcript conversion, default messages, and runtime orchestration.
- `textGenerationBackend/`: Internal modules for the fetch-backed text-generation backend contracts, request serialization, and response handling.

## Files

- `chatTextGenerationFlow.ts`: Public facade for transcript-aware text-generation flows that plug into the shared chat store.
- `index.ts`: Public export barrel for the LLM companion package.
- `shared.ts`: Shared fetch and JSON parsing helpers used by the package.
- `textGenerationBackend.ts`: Public facade for the client helper that calls a text-generation backend route from the browser.

## Writing Rules

- No additional local writing rules.
- Follow inherited AGENTS.md guidance when applicable.
