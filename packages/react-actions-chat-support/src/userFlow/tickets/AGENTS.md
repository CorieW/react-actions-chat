# packages/react-actions-chat-support/src/userFlow/tickets

Customer ticket helpers used by `../createSupportUserFlow.ts` for markdown rendering, request-input definitions, ticket creation, add-detail, ticket list, and ticket detail buttons.

## Directories

- None.

## Files

- `buttonDefs.ts`: Long customer ticket request-input button definitions.
- `buttons.ts`: Customer ticket creation, add-detail, view-ticket, ticket detail, and ticket reference button builders.
- `defaults.ts`: Default customer ticket labels.
- `flow.ts`: Customer ticket workflow orchestration for ticket lookup, ticket lists, and ticket action button environments.
- `formatterResolvers.ts`: Resolves custom or default customer ticket summary and full activity formatters.
- `formatters.ts`: Pure markdown formatter for customer ticket summaries.

## Writing Rules

- Keep ticket-specific workflows, formatting, and button construction here; leave cross-domain service wiring in `../createSupportUserFlow.ts`.
- Update this AGENTS.md when files are added, removed, renamed, or materially repurposed in this directory.
