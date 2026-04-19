# packages/react-actions-chat-support/src

Published source for the support companion package, including customer/admin flow builders, shared support-domain types, and an in-memory adapter for demos or tests.

## Directories

- `__tests__/`: Automated coverage for the support-flow package behavior.

## Files

- `adminSupportFlow.ts`: Builds the admin-side support queue flow with ticket triage, assignment, reply, live-chat offer, and resolution actions.
- `index.ts`: Public export barrel for the support companion package.
- `memorySupportFlowAdapter.ts`: In-memory support adapter that simulates tickets, knowledge-base search, and live-chat queue state.
- `supportFlowTypes.ts`: Shared support-domain types and adapter contracts used by both flows.
- `userSupportFlow.ts`: Builds the customer-side support flow with ticket creation, lookup, help-center search, and live-chat handoff.

## Writing Rules

- Keep shared support-domain contracts in `supportFlowTypes.ts`, keep mutable backing-store behavior in `memorySupportFlowAdapter.ts`, and keep transcript/button orchestration in the user and admin flow modules.
- Update `index.ts` whenever public flows, adapters, or exported types change.
- Follow inherited AGENTS.md guidance when applicable.
