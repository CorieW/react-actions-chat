# Build a Support Desk

Use `react-actions-chat-support` when the chat should become a real support
workspace: customers create tickets and request live chat, while agents triage
the same records from an admin queue.

The runnable reference in this repo is
[examples/support-desk/App.tsx](https://github.com/CorieW/react-actions-chat/blob/main/examples/support-desk/App.tsx).

## The Finished Shape

A support desk has three moving pieces:

- `createSupportUserFlow(...)` renders the customer experience.
- `createSupportAdminFlow(...)` renders the agent experience.
- `SupportFlowAdapter` is the shared data boundary behind both flows.

When both flows share one adapter instance, a customer-created ticket appears in
the admin queue, admin replies update the ticket transcript, and live-chat
sessions can move from queued to active to ended without rewriting the UI flow.

## Start With An In-Memory Desk

Keep the adapter stable with state, context, or another long-lived container.
If you recreate the in-memory adapter on every render, its tickets and live
chats reset too.

```tsx typecheck
import { useState } from 'react';
import {
  Chat,
  useChatGlobalsStore,
  useChatStore,
  useInputFieldStore,
  usePersistentButtonStore,
} from 'react-actions-chat';
import {
  createInMemorySupportFlowAdapter,
  createSupportAdminFlow,
  createSupportUserFlow,
} from 'react-actions-chat-support';
import 'react-actions-chat/styles';

type View = 'customer' | 'admin';

const CUSTOMER = {
  id: 'customer-1',
  name: 'Alex Morgan',
  email: 'alex@example.com',
};

const AGENT = {
  id: 'agent-1',
  name: 'Morgan Admin',
  email: 'morgan@example.com',
};

function resetChatWorkspace(): void {
  useChatGlobalsStore.getState().resetChatGlobals();
  useChatStore.getState().clearMessages();
  usePersistentButtonStore.getState().clearButtons();
  useInputFieldStore.getState().setInputFieldValue('');
  useInputFieldStore.getState().resetInputFieldDescription();
  useInputFieldStore.getState().resetInputFieldPlaceholder();
  useInputFieldStore.getState().resetInputFieldDisabledPlaceholder();
  useInputFieldStore.getState().resetInputFieldType();
  useInputFieldStore.getState().resetInputFieldValidator();
  useInputFieldStore.getState().resetInputFieldSubmitGuard();
  useInputFieldStore.getState().resetInputFieldFiles();
  useInputFieldStore.getState().resetInputFieldOptions();
  useInputFieldStore.getState().resetInputFieldFileUploadEnabled();
  useInputFieldStore.getState().resetInputFieldDisabledDefault();
  useInputFieldStore.getState().resetInputFieldDisabledPlaceholderDefault();
  useInputFieldStore.getState().resetInputFieldDisabled();
}

export function App() {
  const [view, setView] = useState<View>('customer');
  const [chatKey, setChatKey] = useState(0);
  const [adapter] = useState(() => createInMemorySupportFlowAdapter());

  const flow =
    view === 'customer'
      ? createSupportUserFlow({
          adapter,
          customer: CUSTOMER,
          brandName: 'Harbor Support',
        })
      : createSupportAdminFlow({
          adapter,
          agent: AGENT,
          brandName: 'Harbor Ops',
        });

  function switchView(nextView: View): void {
    if (nextView === view) {
      return;
    }

    resetChatWorkspace();
    setView(nextView);
    setChatKey(current => current + 1);
  }

  return (
    <>
      <button
        type='button'
        onClick={() => {
          switchView('customer');
        }}
      >
        Customer
      </button>
      <button
        type='button'
        onClick={() => {
          switchView('admin');
        }}
      >
        Admin
      </button>

      <Chat
        key={`${view}-${chatKey}`}
        initialMessages={flow.initialMessages}
      />
    </>
  );
}
```

The reset helper matters only when multiple support workspaces reuse the same
mounted chat stores. If customer and admin views live on separate routes and
the old chat unmounts cleanly, a smaller reset may be enough.

## Seed A Queue That Looks Real

Seeded state makes demos and tests easier to understand. Use it for existing
backlogs, live-chat queues, or deterministic snapshots.

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
        company: 'Northstar Labs',
      },
      status: 'open',
      priority: 'high',
      assignedTo: 'Morgan Admin',
      liveChatOffered: false,
      createdAt,
      updatedAt: createdAt,
      tags: ['billing', 'renewal'],
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

