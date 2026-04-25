# .

Workspace root for the published `react-actions-chat` package, its companion recommended-actions package, runnable demos, documentation, and release tooling.

## Directories

- `.changeset/`: Changeset metadata used to version and publish workspace packages.
- `.github/`: GitHub configuration, automation, and CI workflows.
- `config/`: Shared tool configuration for Vite, TypeScript, ESLint, Prettier, and Tailwind.
- `docs/`: VitePress documentation source for the package site.
- `docs-chat/`: Shared source for the docs homepage chat frontend and its Firebase backend.
- `e2e/`: Playwright coverage for the runnable example apps.
- `examples/`: Workspace example apps that exercise the chat package in realistic flows.
- `packages/`: Companion workspace packages published alongside the main package.
- `scripts/`: Repo automation for builds, style generation, docs publishing, and E2E orchestration.
- `src/`: Published source for the main `react-actions-chat` package.

## Files

- `.gitignore`: Shared ignore rules for local dependencies, build output, and generated artifacts.
- `.nvmrc`: Preferred Node.js version for local development.
- `LICENSE`: MIT license for the published packages.
- `README.md`: Main package overview, installation steps, and contributor workflow.
- `firebase.json`: Firebase CLI configuration for deploying the docs assistant backend.
- `package.json`: Root package manifest, exports, scripts, and workspace-wide dependencies.
- `playwright.config.ts`: Shared Playwright configuration for local and CI browser runs.
- `pnpm-workspace.yaml`: Workspace package globs for the repo's pnpm monorepo layout.

## Generated Files

- `pnpm-lock.yaml`: pnpm lockfile for the workspace dependency graph.
  Rules:
  - Prefer regenerating it instead of hand-editing when possible.

## Writing Rules

- No additional local writing rules.
- Follow inherited AGENTS.md guidance when applicable.
