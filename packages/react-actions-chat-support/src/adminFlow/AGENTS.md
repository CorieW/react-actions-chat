# packages/react-actions-chat-support/src/adminFlow

Internal implementation modules for the admin-side support flow exported through `../adminSupportFlow.ts`.

## Directories

- `buttons/`: Cross-domain admin button builders for primary options, navigation, and refresh actions.
- `live-chat/`: Admin live-chat action messages, markdown formatters, button factories, and persistent action helpers.
- `tickets/`: Admin ticket action messages, request button definitions, markdown formatters, queue helpers, pagination, and ticket action button factories.

## Files

- `createSupportAdminFlow.ts`: Main admin flow composition for config normalization, services, formatters, and ticket/live-chat workflow wiring.
- `defaults.ts`: Default admin labels and priority ordering.
- `formatterResolvers.ts`: Selects custom admin formatters or default markdown formatters for opening, queue, ticket, and live-chat views.
- `formatters.ts`: Cross-domain admin opening-message markdown formatter.
- `index.ts`: Internal barrel for admin flow implementation and contracts.
- `services.ts`: Adapter/callback routing and capability detection for admin flow operations.
- `types.ts`: Public admin flow configuration, formatter, button, behavior, and context types.

## Writing Rules

- Keep public admin flow contracts in `types.ts` and re-export them through `../adminSupportFlow.ts`.
- Keep cross-domain composition in `createSupportAdminFlow.ts`; move ticket and live-chat workflows, formatting, action messages, and button helpers into the focused sibling modules.
- Update this AGENTS.md when files are added, removed, renamed, or materially repurposed in this directory.
