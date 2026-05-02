# packages/react-actions-chat-support/src/adminFlow/tickets

Admin ticket helpers used by `../createSupportAdminFlow.ts` for action messages, request-input definitions, markdown rendering, ticket action buttons, queue sorting, and queue pagination.

## Directories

- None.

## Files

- `actionMessages.ts`: Default markdown messages for admin ticket assignment, priority, reply, reopen, resolve, and empty assigned work states.
- `buttonDefs.ts`: Long admin ticket request-input and confirmation button definitions.
- `buttons.ts`: Admin ticket assignment, priority, reply, resolve, review, and detail action button factories.
- `defaults.ts`: Default admin ticket labels and priority ordering.
- `flow.ts`: Admin ticket workflow orchestration for ticket lookup, queue rendering, assigned work, and ticket action button environments.
- `formatterResolvers.ts`: Resolves custom or default admin ticket detail, full activity, and queue formatters.
- `formatters.ts`: Pure markdown formatters for admin ticket queue and ticket details.
- `queue.ts`: Ticket queue ordering, pagination, and default queue button variant helpers.
- `queueButtons.ts`: Reusable admin ticket queue reference, pagination, refresh, and queue navigation button builders.

## Writing Rules

- Keep ticket-specific workflows, action messages, formatting, button, and queue helpers here; leave cross-domain service wiring in `../createSupportAdminFlow.ts`.
- Update this AGENTS.md when files are added, removed, renamed, or materially repurposed in this directory.
