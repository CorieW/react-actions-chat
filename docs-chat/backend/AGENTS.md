# docs-chat/backend

Firebase deployment root for the docs assistant backend.

## Directories

- None.

## Files

- `.env.example`: Example local environment configuration for the docs assistant backend emulator and deploy workflow.
- `index.js`: Firebase HTTP function that retrieves docs context and returns cited answers.
- `package.json`: Runtime manifest for the deployed Firebase docs assistant backend.
- `tsconfig.json`: Minimal JavaScript TypeScript config used by Firebase deploy isolation to locate the backend output directory.

## Writing Rules

- Keep the function entrypoint, environment loading, retrieval logic, and answer formatting in this directory.
- Update this AGENTS.md when the backend directory layout or runtime files change.
