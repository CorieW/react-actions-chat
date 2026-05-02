# packages/react-actions-chat-support/src/userFlow/live-chat

Customer live-chat helpers used by `../createSupportUserFlow.ts` for markdown rendering, request-input definitions, persistent actions, and start-live-chat button behavior.

## Directories

- None.

## Files

- `buttonDefs.ts`: Long customer live-chat request-input button definitions.
- `buttons.ts`: Customer live-chat persistent button ID, persistent defaults, start-request, and open-chat action factories.
- `defaults.ts`: Default customer live-chat labels and input descriptions.
- `flow.ts`: Customer live-chat workflow orchestration for active sessions, waiting input state, persistent buttons, and message submission.
- `formatterResolvers.ts`: Resolves custom or default customer live-chat detail and ended-state formatters.
- `formatters.ts`: Pure markdown formatters for customer live-chat details and ended-chat states.

## Writing Rules

- Keep live-chat workflows, formatting, input-state handling, and button construction here; leave cross-domain service wiring in `../createSupportUserFlow.ts`.
- Update this AGENTS.md when files are added, removed, renamed, or materially repurposed in this directory.
