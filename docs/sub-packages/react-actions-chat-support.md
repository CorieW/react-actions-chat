# `react-actions-chat-support`

`react-actions-chat-support` turns the core chat UI into a two-sided support
desk: a customer can open a ticket or ask for live chat, and an agent can work
the same records from an admin queue.

It is useful when you want the conversation to feel guided, but the data to
stay real. Tickets have references, priorities, statuses, messages, customers,
assignees, tags, and live-chat handoffs. Both flows read and write through the
same adapter contract, so the package can start as a local demo and later point
at your help desk backend. Long-running adapter and callback operations show
the shared chat loading indicator while the database response is still pending.

## Installation

```bash
npm install react-actions-chat react-actions-chat-support
```

## What It Adds

- `createSupportUserFlow(...)` for customer ticketing and live-chat handoff.
- `createSupportAdminFlow(...)` for queue triage, assignment, replies,
  priority changes, live-chat handling, and resolution.
- `createInMemorySupportFlowAdapter(...)` for demos, tests, and local
  prototypes.
- Shared types for support identities, tickets, ticket messages, live-chat
  sessions, filters, callbacks, formatters, and button customization.

## How The Desk Feels

### Customer Side

The customer flow starts with support options that reflect what the backend can
do. If ticket creation is available, customers see `Start ticket`. If live chat
is available, they see `Start live chat`. If the customer already has tickets,
they can reopen a ticket summary, inspect recent activity, add more detail, or
refresh status.

Live chat is also stateful. Customers submit an opening message, enter a queue,
see their position and wait estimate, and keep persistent actions such as
refresh or end chat while the session is active.

### Admin Side

The admin flow opens as an operations queue. Agents can review the ticket queue,
open assigned work, inspect a ticket by reference, join live chats, reply in the
shared input bar, assign tickets, change priority, reopen resolved tickets, or
resolve work behind a confirmation step.

Queue views are not just lists of buttons. They can be paginated, filtered,
formatted with your own markdown, and styled by status or priority through
button variants.

## Minimal Wiring

Use one adapter instance for every support workspace that should share state.

```tsx typecheck
import { Chat } from 'react-actions-chat';
import {
  createInMemorySupportFlowAdapter,
  createSupportAdminFlow,
  createSupportUserFlow,
} from 'react-actions-chat-support';
import 'react-actions-chat/styles';

const adapter = createInMemorySupportFlowAdapter();

const customerFlow = createSupportUserFlow({
  adapter,
  customer: {
    id: 'customer-1',
    name: 'Alex Morgan',
    email: 'alex@example.com',
  },
  brandName: 'Harbor Support',
});

const adminFlow = createSupportAdminFlow({
  adapter,
  agent: {
    id: 'agent-1',
    name: 'Morgan Admin',
    email: 'morgan@example.com',
  },
  brandName: 'Harbor Ops',
});

export function CustomerSupportChat() {
  return <Chat initialMessages={customerFlow.initialMessages} />;
}

export function AdminSupportChat() {
  return <Chat initialMessages={adminFlow.initialMessages} />;
}
```

For a single chat mounted on a page, pass `flow.initialMessages` into `Chat`.
For a long-lived dashboard that switches between customer and admin views,
follow the reset pattern in [Build a support desk](../guides/build-a-support-desk.md)
so the shared chat stores do not carry transcript or input state across
workspaces.

## Adapter First

The package is intentionally adapter-shaped:

- customer flow calls create, list, read, append, and live-chat methods
- admin flow calls queue, assignment, update, append, live-chat, and resolution
  methods
- both flows accept synchronous or async implementations
- callbacks can override individual operations without replacing the whole
  adapter

Start with `createInMemorySupportFlowAdapter(...)` when you want a realistic
demo. Replace it with your own `SupportFlowAdapter` when the backend is ready.
Use `callbacks` when one flow should route a few operations differently from
the shared adapter.

## Customization Map

Use the default flows as the backbone, then customize the pieces your product
owns:

- `labels` changes button labels, placeholders, live-chat copy, and admin
  prompts.
- `requestInputs` changes request-input prompts, placeholders, input types,
  select options, upload permissions, file validators, cooldowns, timeouts,
  abort behavior, variants, class names, and styles.
- `validation` applies text validation to ticket summaries, ticket details,
  ticket replies, ticket assignment, and live-chat messages.
- `confirmations` changes admin confirmation copy and styling for ticket
  resolution.
- `formatters` replaces the markdown used for opening messages, ticket
  summaries, full activity, queue lists, transcript details, and completion
  states.
- `filterOptions` adds selectable filters for customer ticket lists, admin
  ticket queues, admin assigned work, and admin live-chat queues.
