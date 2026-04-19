# e2e

Playwright suites that exercise the runnable example apps through real browser interactions.

## Directories

- `support/`: Shared Playwright helpers for opening examples, finding transcript regions, and interacting with the chat UI.

## Files

- `coding.spec.ts`: End-to-end coverage for the coding example's multiline prompt and markdown reply flow.
- `llm-support.spec.ts`: End-to-end coverage for the LLM support example and its deterministic fallback backend mode.
- `login.spec.ts`: End-to-end coverage for the login example's sign-in, MFA, recovery, and sign-out flows.
- `qa-bot.spec.ts`: End-to-end coverage for the basic question-and-answer example.
- `settings.spec.ts`: End-to-end coverage for the settings example and its recommended-action flow.
- `support-desk.spec.ts`: End-to-end coverage for the shared customer/admin support-desk example.

## Writing Rules

- Ensure each example in `examples` directory (found in the root folder of project) has e2e tests that test the full range of the example.
- Prefer the helpers in `support/chat.ts` for navigation, submissions, and action clicks instead of duplicating selectors or example URLs in spec files.
- Structure assertions around the assistant-message locators returned by the helpers instead of arbitrary timeouts.
- Follow inherited AGENTS.md guidance when applicable.
