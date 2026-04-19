# React Actions Chat Support

Companion package for `react-actions-chat` that adds reusable support-desk flows for both customers and admins.

## Installation

```bash
npm install react-actions-chat react-actions-chat-support
```

## What It Includes

- `createSupportUserFlow`
- `createSupportAdminFlow`
- `createInMemorySupportFlowAdapter`

The package ships a shared adapter contract plus an in-memory implementation so
you can prototype ticketing, live-chat handoff, knowledge-base search, queue
review, assignment, and resolution flows without wiring a backend first.
