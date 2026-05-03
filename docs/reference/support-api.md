# Support API Reference

Reference for the public exports from `react-actions-chat-support`.

The package exports two flow factories, one in-memory adapter factory, and the
types needed to replace or customize every support operation.

## Main Flow Creators

### `createSupportUserFlow(config)`

Creates the customer-facing support flow. It can open tickets, list the
customer's tickets, show ticket activity, append details, start live chat,
refresh live chat, and end live chat.

Required config:

- `customer`

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
- `filterOptions`
- `behavior`
- `customizeButtons`
- `liveChatPersistentButtons`

If neither `adapter` nor the matching `callbacks` provide an operation, the
flow hides buttons for that capability. For example, `Start ticket` requires
ticket creation, and `View tickets` requires customer ticket listing.

### `createSupportAdminFlow(config)`

Creates the agent/admin support flow. It can list ticket queues, review a
ticket by reference, list assigned work, assign tickets, reply to customers,
set priority, reopen or resolve tickets, list live-chat queues, join live
chats, reply in live chat, leave live chat, and end live chat.

Required config:

- `agent`

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
- `filterOptions`
- `behavior`
- `customizeButtons`
- `liveChatPersistentButtons`

Admin primary buttons are capability-aware. Queue buttons require queue-listing
methods, review-by-reference requires ticket lookup, and live-chat actions
require the corresponding live-chat adapter or callback operations.

## Runtime Shape

Both flow factories return `SupportFlowBase`:

- `initialMessages`: messages to pass to `<Chat initialMessages={...} />`.
- `primaryButtons`: default top-level actions for the flow.
- `start()`: imperatively appends the opening support message to the current
  chat store.

Use `initialMessages` for the normal mount path. Use `start()` when the chat is
already mounted and you want to start the flow from another button or event.

## Adapter Helper

### `createInMemorySupportFlowAdapter(options?)`

Creates a self-contained `SupportFlowAdapter` for demos, tests, and local
development.

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

Default ticket references are generated as `SUP-1000`, `SUP-1001`, and so on.
Default live-chat IDs are generated as `chat-0001`, `chat-0002`, and so on.
Customer matching uses `id`, then `email`, then `name` when those values are
available.

## Adapter Contract

### `SupportFlowAdapter`

Shared backend contract used by both support flows. Every method can return a
value directly or a promise.

- `createTicket(input)`: creates a ticket from customer, summary, optional
  subject, optional priority, and optional tags.
- `getTicketByReference(reference)`: returns one ticket or `null`.
- `listCustomerTickets(customer, request?)`: returns a segmented ticket result
  for tickets owned by a customer.
- `listQueue(filter?, request?)`: returns a segmented ticket result for admin
  queues.
- `listLiveChatQueue(filter?)`: returns live-chat sessions for admin queues.
- `getLiveChatById(sessionId)`: returns one live-chat session or `null`.
- `listCustomerLiveChats(customer)`: returns live chats associated with a
  customer.
- `updateTicket(input)`: patches ticket status, priority, assignee, or
  live-chat-offered state.
- `appendTicketMessage(input)`: adds a customer, agent, or system message to a
  ticket.
- `startLiveChat(input)`: opens or returns a live-chat session.
- `updateLiveChat(input)`: patches live-chat status, queue position, wait
  estimate, or assigned agent.
- `appendLiveChatMessage(input)`: appends a customer, agent, or system message
  to a live-chat transcript.

### Queue Filters

`SupportQueueFilter` includes:

- `statuses?`
- `assignedTo?`
- custom pass-through fields

`SupportLiveChatQueueFilter` includes:

- `statuses?`
- `requestedBy?`
- custom pass-through fields

Use custom fields when your backend supports richer filters than the package
needs directly.

### Paged Ticket Results

Customer and admin ticket-listing methods return `SupportTicketListResult`.
Plain ticket arrays are not accepted because the flow treats every ticket list
as a segment from a larger-capable backend.

`SupportTicketListRequest` includes:

- `pageIndex`
- `pageSize?`
- `offset`
- `limit?`

`SupportTicketListResult` includes:

- `tickets`
- `totalTickets?`
- `hasMore?`
- `nextOffset?`

The support flow passes `offset` and `limit` into each call, uses
`totalTickets` or `hasMore` to decide whether to show `Next tickets`, and falls
back to `nextOffset` when the backend needs a custom offset for the next page.
If `totalTickets` is omitted while `hasMore` is true, the rendered total is
treated as a lower bound.