- `behavior` changes limits, priority ordering, admin status transitions,
  queue button variants, live-chat send/open predicates, assigned-work filters,
  and live-chat requeue math.
- `customizeButtons` receives every default button slot so you can remove,
  append, reorder, or replace actions.
- `liveChatPersistentButtons` adds or replaces buttons that remain available
  while a live-chat session is open.

## Practical Patterns

### Seed A Demo Queue

Use seeded tickets and live chats to make demos feel like an actual desk rather
than an empty shell.

```ts typecheck
import { createInMemorySupportFlowAdapter } from 'react-actions-chat-support';

const createdAt = new Date('2026-04-30T12:00:00Z');

const adapter = createInMemorySupportFlowAdapter({
  tickets: [
    {
      reference: 'SUP-2042',
      subject: 'Duplicate renewal invoice',
      summary: 'The workspace was charged twice after a seat change.',
      customer: {
        id: 'customer-1',
        name: 'Alex Morgan',
        email: 'alex@example.com',
      },
      status: 'open',
      priority: 'high',
      liveChatOffered: false,
      createdAt,
      updatedAt: createdAt,
      messages: [
        {
          id: 'seed-message-1',
          author: 'customer',
          body: 'The workspace was charged twice after a seat change.',
          createdAt,
        },
      ],
    },
  ],
  nextTicketNumber: 2043,
});
```

### Add Queue Filters

Filters can call the backend with a `filter` object, trim client-side results
with `predicate`, or do both. With backend-paged ticket responses, local
predicates read through later backend pages so matching tickets remain reachable.

```ts typecheck
import {
  createSupportAdminFlow,
  type SupportFlowAdapter,
} from 'react-actions-chat-support';

declare const adapter: SupportFlowAdapter;

createSupportAdminFlow({
  adapter,
  agent: {
    id: 'agent-1',
    name: 'Morgan Admin',
  },
  filterOptions: {
    ticketQueue: [
      {
        id: 'all-open',
        label: 'All open',
        isDefault: true,
      },
      {
        id: 'urgent',
        label: 'Urgent',
        filter: {
          statuses: ['new', 'open', 'pending-internal'],
        },
        predicate: ticket => ticket.priority === 'urgent',
        variant: 'error',
        activeVariant: 'error',
      },
    ],
  },
});
```

### Page Tickets From A Backend

Ticket-listing methods may return either the full legacy ticket array or a
paged result. Use the second `request` argument when your database can only
read part of a larger ticket set at one time.

```ts typecheck
import {
  createSupportAdminFlow,
  type SupportTicket,
} from 'react-actions-chat-support';

declare const allTickets: readonly SupportTicket[];

createSupportAdminFlow({
  callbacks: {
    listTicketQueue: (_filter, request) => {
      const offset = request?.offset ?? 0;
      const limit = request?.limit ?? 50;

      return {
        tickets: allTickets.slice(offset, offset + limit),
        totalTickets: allTickets.length,
        nextOffset: offset + limit,
      };
    },
  },
  agent: {
    id: 'agent-1',
    name: 'Morgan Admin',
  },
});
```

### Rewrite The Transcript

Formatters receive the flow identity, brand name, limits, active filters, and
the ticket or live-chat record being rendered.

```ts typecheck
import {
  createSupportUserFlow,
  type SupportFlowAdapter,
} from 'react-actions-chat-support';

declare const adapter: SupportFlowAdapter;

createSupportUserFlow({
  adapter,
  customer: {
    id: 'customer-1',
    name: 'Alex Morgan',
  },
  formatters: {
    ticketSummary: ({ ticket }) => {
      return [
        `### ${ticket.reference}: ${ticket.subject}`,
        `Status: **${ticket.status}**`,
        `Priority: **${ticket.priority}**`,
        '',
        ticket.summary,
      ].join('\n');
    },
  },
});
```

## Use It When

Use this package when your chat should operate on support records instead of
only branching through scripted messages:

- customer-side ticket creation and status lookup
- agent-side queue review and assignment
- ticket replies, priority changes, reopen, and resolve actions
- live-chat queue review and shared transcripts
- local demos that need realistic support state before the backend exists
- products that need a clean adapter boundary for tests and production

Use the core package alone when your support experience is fully custom and you
do not need reusable ticket, queue, or live-chat primitives.

## Read Next

- [Build a support desk](../guides/build-a-support-desk.md)
- [Support API reference](../reference/support-api.md)
- [Sub-packages overview](./index.md)
- [Examples guide](../examples.md)

The runnable demo for this package lives at
[examples/support-desk](https://github.com/CorieW/react-actions-chat/tree/main/examples/support-desk).
