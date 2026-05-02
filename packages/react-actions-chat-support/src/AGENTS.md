# packages/react-actions-chat-support/src

Published source for the support companion package, including customer/admin flow builders, shared support-domain types, and an in-memory adapter for demos or tests.

## Directories

- `__tests__/`: Automated coverage for the support-flow package behavior.
- `adminFlow/`: Internal modules for the admin-side support flow, including contracts, defaults, formatting, service routing, and ticket/live-chat helpers.
- `memorySupportFlowAdapter/`: Pure helper modules used by the in-memory support adapter for cloning, IDs, defaults, matching, and sorting.
- `supportFlowUtils/`: Shared pure helpers used by both support flows for formatting, validation, async detection, and button override resolution.
- `userFlow/`: Internal modules for the customer-side support flow, including contracts, defaults, formatting, service routing, and live-chat helpers.

## Files

- `adminSupportFlow.ts`: Builds the admin-side support queue flow with ticket triage, assignment, reply, live-chat queue review, and resolution actions.
- `index.ts`: Public export barrel for the support companion package.
- `memorySupportFlowAdapter.ts`: In-memory support adapter that simulates tickets and live-chat queue state.
- `supportFlowTypes.ts`: Shared support-domain types and adapter contracts used by both flows.
- `supportFlowUtils.ts`: Internal helpers shared by the user and admin flows for formatting, validation, labels, and common predicates.
- `userSupportFlow.ts`: Builds the customer-side support flow with ticket creation, lookup, and live-chat handoff.

## Writing Rules

- Keep shared support-domain contracts in `supportFlowTypes.ts`, shared pure flow helpers in `supportFlowUtils.ts`, mutable backing-store behavior in `memorySupportFlowAdapter.ts`, and transcript/button orchestration in the user and admin flow modules.
- Update `index.ts` whenever public flows, adapters, or exported types change.
- Follow inherited AGENTS.md guidance when applicable.