## Callback Contracts

Callbacks override adapter operations one method at a time. Use them when a
specific flow should call a special endpoint or when you do not want to provide
a complete adapter.

### `SupportUserFlowCallbacks`

- `createTicket(input)`
- `getTicket(reference)`
- `listTickets(customer, request?)`
- `appendTicketMessage(input)`
- `startLiveChat(input)`
- `getOpenLiveChat(customer)`
- `getLiveChat(sessionId)`
- `updateLiveChat(input)`
- `appendLiveChatMessage(input)`

### `SupportAdminFlowCallbacks`

- `listTicketQueue(filter?, request?)`
- `listLiveChatQueue(filter?)`
- `getTicket(reference)`
- `updateTicket(input)`
- `appendTicketMessage(input)`
- `getLiveChat(sessionId)`
- `updateLiveChat(input)`
- `appendLiveChatMessage(input)`

## Customization Reference

### Labels

`labels` accepts partial label overrides for a flow.

Customer labels include ticket entry, live-chat entry, ticket paging, ticket
detail, support-options navigation, live-chat refresh, live-chat end, live-chat
message placeholders, and waiting-state copy.

Admin labels include ticket queue, live-chat queue, assigned work, ticket
review, queue paging, navigation, live-chat join/leave/end/refresh, assignment,
priority selection, full activity, reply, reopen, resolve, and live-chat reply
copy.

### Request Inputs

Customer `requestInputs` slots:

- `createTicket`
- `addTicketDetail`
- `startLiveChat`

Admin `requestInputs` slots:

- `reviewTicket`
- `assignTicket`
- `replyToCustomer`
- `setPriority`

Every request-input override uses
`SupportRequestInputButtonOverrides<TContext>`:

- `initialLabel`
- `inputPromptMessage`
- `placeholder`
- `inputDescription`
- `inputType`
- `inputOptions`
- `allowFileUpload`
- `fileValidator`
- `validator`
- `minMessageLength`
- `minMessageLengthMessage`
- `abortLabel`
- `showAbort`
- `shouldWaitForTurn`
- `cooldownMs`
- `cooldownMessage`
- `inputTimeoutMs`
- `inputTimeoutMessage`
- `suppressValidationFailureMessage`
- `variant`
- `className`
- `style`
- `rateLimit`

### Validation

`SupportInputValidationSettings` fields:

- `minMessageLength`
- `minMessageLengthMessage`
- `maxMessageLength`
- `maxMessageLengthMessage`
- `validator`

Customer validation slots:

- `ticketSummary`
- `ticketDetail`
- `liveChatInitialMessage`
- `liveChatMessage`

Admin validation slots:

- `ticketAssignment`
- `ticketReply`
- `liveChatMessage`

### Confirmations

Admin `confirmations.resolveTicket` uses
`SupportConfirmationButtonOverrides<TContext>`:

- `initialLabel`
- `confirmationMessage`
- `confirmLabel`
- `rejectLabel`
- `variant`
- `className`
- `style`

### Formatters

Customer formatter names:

- `openingMessage`
- `ticketSummary`
- `ticketFullActivity`
- `ticketList`
- `ticketCreated`
- `ticketDetailAdded`
- `liveChatDetails`
- `liveChatEnded`

Admin formatter names:

- `openingMessage`
- `ticketDetails`
- `ticketFullActivity`
- `ticketQueue`
- `liveChatQueue`
- `liveChatDetails`
- `liveChatEnded`
- `liveChatJoined`
- `liveChatLeft`
- `ticketAssigned`
- `ticketPriorityChanged`
- `ticketReplySent`
- `ticketReopened`
- `ticketResolved`

Formatter context includes the flow identity, brand name, configured limits,
and the record being rendered. List and queue formatters also receive
pagination data, total counts, `hasMoreTickets`, `isTotalTicketsExact`, active
filter IDs, active filter labels, and the available filter options.

### Filter Options

`SupportListFilterOption` fields:

- `id`
- `label`
- `isDefault`
- `variant`
- `activeVariant`
- `className`
- `style`

Customer filter groups:

- `filterOptions.tickets`

Admin filter groups:

- `filterOptions.ticketQueue`
- `filterOptions.assignedWork`
- `filterOptions.liveChatQueue`

Admin ticket filters may provide a backend `filter`, a local `predicate`, or
both. The context includes the agent, agent label, queue slot, and base filter.
Admin live-chat filters work the same way with live-chat queue filters.

### Behavior

Customer behavior fields:

