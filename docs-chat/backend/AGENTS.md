# docs-chat/backend

Firebase deployment root for the docs assistant backend.

## Directories

- `generated/`: Auto-generated docs corpus and embeddings loaded by the Firebase function at runtime.

## Files

- `.env.example`: Example local environment configuration for the docs assistant backend emulator and deploy workflow.
- `index.js`: Firebase HTTP function that retrieves docs context and returns cited answers.
- `package.json`: Runtime manifest for the deployed Firebase docs assistant backend.

## Writing Rules

- Keep the function entrypoint, environment loading, retrieval logic, and answer formatting in this directory.
- Update this AGENTS.md when the backend directory layout or runtime files change.
