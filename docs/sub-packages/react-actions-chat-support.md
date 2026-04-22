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
- `DEFAULT_SUPPORT_KNOWLEDGE_BASE_ARTICLES`

## Use It When

Use this package when:

- you want a customer-facing support inbox and an agent-facing admin queue
- your app needs ticket creation, updates, queue review, or live-chat handoff flows
- you want to prototype with an in-memory adapter before wiring a real backend

Use the core package alone when your chat flow is fully custom and you do not need ticketing or support-desk primitives.

## Main Pieces

### Customer flow

`createSupportUserFlow(...)` builds a ready-to-mount customer journey for opening tickets, checking status, searching the knowledge base, and requesting live chat.

### Admin flow

`createSupportAdminFlow(...)` builds the operator side of the same system, including queue review, assignment, replies, priority changes, and resolution actions.

### Adapter layer

`SupportFlowAdapter` is the contract both flows use for ticket, queue, article, and live-chat operations. `createInMemorySupportFlowAdapter(...)` gives you a self-contained implementation for demos and local prototyping.

## Read Next

- [Sub-packages overview](./index.md)
- [Build a support desk](../guides/build-a-support-desk.md)
- [Support API reference](../reference/support-api.md)
- [Examples guide](../examples.md)

The runnable demo for this package lives at [examples/support-desk](https://github.com/CorieW/react-actions-chat/tree/main/examples/support-desk).
