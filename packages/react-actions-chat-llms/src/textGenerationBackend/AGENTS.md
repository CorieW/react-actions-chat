# packages/react-actions-chat-llms/src/textGenerationBackend

Internal modules for the browser-side text-generation backend client.

## Directories

- None.

## Files

- `createTextGenerationBackend.ts`: Factory that creates the fetch-backed text generator.
- `index.ts`: Internal export barrel for the text-generation backend modules.
- `request.ts`: Request serialization helpers that remove non-JSON request fields.
- `response.ts`: Backend response error extraction and generated-text validation helpers.
- `types.ts`: Text-generation request, response, backend config, and generator contracts.

## Writing Rules

- Keep public backend contracts in `types.ts`, fetch orchestration in `createTextGenerationBackend.ts`, request body shaping in `request.ts`, and response validation in `response.ts`.
- Follow inherited AGENTS.md guidance when applicable.
