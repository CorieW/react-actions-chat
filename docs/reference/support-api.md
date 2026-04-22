# Support API Reference

Concise reference for the public exports from `react-actions-chat-support`.

## Main Flow Creators

### `createSupportUserFlow(config)`

Creates a reusable customer-facing support flow with ticket creation, ticket lookup, knowledge-base search, and live-chat handoff prompts.

Returned API:

- `initialMessages`
- `primaryButtons`
- `start(): void`

Important config fields:

- `adapter`
- `customer`
- `brandName`
- `initialMessage`

### `createSupportAdminFlow(config)`

Creates a reusable admin-facing support flow for queue review, assignment, replies, priority changes, and resolution steps.

Returned API:

- `initialMessages`
- `primaryButtons`
- `start(): void`

Important config fields:

- `adapter`
- `agent`
- `brandName`
- `initialMessage`

## Adapter Helpers

### `createInMemorySupportFlowAdapter(options?)`

Creates a self-contained `SupportFlowAdapter` implementation for demos, local development, and tests.

Important options:

- `tickets`
- `knowledgeBaseArticles`
- `liveChats`
- `nextTicketNumber`

### `DEFAULT_SUPPORT_KNOWLEDGE_BASE_ARTICLES`

Seed article set used by the in-memory adapter when you do not provide your own articles.

## Core Types

### `SupportFlowAdapter`

Adapter contract with:

- `createTicket(input)`
- `getTicketByReference(reference)`
- `listCustomerTickets(customer)`
- `listQueue(filter?)`
- `updateTicket(input)`
- `appendTicketMessage(input)`
- `searchKnowledgeBase(query)`
- `startLiveChat(input)`

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

### `SupportKnowledgeBaseArticle`

Knowledge-base result shape with:

- `id`
- `title`
- `summary`
- `body?`
- `url?`
- `keywords?`

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
