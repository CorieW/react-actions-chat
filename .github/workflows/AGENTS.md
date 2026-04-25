# .github/workflows

GitHub Actions workflow definitions for continuous integration, releases, docs deployment, coverage reporting, and E2E automation.

## Directories

- None.

## Files

- `deploy-docs-assistant-backend.yml`: GitHub Actions workflow that regenerates and deploys the Firebase docs assistant backend.
- `ci.yml`: GitHub Actions workflow for the main CI checks on pushes and pull requests across all branches, including AGENTS hierarchy validation.
- `deploy-docs.yml`: GitHub Actions workflow that manually or reusably builds and deploys the docs site from the default branch.
- `e2e.yml`: GitHub Actions workflow that builds the example apps and runs the Playwright suite.
- `pr-ci-failure-guidance.yml`: GitHub Actions workflow that comments on pull requests with recommended local commands for failed CI jobs.
- `pr-coverage.yml`: GitHub Actions workflow that posts coverage summaries on pull requests.
- `release.yml`: GitHub Actions workflow that manually orchestrates docs deployment and package release steps.
- `require-changeset.yml`: GitHub Actions workflow that enforces changeset coverage on pull requests.
- `upload-coverage.yml`: GitHub Actions workflow that uploads coverage reports to Codecov.

## Writing Rules

- No additional local writing rules.
- Follow inherited AGENTS.md guidance when applicable.
