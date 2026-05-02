# packages/react-actions-chat-support/src/userFlow

Internal implementation modules for the customer-side support flow exported through `../userSupportFlow.ts`.

## Directories

- `buttons/`: Cross-domain customer button builders for primary options, navigation, and refresh actions.
- `live-chat/`: Customer live-chat markdown formatters, request buttons, and persistent action helpers.
- `tickets/`: Customer ticket markdown formatters, request button definitions, and ticket action button factories.

## Files

- `createSupportUserFlow.ts`: Main customer flow composition for config normalization, services, formatters, and ticket/live-chat workflow wiring.
- `defaults.ts`: Default customer flow labels.
- `formatterResolvers.ts`: Selects custom customer formatters or default markdown formatters for opening, ticket, and live-chat views.
- `index.ts`: Internal barrel for user flow implementation and contracts.
- `services.ts`: Adapter/callback routing and capability detection for customer flow operations.
- `types.ts`: Public customer flow configuration, formatter, button, behavior, and context types.

## Writing Rules

- Keep public customer flow contracts in `types.ts` and re-export them through `../userSupportFlow.ts`.
- Keep cross-domain composition in `createSupportUserFlow.ts`; move ticket and live-chat workflows, formatting, and button helpers into the focused sibling modules.
- Update this AGENTS.md when files are added, removed, renamed, or materially repurposed in this directory.
