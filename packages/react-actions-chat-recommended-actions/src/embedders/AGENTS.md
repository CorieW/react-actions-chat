# packages/react-actions-chat-recommended-actions/src/embedders

Provider-specific text embedder implementations and shared helpers for vector-search recommendation flows.

## Directories

- None.

## Files

- `cohere.ts`: Cohere-backed text embedder implementation.
- `index.ts`: Barrel exports for text embedder helpers and shared types.
- `openai.ts`: OpenAI-backed text embedder implementation.
- `shared.ts`: Shared embedder types and provider-agnostic helper utilities.
- `voyage.ts`: Voyage-backed text embedder implementation.

## Writing Rules

- New provider adapters should accept optional `fetch`, `baseUrl`, and `headers` overrides, and should reuse the parsing and error helpers from `shared.ts`.
- Implement provider batch requests first and have `embedText` delegate to that path while validating that one embedding is returned per input text.
- Follow inherited AGENTS.md guidance when applicable.
