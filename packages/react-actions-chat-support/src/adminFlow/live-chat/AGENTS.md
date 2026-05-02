# packages/react-actions-chat-support/src/adminFlow/live-chat

Admin live-chat helpers used by `../createSupportAdminFlow.ts` for action messages, markdown rendering, queue buttons, persistent live-chat actions, and join/leave session controls.

## Directories

- None.

## Files

- `actionMessages.ts`: Default markdown messages for admin live-chat ended, joined, and left state changes.
- `buttons.ts`: Admin live-chat button IDs, queue variants, queue buttons, persistent defaults, and join/leave action factories.
- `defaults.ts`: Default admin live-chat labels and input descriptions.
- `flow.ts`: Admin live-chat workflow orchestration for queue rendering, session input state, persistent buttons, and agent replies.
- `formatterResolvers.ts`: Resolves custom or default admin live-chat queue and session detail formatters.
- `formatters.ts`: Pure markdown formatters for admin live-chat queue and session details.

## Writing Rules

- Keep live-chat workflows, action messages, formatting, input-state handling, and button construction here; leave cross-domain service wiring in `../createSupportAdminFlow.ts`.
- Update this AGENTS.md when files are added, removed, renamed, or materially repurposed in this directory.
