# Build a Support Desk

Use `react-actions-chat-support` when you want customer and admin chat flows to operate on the same underlying ticketing system.

The best runnable reference in this repo is [examples/support-desk/App.tsx](https://github.com/CorieW/react-actions-chat/blob/main/examples/support-desk/App.tsx).

## The Model

The support package is built around one shared adapter:

- `createSupportUserFlow(...)` builds the customer-facing workflow
- `createSupportAdminFlow(...)` builds the agent/admin workflow
- `SupportFlowAdapter` is the contract both flows read and write through

If both flows share the same adapter instance, a ticket created in the customer view is immediately visible in the admin queue.

## Start With an In-Memory Adapter

For prototypes, demos, and tests, start with `createInMemorySupportFlowAdapter(...)`:

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
  useInputFieldStore.getState().resetInputFieldDisabledDefault();
  useInputFieldStore.getState().resetInputFieldDisabledPlaceholderDefault();
  useInputFieldStore.getState().resetInputFieldDisabled();
}

export function App() {
  const [view, setView] = useState<View>('customer');
  const [chatKey, setChatKey] = useState(0);
  const [adapter] = useState(() =>
    createInMemorySupportFlowAdapter({
      nextTicketNumber: 3001,
    })
  );

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

## Why The Adapter Lives In State

Keep the adapter instance stable with state, context, or another long-lived container.

If you recreate the adapter on every render, its in-memory tickets, live chats, and knowledge-base state reset too.

## Why The Store Reset Matters

The chat package uses shared Zustand stores for transcript, input state, globals, and persistent buttons.

If you switch between multiple support workspaces inside the same mounted UI, clear those stores before remounting the next `Chat`.

If each support view lives on its own route and the previous chat unmounts cleanly, you may not need the explicit reset helper.

## Seed Tickets And Articles

The in-memory adapter accepts initial state:

```ts
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
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [
        {
          id: 'seed-message-1',
          author: 'customer',
          body: 'The workspace was charged twice after a seat change.',
          createdAt: new Date(),
        },
      ],
    },
  ],
  nextTicketNumber: 2043,
});
```

This is a good way to demo an existing backlog or start tests from a known queue state.

## Replacing The In-Memory Adapter

When you are ready for a real backend, replace the in-memory adapter with your own `SupportFlowAdapter` implementation:

```ts
import type { SupportFlowAdapter } from 'react-actions-chat-support';

const adapter: SupportFlowAdapter = {
  createTicket: async input => {
    const response = await fetch('/api/support/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    return response.json();
  },
  getTicketByReference: async reference => {
    const response = await fetch(`/api/support/tickets/${reference}`);

    if (response.status === 404) {
      return null;
    }

    return response.json();
  },
  listCustomerTickets: async customer => {
    const response = await fetch(
      `/api/support/tickets?customerId=${customer.id ?? ''}`
    );
    return response.json();
  },
  listQueue: async () => {
    const response = await fetch('/api/support/queue');
    return response.json();
  },
  updateTicket: async input => {
    const response = await fetch('/api/support/tickets/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    return response.json();
  },
  appendTicketMessage: async input => {
    const response = await fetch('/api/support/tickets/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    return response.json();
  },
  searchKnowledgeBase: async query => {
    const response = await fetch(
      `/api/support/articles?q=${encodeURIComponent(query)}`
    );
    return response.json();
  },
  startLiveChat: async input => {
    const response = await fetch('/api/support/live-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    return response.json();
  },
};
```

You do not need to rewrite the customer or admin flow helpers when you swap adapters. That separation is the main benefit of the package.

## Read Next

- [react-actions-chat-support](../sub-packages/react-actions-chat-support.md)
- [Support API reference](../reference/support-api.md)
- [Using chat globals and defaults](./using-chat-globals-and-defaults.md)
