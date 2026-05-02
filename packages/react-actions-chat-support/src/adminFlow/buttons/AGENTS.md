# packages/react-actions-chat-support/src/adminFlow/buttons

Cross-domain button helpers for the admin-side support flow, limited to navigation, refresh, and primary option assembly used by `../createSupportAdminFlow.ts`.

## Directories

- None.

## Files

- `navigationButtons.ts`: Shared admin navigation and refresh button builders.
- `primaryButtons.ts`: Default admin primary action button assembly.

## Writing Rules

- Keep domain-specific ticket and live-chat button helpers in sibling `../tickets/` and `../live-chat/` directories.
- Update this AGENTS.md when files are added, removed, renamed, or materially repurposed in this directory.
