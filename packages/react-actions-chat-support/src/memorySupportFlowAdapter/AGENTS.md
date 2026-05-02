# packages/react-actions-chat-support/src/memorySupportFlowAdapter

Pure helper modules for the in-memory support adapter exported through `../memorySupportFlowAdapter.ts`.

## Directories

- None.

## Files

- `cloning.ts`: Defensive clone helpers for tickets, live chats, identities, and messages.
- `defaults.ts`: Default open ticket and live-chat status filters.
- `identity.ts`: Customer identity matching helper for ticket and live-chat lookups.
- `ids.ts`: Ticket reference, subject, and message ID helpers.
- `index.ts`: Internal barrel for in-memory adapter helpers.
- `sorting.ts`: Default ticket and live-chat ordering helpers.

## Writing Rules

- Keep helpers pure and free of adapter state; mutable backing-store behavior stays in `../memorySupportFlowAdapter.ts`.
- Re-export helpers through `index.ts` when they are shared by the adapter implementation.
- Update this AGENTS.md when files are added, removed, renamed, or materially repurposed in this directory.
