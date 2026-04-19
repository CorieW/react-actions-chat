# e2e

Playwright suites that exercise the runnable example apps through real browser interactions.

## Directories

- `support/`: Shared Playwright helpers for opening examples, finding transcript regions, and interacting with the chat UI.

## Files

- `login.spec.ts`: End-to-end coverage for the login example's sign-in, MFA, recovery, and sign-out flows.
- `qa-bot.spec.ts`: End-to-end coverage for the basic question-and-answer example.
- `settings.spec.ts`: End-to-end coverage for the settings example and its recommended-action flow.

## Writing Rules

- No additional local writing rules.
- Follow inherited AGENTS.md guidance when applicable.
