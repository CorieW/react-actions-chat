# .github/workflows

GitHub Actions workflow definitions for continuous integration, releases, docs deployment, coverage reporting, and E2E automation.

## Directories

- None.

## Files

- `ci.yml`: GitHub Actions workflow for the main CI checks, including AGENTS hierarchy validation.
- `deploy-docs.yml`: GitHub Actions workflow that builds and deploys the docs site.
- `e2e.yml`: GitHub Actions workflow that builds the example apps and runs the Playwright suite.
- `pr-coverage.yml`: GitHub Actions workflow that posts coverage summaries on pull requests.
- `release.yml`: GitHub Actions workflow that publishes package releases.
- `require-changeset.yml`: GitHub Actions workflow that enforces changeset coverage on pull requests.
- `upload-coverage.yml`: GitHub Actions workflow that uploads coverage reports to Codecov.

## Writing Rules

- No additional local writing rules.
- Follow inherited AGENTS.md guidance when applicable.