Useful in-memory options include `now`, ID factories, default ticket status,
default priority, default queue statuses, customer matching, queue-position
math, wait-time math, and ticket/live-chat sorting.

## Add Filters For Work Modes

Filters show as selectable request-input buttons. A filter can send a backend
filter object, apply a local predicate to returned records, or combine both.

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
    assignedWork: [
      {
        id: 'mine-waiting',
        label: 'Waiting on customer',
        filter: ({ agentLabel }) => ({
          assignedTo: agentLabel,
          statuses: ['pending-customer'],
        }),
      },
    ],
    liveChatQueue: [
      {
        id: 'queued',
        label: 'Queued',
        isDefault: true,
        filter: {
          statuses: ['queued'],
        },
      },
      {
        id: 'customer-started',
        label: 'Customer started',
        filter: {
          requestedBy: 'customer',
          statuses: ['queued', 'active'],
        },
      },
    ],
  },
});
```

Customer ticket lists support the same pattern through
`filterOptions.tickets`, using predicates that receive each ticket and the
customer context.

## Tune The Customer Moment

`requestInputs` controls the actual collection step. This is where you can
change placeholders, descriptions, uploads, validation, cooldowns, timeouts,
input type, and button styling.

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
  labels: {
    startTicket: 'Report an issue',
  },
  validation: {
    ticketSummary: {
      minMessageLength: 20,
      minMessageLengthMessage:
        'Add a few more details so the support team can route this correctly.',
    },
  },
  requestInputs: {
    createTicket: {
      inputPromptMessage:
        'Tell us what happened, what you expected, and any account or workspace details that matter.',
      placeholder: ({ customer }) =>
        `Describe the issue for ${customer.name ?? 'the support team'}`,
      inputDescription: 'Screenshots or receipts can be attached here.',
      allowFileUpload: true,
      showAbort: true,
      abortLabel: 'Cancel ticket',
      variant: 'info',
    },
  },
});
```

The same override shape is available for customer ticket details, customer
live-chat starts, admin ticket review, assignment, replies, and priority
changes.

## Shape Admin Operations

Admin behavior controls queue size, transcript size, priority order, status
transitions, queue button variants, assigned-work filters, and live-chat
requeue math.

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
  behavior: {
    queueLimit: 6,
    assignedWorkLimit: 6,
    transcriptLimit: 12,
    priorityOrder: ['urgent', 'high', 'normal', 'low'],
    statusTransitions: {
      assignedTicketStatus: 'open',
      repliedTicketStatus: 'pending-customer',
      reopenedTicketStatus: 'open',
      resolvedTicketStatus: 'resolved',
    },
    getTicketQueueButtonVariant: ticket => {
      if (ticket.priority === 'urgent') {
        return 'error';
      }

      if (ticket.priority === 'high') {
        return 'warning';
      }

      return 'default';
    },
  },
  confirmations: {
    resolveTicket: {
      confirmationMessage: ({ ticket }) =>
        `Resolve ${ticket.reference}? The customer will still be able to view the ticket history.`,
      confirmLabel: 'Resolve ticket',
      rejectLabel: 'Keep open',
      variant: 'success',
    },
  },
});
```

Admin priority changes use the shared input as a dropdown, so the transcript
records the action without adding a custom select component.

## Replace Markdown With Your Voice

Every support message is markdown. Replace only the formatter you need and keep
the rest of the package defaults.

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
  formatters: {
    ticketQueue: ({
      activeFilterLabel,
      totalTickets = 0,
      visibleTickets = [],
    }) => {
      const rows = visibleTickets.map(ticket => {
        return `- **${ticket.reference}** · ${ticket.priority} · ${ticket.subject}`;
      });

      return [
        `### Ticket queue${activeFilterLabel ? `: ${activeFilterLabel}` : ''}`,
        `${totalTickets} ticket${totalTickets === 1 ? '' : 's'} match this view.`,
        '',
        ...rows,
      ].join('\n');
    },
  },
});
```

Formatter context includes the flow identity, brand name, active filters,
pagination metadata, limits, and the current ticket or live-chat record.

## Customize Buttons Without Forking

Use `customizeButtons` when the default action set is mostly right, but a
specific slot needs one extra action or a different order.

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
  customizeButtons: context => {
    if (context.slot !== 'ticket' || !context.ticket) {
      return context.defaultButtons;
    }

    return [
      ...context.defaultButtons,
      {
        label: `Copy ${context.ticket.reference}`,
        variant: 'info',
        onClick: () => {
          void navigator.clipboard.writeText(context.ticket!.reference);
        },
      },
    ];
  },
});
```

