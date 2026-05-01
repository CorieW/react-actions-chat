# Support API Reference

Concise reference for the public exports from `react-actions-chat-support`.

## Main Flow Creators

### `createSupportUserFlow(config)`

Creates a reusable customer-facing support flow with ticket creation, ticket lookup, and live-chat handoff prompts.

Returned API:

- `initialMessages`
- `primaryButtons`
- `start(): void`

Important config fields:

- `adapter`
- `callbacks`
- `customer`
- `brandName`
- `initialMessage`
- `validation`
- `labels`
- `requestInputs`
- `formatters`
- `behavior`
- `customizeButtons`
- `liveChatPersistentButtons`

### `createSupportAdminFlow(config)`

Creates a reusable admin-facing support flow for queue review, assignment, replies, priority changes, and resolution steps.

Returned API:

- `initialMessages`
- `primaryButtons`
- `start(): void`

Important config fields:

- `adapter`
- `callbacks`
- `agent`
- `brandName`
- `initialMessage`
- `validation`
- `labels`
- `requestInputs`
- `confirmations`
- `formatters`
- `behavior`
- `customizeButtons`
- `liveChatPersistentButtons`

## Extension Points

The user and admin flows expose optional hooks so applications can customize the
prebuilt workflows without replacing the package:

- `callbacks` override individual adapter operations.
- `labels` changes fixed button labels and active live-chat input copy.
- `requestInputs` changes request-button prompts, placeholders, validators,
  input modes, file-upload settings, abort labels, cooldowns, timeouts, and
  visual styling.
- `confirmations` customizes admin confirmation buttons such as ticket
  resolution.
- `formatters` replaces markdown output for opening messages, ticket summaries,
  queues, transcripts, and completion states.
- `behavior` changes limits, predicates, status transitions, priority order,
  queue button variants, assigned-work filters, and live-chat queue math.
- `customizeButtons` receives each button slot with its default buttons so apps
  can append, remove, reorder, or replace actions.

Admin ticket priority uses `Set priority`, which opens the shared input
dropdown.

## Adapter Helpers

### `createInMemorySupportFlowAdapter(options?)`

Creates a self-contained `SupportFlowAdapter` implementation for demos, local development, and tests.

Important options:

- `tickets`
- `liveChats`
- `nextTicketNumber`
- `nextTicketMessageNumber`
- `nextLiveChatNumber`
- `nextLiveChatMessageNumber`
- `now`
- `createTicketReference`
- `createTicketSubject`
- `createTicketMessageId`
- `createLiveChatId`
- `createLiveChatMessageId`
- `defaultTicketStatus`
- `defaultTicketPriority`
- `defaultQueueStatuses`
- `defaultLiveChatQueueStatuses`
- `getLiveChatQueuePosition`
- `getEstimatedWaitMinutes`
- `matchCustomer`
- `sortTickets`
- `sortLiveChats`

## Core Types

### `SupportFlowAdapter`

Adapter contract with:

- `createTicket(input)`
- `getTicketByReference(reference)`
- `listCustomerTickets(customer)`
- `listQueue(filter?)`
- `listLiveChatQueue(filter?)`
- `getLiveChatById(sessionId)`
- `listCustomerLiveChats(customer)`
- `updateTicket(input)`
- `appendTicketMessage(input)`
- `startLiveChat(input)`
- `updateLiveChat(input)`
- `appendLiveChatMessage(input)`

### `SupportTicket`

Ticket shape with:

- `reference`
- `subject`
- `summary`
- `customer`
- `status`
- `priority`
- `assignedTo?`
- `liveChatOffered`
- `createdAt`
- `updatedAt`
- `messages`
- `tags?`

### `SupportLiveChatSession`

Live-chat queue item with:

- `id`
- `summary`
- `ticketReference?`
- `requestedBy`
- `queuePosition`
- `estimatedWaitMinutes`
- `status`
- `createdAt`
- `customer?`
- `agent?`

### Identity and input types

The package also exports:

- `SupportUserIdentity`
- `SupportAgentIdentity`
- `CreateSupportTicketInput`
- `UpdateSupportTicketInput`
- `AppendSupportTicketMessageInput`
- `StartSupportLiveChatInput`
- `SupportQueueFilter`
- `SupportTicketMessage`
- `SupportTicketPriority`
- `SupportTicketStatus`
