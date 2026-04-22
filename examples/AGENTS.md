# examples

Runnable workspace demos that show how to compose `react-actions-chat` into realistic support and workflow experiences.

## Directories

- `coding/`: Coding-assistant demo that highlights multiline prompts and markdown-rendered replies.
- `llm-support/`: Backend-routed LLM support demo powered by the companion `react-actions-chat-llms` package.
- `login/`: Multi-step authentication demo that exercises input requests, confirmations, and follow-up actions.
- `qa-bot/`: Lightweight support-bot demo that shows a basic free-text assistant flow.
- `settings/`: Demo that uses the companion recommended-actions package and a real embedder-backed suggestion flow.
- `support-desk/`: Shared support-package demo that switches between customer and admin ticket workflows.
- `uploads/`: Upload-focused demo that showcases optional file uploads, file validators, and image/file transcript parts.

## Files

- `README.md`: Contributor guide for running the example apps locally.

## Writing Rules

- Keep example-specific flow logic in each example's `App.tsx`, and keep `main.tsx` limited to mounting, providers, and global stylesheet imports.
- When adding or removing a runnable example, update `README.md` here and the example URL map in `e2e/support/chat.ts` in the same change.
- Each example should have an e2e test in `e2e` directory (found in the root folder of project), each testing the full capability of the example.
- Follow inherited AGENTS.md guidance when applicable.
