# packages/react-actions-chat-support/src/userFlow/buttons

Cross-domain button helpers for the customer-side support flow, limited to navigation, refresh, and primary option assembly used by `../createSupportUserFlow.ts`.

## Directories

- None.

## Files

- `navigationButtons.ts`: Shared customer navigation and live-chat refresh button builders.
- `primaryButtons.ts`: Default customer primary action button assembly.

## Writing Rules

- Keep domain-specific ticket and live-chat button helpers in sibling `../tickets/` and `../live-chat/` directories.
- Update this AGENTS.md when files are added, removed, renamed, or materially repurposed in this directory.
