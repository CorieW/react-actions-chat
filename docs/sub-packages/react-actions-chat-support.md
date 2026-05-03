# `react-actions-chat-support`

`react-actions-chat-support` is the companion package for reusable customer and admin support-desk workflows built on top of `react-actions-chat`.

## Installation

```bash
npm install react-actions-chat react-actions-chat-support
```

## What It Adds

- `createSupportUserFlow`
- `createSupportAdminFlow`
- `createInMemorySupportFlowAdapter`
- `createHubSpotSupportFlowProvider`

## Use It When

Use this package when:

- you want a customer-facing support inbox and an agent-facing admin queue
- your app needs ticket creation, updates, queue review, or live-chat handoff flows
- you want to prototype with an in-memory adapter before wiring a real backend

Use the core package alone when your chat flow is fully custom and you do not need ticketing or support-desk primitives.

## Main Pieces

### Customer flow

`createSupportUserFlow(...)` builds a ready-to-mount customer journey for opening tickets, checking status, and requesting live chat.

### Admin flow

`createSupportAdminFlow(...)` builds the operator side of the same system, including queue review, assignment, replies, priority changes, and resolution actions.

### Adapter layer

`SupportFlowAdapter` is the contract both flows use for ticket, queue, and live-chat operations. `createInMemorySupportFlowAdapter(...)` gives you a self-contained implementation for demos and local prototyping.

`createHubSpotSupportFlowProvider(...)` connects the ticket workflow to HubSpot
CRM tickets. It returns `userCallbacks` and `adminCallbacks` for HubSpot-backed
ticket creation, lookup, customer ticket lists, admin queues, replies, status
updates, priorities, and owner assignment. It does not expose live-chat
callbacks, so the prebuilt flows keep unsupported live-chat actions hidden.

### Customization layer

Use the prebuilt flows as defaults, then customize the parts your product owns:

- use `callbacks` to replace individual adapter calls
- use `validation`, `labels`, `requestInputs`, and `confirmations` to tune
  guided inputs, validators, input modes, file-upload settings, and
  confirmation steps
- use `formatters` to replace markdown for tickets, queues, transcripts, and
  completion messages
- use `behavior` to adjust limits, priority order, status transitions,
  predicates, queue button variants, assigned-work filters, and live-chat
  requeue math
- use `customizeButtons` to append, remove, reorder, or replace buttons for
  primary, ticket, queue, live-chat, assigned-work, and persistent live-chat
  slots

Admin ticket priority uses a shared-input dropdown for choosing an exact
priority.

The in-memory adapter also accepts factories for references, IDs, timestamps,
subjects, customer matching, queue positions, estimated waits, sorting, and
default statuses or priorities.

## Read Next

- [Sub-packages overview](./index.md)
- [Build a support desk](../guides/build-a-support-desk.md)
- [Support API reference](../reference/support-api.md)
- [Examples guide](../examples.md)

The runnable demo for this package lives at [examples/support-desk](https://github.com/CorieW/react-actions-chat/tree/main/examples/support-desk).