Customer slots include `primary`, `ticket`, `ticket-list`,
`live-chat-active`, `live-chat-waiting`, `live-chat-ended`, and
`live-chat-persistent`. Admin slots include `primary`, `ticket`,
`ticket-queue`, `assigned-work`, `live-chat`, `live-chat-queue`, and
`live-chat-persistent`.

## Move To A Backend

When the prototype is ready, keep the flow configuration and replace the
adapter. The full adapter can be synchronous or async.

```ts
import type {
  AppendSupportLiveChatMessageInput,
  AppendSupportTicketMessageInput,
  CreateSupportTicketInput,
  StartSupportLiveChatInput,
  SupportFlowAdapter,
  SupportLiveChatQueueFilter,
  SupportLiveChatSession,
  SupportQueueFilter,
  SupportTicket,
  SupportUserIdentity,
  UpdateSupportLiveChatInput,
  UpdateSupportTicketInput,
} from 'react-actions-chat-support';

async function postJson<TResponse>(
  path: string,
  body: unknown
): Promise<TResponse> {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.json();
}

async function getJson<TResponse>(path: string): Promise<TResponse | null> {
  const response = await fetch(path);

  if (response.status === 404) {
    return null;
  }

  return response.json();
}

export const supportAdapter: SupportFlowAdapter = {
  createTicket: (input: CreateSupportTicketInput) =>
    postJson<SupportTicket>('/api/support/tickets', input),
  getTicketByReference: (reference: string) =>
    getJson<SupportTicket>(
      `/api/support/tickets/${encodeURIComponent(reference)}`
    ),
  listCustomerTickets: (customer: SupportUserIdentity) =>
    postJson<readonly SupportTicket[]>(
      '/api/support/tickets/customer',
      customer
    ),
  listQueue: (filter?: SupportQueueFilter) =>
    postJson<readonly SupportTicket[]>('/api/support/tickets/queue', filter),
  listLiveChatQueue: (filter?: SupportLiveChatQueueFilter) =>
    postJson<readonly SupportLiveChatSession[]>(
      '/api/support/live-chats/queue',
      filter
    ),
  getLiveChatById: (sessionId: string) =>
    getJson<SupportLiveChatSession>(
      `/api/support/live-chats/${encodeURIComponent(sessionId)}`
    ),
  listCustomerLiveChats: (customer: SupportUserIdentity) =>
    postJson<readonly SupportLiveChatSession[]>(
      '/api/support/live-chats/customer',
      customer
    ),
  updateTicket: (input: UpdateSupportTicketInput) =>
    postJson<SupportTicket>('/api/support/tickets/update', input),
  appendTicketMessage: (input: AppendSupportTicketMessageInput) =>
    postJson<SupportTicket>('/api/support/tickets/message', input),
  startLiveChat: (input: StartSupportLiveChatInput) =>
    postJson<SupportLiveChatSession>('/api/support/live-chats', input),
  updateLiveChat: (input: UpdateSupportLiveChatInput) =>
    postJson<SupportLiveChatSession>('/api/support/live-chats/update', input),
  appendLiveChatMessage: (input: AppendSupportLiveChatMessageInput) =>
    postJson<SupportLiveChatSession>('/api/support/live-chats/message', input),
};
```

If one flow needs a special route, use `callbacks` to override only that
operation. For example, customer ticket creation can call a public endpoint
while the admin flow keeps using an authenticated adapter.

## Read Next

- [`react-actions-chat-support`](../sub-packages/react-actions-chat-support.md)
- [Support API reference](../reference/support-api.md)
- [Using chat globals and defaults](./using-chat-globals-and-defaults.md)
- [Examples guide](../examples.md)
