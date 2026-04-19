# examples/llm-support

Runnable LLM support demo that sends chat turns to a local backend route backed by the companion LLM package.

## Directories

- None.

## Files

- `App.tsx`: Main React app and LLM-backed support flow for the example.
- `index.css`: Example-specific styles for the LLM support demo.
- `index.html`: Vite HTML entry point for the example app.
- `llmDemoServer.ts`: Local Vite middleware that proxies the demo chat requests to OpenAI on the server side.
- `main.tsx`: React bootstrap for the example application.
- `package.json`: Workspace package manifest and scripts for the example.
- `tsconfig.json`: TypeScript configuration for the example workspace package.
- `vite-env.d.ts`: Vite environment type declarations for the example.
- `vite.config.ts`: Vite configuration for local development and production preview of the example.

## Writing Rules

- Keep the frontend flow orchestration in `App.tsx` and keep Vite server middleware in `llmDemoServer.ts`.
- Follow inherited AGENTS.md guidance when applicable.