- `recentActivityLimit`
- `ticketListLimit`
- `isOpenLiveChat(session)`
- `canSendLiveChatMessage(session)`

Admin behavior fields:

- `queueLimit`
- `liveChatQueueLimit`
- `assignedWorkLimit`
- `recentActivityLimit`
- `transcriptLimit`
- `priorityOrder`
- `statusTransitions`
- `isTicketResolved(ticket)`
- `getTicketQueueButtonVariant(ticket)`
- `getLiveChatQueueButtonVariant(session)`
- `getAssignedWorkFilter(context)`
- `getRequeuedLiveChatPosition(context)`
- `getRequeuedLiveChatEstimatedWaitMinutes(context)`

`SupportAdminStatusTransitions` fields:

- `assignedTicketStatus`
- `repliedTicketStatus`
- `reopenedTicketStatus`
- `resolvedTicketStatus`

### Button Customizers

`customizeButtons(context)` receives the slot, default buttons, flow identity,
and any current ticket, ticket list, live-chat session, queue list, pagination,
or filter metadata.

Customer button slots:

- `primary`
- `ticket`
- `ticket-list`
- `live-chat-active`
- `live-chat-waiting`
- `live-chat-ended`
- `live-chat-persistent`

Admin button slots:

- `primary`
- `ticket`
- `ticket-queue`
- `assigned-work`
- `live-chat`
- `live-chat-queue`
- `live-chat-persistent`

Return `context.defaultButtons` unchanged to keep a slot as-is.

### Persistent Live-Chat Buttons

`liveChatPersistentButtons(context)` returns buttons that remain available
while the current live-chat session is open.

Customer context includes:

- `session`
- `customer`
- `endLiveChat`
- `refresh`

Admin context includes:

- `session`
- `agent`
- `endLiveChat`
- `refresh`

## Core Types

### Status And Priority Values

`SupportTicketStatus`:

- `new`
- `open`
- `pending-customer`
- `pending-internal`
- `resolved`
- `closed`

`SupportTicketPriority`:

- `low`
- `normal`
- `high`
- `urgent`

`SupportLiveChatStatus`:

- `queued`
- `active`
- `ended`

`SupportLiveChatMessageAuthor`:

- `customer`
- `agent`
- `system`

### `SupportUserIdentity`

Customer identity used for ticket ownership and live-chat matching:

- `id?`
- `name?`
- `email?`
- `company?`

### `SupportAgentIdentity`

Agent identity used for assignment, admin actions, and live-chat ownership:

- `id?`
- `name?`
- `email?`
- `team?`

### `SupportTicket`

Ticket record shared between customer, admin, and adapter flows:

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

### `SupportTicketMessage`

Ticket activity entry:

- `id`
- `author`
- `authorLabel?`
- `body`
- `createdAt`

### `SupportLiveChatSession`

Live-chat record shared by customer and admin flows:

- `id`
- `summary`
- `ticketReference?`
- `requestedBy`
- `queuePosition`
- `estimatedWaitMinutes`
- `status`
- `createdAt`
- `updatedAt?`
- `customer?`
- `agent?`
- `messages?`

### `SupportLiveChatMessage`

Live-chat transcript entry:

- `id`
- `author`
- `authorLabel?`
- `body`
- `createdAt`

## Input Types

Ticket inputs:

- `CreateSupportTicketInput`
- `UpdateSupportTicketInput`
- `AppendSupportTicketMessageInput`

Live-chat inputs:

- `StartSupportLiveChatInput`
- `UpdateSupportLiveChatInput`
- `AppendSupportLiveChatMessageInput`

Utility types:

- `MaybePromise`
- `SupportTextResolver`
- `SupportButtonCustomizer`
- `SupportButtonCustomizationContext`
- `SupportRequestInputButtonOverrides`
- `SupportConfirmationButtonOverrides`
- `SupportTicketListRequest`
- `SupportTicketListResult`
- `SupportTicketListResponse`

## In-Memory Factory Context Types

Use these when customizing the in-memory adapter's generated references,
subjects, IDs, queue positions, wait estimates, matching, or sorting:

- `InMemorySupportTicketReferenceContext`
- `InMemorySupportTicketSubjectContext`
- `InMemorySupportTicketMessageIdContext`
- `InMemorySupportLiveChatIdContext`
- `InMemorySupportLiveChatMessageIdContext`
- `InMemorySupportLiveChatQueueContext`
- `InMemorySupportLiveChatWaitContext`
- `InMemorySupportFlowAdapterOptions`
