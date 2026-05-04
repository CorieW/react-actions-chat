# packages/react-actions-chat-support/src/supportFlowUtils

Internal pure utility modules re-exported through `../supportFlowUtils.ts` for both support flows.

## Directories

- None.

## Files

- `async.ts`: Promise-like detection used when flow callbacks may be synchronous or asynchronous.
- `buttons.ts`: Request/confirmation button override resolution and persistent button ID helpers.
- `formatting.ts`: Shared markdown escaping, labels, timestamps, activity formatting, and identity labels.
- `index.ts`: Internal barrel for shared support flow utilities.
- `loading.ts`: Delayed loading indicator controller for async support operations.
- `pagination.ts`: Shared page-window calculations for ticket and live-chat lists.
- `validation.ts`: Shared support input validation setting resolution and validator builders.

## Writing Rules

- Keep helpers pure and behavior-neutral so user and admin flows can share them safely.
- Re-export utilities through `index.ts` and preserve the compatibility barrel at `../supportFlowUtils.ts`.
- Update this AGENTS.md when files are added, removed, renamed, or materially repurposed in this directory.
