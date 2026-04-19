# config

Centralized workspace tool configuration for linting, formatting, TypeScript, Vite, and related build tooling.

## Directories

- None.

## Files

- `.prettierignore`: Prettier ignore rules for generated files and build artifacts.
- `.prettierrc`: Shared Prettier configuration for the repository.
- `components.json`: shadcn/ui component generator configuration.
- `eslint.config.js`: Shared ESLint configuration for source, tests, docs, and scripts.
- `knip.json`: Knip configuration for unused code and dependency checks.
- `tailwind.config.js`: Tailwind configuration kept for tooling that still expects a config file, including shadcn/ui metadata.
- `tsconfig.json`: Base TypeScript configuration for the main package and tests.
- `tsconfig.node.json`: TypeScript configuration for Node-based tooling and config files.
- `vite.config.ts`: Shared Vite and Vitest configuration for the library workspace.

## Writing Rules

- No additional local writing rules.
- Follow inherited AGENTS.md guidance when applicable.
