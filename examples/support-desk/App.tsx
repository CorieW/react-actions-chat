import { useState } from 'react';
import type { ChatTheme } from 'react-actions-chat';
import {
  Chat,
  useChatGlobalsStore,
  useChatStore,
  useInputFieldStore,
  usePersistentButtonStore,
} from 'react-actions-chat';
import {
  createSupportAdminFlow,
  createSupportUserFlow,
  type SupportAdminFlowBehavior,
  type SupportLiveChatSession,
  type SupportTicket,
  type SupportUserFlowBehavior,
  type SupportUserIdentity,
} from 'react-actions-chat-support';
import {
  createFakeSupportDatabase,
  FAKE_DATABASE_MAX_TICKET_ROWS,
} from './fakeSupportDatabase';

type DemoView = 'customer' | 'admin';

const CUSTOMER_IDENTITY = {
  id: 'customer-alex',
  name: 'Alex Morgan',
  email: 'alex@harborhq.test',
  company: 'Harbor HQ',
};

const AGENT_IDENTITY = {
  id: 'agent-morgan',
  name: 'Morgan Admin',
  email: 'morgan@harborhq.test',
  team: 'Revenue Ops',
};

const SUPPORT_PAGE_SIZE = 4;

const CUSTOMER_FLOW_BEHAVIOR: SupportUserFlowBehavior = {
  ticketListLimit: SUPPORT_PAGE_SIZE,
};

const ADMIN_FLOW_BEHAVIOR: SupportAdminFlowBehavior = {
  queueLimit: SUPPORT_PAGE_SIZE,
  assignedWorkLimit: SUPPORT_PAGE_SIZE,
  liveChatQueueLimit: SUPPORT_PAGE_SIZE,
};

const CUSTOMER_THEME: ChatTheme = {
  primaryColor: '#0f766e',
  secondaryColor: '#0b1f24',
  backgroundColor: '#06171a',
  textColor: '#e6fffb',
  borderColor: '#155e63',
  inputBackgroundColor: '#0d2a31',
  inputTextColor: '#f5fffd',
  buttonColor: '#f4b860',
  buttonTextColor: '#211405',
};

const ADMIN_THEME: ChatTheme = {
  primaryColor: '#b45309',
  secondaryColor: '#23140a',
  backgroundColor: '#170b05',
  textColor: '#fff4ea',
  borderColor: '#7c3f12',
  inputBackgroundColor: '#29140b',
  inputTextColor: '#fff8f2',
  buttonColor: '#58c2a4',
  buttonTextColor: '#082019',
};

const CUSTOMER_NOTES = [
  'Open a ticket and switch to the admin console to review it.',
  'Start a live chat and watch the same session appear in the admin queue.',
  `Ticket reads are capped at ${FAKE_DATABASE_MAX_TICKET_ROWS} rows to mimic a constrained database.`,
  'Reset the workspace whenever you want a fresh fake database.',
];

const ADMIN_NOTES = [
  'Review the shared ticket queue from the same fake database.',
  'Assign ownership, reply to customers, and resolve tickets.',
  `Queue pagination keeps fetching through ${FAKE_DATABASE_MAX_TICKET_ROWS}-ticket database pages.`,
  'Join queued live chats after the fake read delay resolves.',
];

const DEMO_LIVE_CHAT_CUSTOMERS: readonly SupportUserIdentity[] = [
  {
    id: 'customer-jordan',
    name: 'Jordan Lee',
    email: 'jordan@harborhq.test',
    company: 'Harbor HQ',
  },
  {
    id: 'customer-riley',
    name: 'Riley Chen',
    email: 'riley@harborhq.test',
    company: 'Harbor HQ',
  },
  {
    id: 'customer-sam',
    name: 'Sam Rivera',
    email: 'sam@harborhq.test',
    company: 'Harbor HQ',
  },
  {
    id: 'customer-taylor',
    name: 'Taylor Brooks',
    email: 'taylor@harborhq.test',
    company: 'Harbor HQ',
  },
];

interface DemoTicketInput {
  readonly reference: string;
  readonly subject: string;
  readonly summary: string;
  readonly status: SupportTicket['status'];
  readonly priority: SupportTicket['priority'];
  readonly updatedAt: string;
  readonly assignedTo?: string;
}

function createDemoTicket(input: DemoTicketInput): SupportTicket {
  const updatedAt = new Date(input.updatedAt);

  return {
    reference: input.reference,
    subject: input.subject,
    summary: input.summary,
    customer: CUSTOMER_IDENTITY,
    status: input.status,
    priority: input.priority,
    liveChatOffered: false,
    createdAt: new Date(updatedAt.getTime() - 90 * 60 * 1000),
    updatedAt,
    messages: [
      {
        id: `${input.reference.toLowerCase()}-message-1`,
        author: 'customer',
        authorLabel: CUSTOMER_IDENTITY.name,
        body: input.summary,
        createdAt: updatedAt,
      },
    ],
    ...(input.assignedTo ? { assignedTo: input.assignedTo } : {}),
  };
}

function getRequiredDemoLiveChatCustomer(index: number): SupportUserIdentity {
  const customer = DEMO_LIVE_CHAT_CUSTOMERS[index];

  if (!customer) {
    throw new Error(`Missing demo live chat customer at index ${index}.`);
  }

  return customer;
}

function createDemoLiveChat(
  index: number,
  summary: string,
  createdAt: string
): SupportLiveChatSession {
  const customer = getRequiredDemoLiveChatCustomer(index);

  return {
    id: `chat-demo-${(index + 1).toString().padStart(2, '0')}`,
    summary,
    requestedBy: 'customer',
    queuePosition: index + 2,
    estimatedWaitMinutes: 4 + index * 3,
    status: 'queued',
    createdAt: new Date(createdAt),
    updatedAt: new Date(createdAt),
    customer,
    messages: [
      {
        id: `chat-demo-${index + 1}-message-1`,
        author: 'customer',
        authorLabel: customer.name ?? customer.email,
        body: summary,
        createdAt: new Date(createdAt),
      },
    ],
  };
}

const DEMO_TICKETS: readonly SupportTicket[] = [
  createDemoTicket({
    reference: 'SUP-0995',
    subject: 'Invoice PDF export fails after SSO rollout',
    summary:
      'Finance cannot download the invoice PDF after switching the workspace to SSO.',
    status: 'new',
    priority: 'normal',
    updatedAt: '2026-04-30T20:00:00Z',
  }),
  createDemoTicket({
    reference: 'SUP-0996',
    subject: 'Renewal approval notification missing',
    summary:
      'The revenue team expected renewal approval emails but no notifications were delivered.',
    status: 'open',
    priority: 'normal',
    updatedAt: '2026-04-30T19:00:00Z',
  }),
  createDemoTicket({
    reference: 'SUP-0997',
    subject: 'Seat provisioning delayed for analysts',
    summary:
      'Three analysts were added to the workspace but still cannot access reporting.',
    status: 'pending-internal',
    priority: 'normal',
    updatedAt: '2026-04-30T18:00:00Z',
    assignedTo: AGENT_IDENTITY.name,
  }),
  createDemoTicket({
    reference: 'SUP-0998',
    subject: 'Usage dashboard totals look stale',
    summary:
      'The admin dashboard has not reflected the last import of usage records.',
    status: 'open',
    priority: 'normal',
    updatedAt: '2026-04-30T17:00:00Z',
    assignedTo: AGENT_IDENTITY.name,
  }),
  createDemoTicket({
    reference: 'SUP-0999',
    subject: 'Webhook retry settings need review',
    summary:
      'Ops needs help confirming whether failed billing webhooks are retrying.',
    status: 'pending-customer',
    priority: 'normal',
    updatedAt: '2026-04-30T16:00:00Z',
    assignedTo: AGENT_IDENTITY.name,
  }),
];

const DEMO_LIVE_CHATS: readonly SupportLiveChatSession[] = [
  createDemoLiveChat(
    0,
    'Billing approver is blocked on a renewal exception review.',
    '2026-04-30T20:10:00Z'
  ),
  createDemoLiveChat(
    1,
    'Customer success needs confirmation before reopening a closed workspace.',
    '2026-04-30T20:05:00Z'
  ),
  createDemoLiveChat(
    2,
    'Implementation is waiting for a webhook retry answer.',
    '2026-04-30T20:00:00Z'
  ),
  createDemoLiveChat(
    3,
    'Finance needs a handoff before they approve the credit memo.',
    '2026-04-30T19:55:00Z'
  ),
];

function createDemoSupportAdapter(): ReturnType<
  typeof createFakeSupportDatabase
> {
  return createFakeSupportDatabase({
    adapterOptions: {
      tickets: DEMO_TICKETS,
      liveChats: DEMO_LIVE_CHATS,
      nextTicketNumber: 1000,
      nextLiveChatNumber: 1,
      getLiveChatQueuePosition: () => 1,
      getEstimatedWaitMinutes: () => 4,
    },
  });
}

function resetChatStores(): void {
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

export function App(): React.JSX.Element {
  const [activeView, setActiveView] = useState<DemoView>('customer');
  const [adapter, setAdapter] = useState(() => createDemoSupportAdapter());
  const [chatInstance, setChatInstance] = useState(0);

  const flow =
    activeView === 'customer'
      ? createSupportUserFlow({
          adapter,
          customer: CUSTOMER_IDENTITY,
          brandName: 'Harbor Support',
          behavior: CUSTOMER_FLOW_BEHAVIOR,
        })
      : createSupportAdminFlow({
          adapter,
          agent: AGENT_IDENTITY,
          brandName: 'Harbor Ops',
          behavior: ADMIN_FLOW_BEHAVIOR,
        });

  const activeTheme = activeView === 'customer' ? CUSTOMER_THEME : ADMIN_THEME;
  const activeNotes = activeView === 'customer' ? CUSTOMER_NOTES : ADMIN_NOTES;

  function remountChat(update?: () => void): void {
    resetChatStores();
    update?.();
    setChatInstance(currentValue => currentValue + 1);
  }

  function switchView(nextView: DemoView): void {
    if (nextView === activeView) {
      return;
    }

    remountChat(() => {
      setActiveView(nextView);
    });
  }

  function resetWorkspace(): void {
    remountChat(() => {
      setAdapter(createDemoSupportAdapter());
    });
  }

  return (
    <div className='support-desk-demo'>
      <main className='support-desk-demo__shell'>
        <section className='support-desk-demo__sidebar'>
          <p className='support-desk-demo__eyebrow'>Support Package Demo</p>
          <h1 className='support-desk-demo__title'>Harbor Support Desk</h1>
          <p className='support-desk-demo__description'>
            This example demos a limited fake database and both exported flows
            from <code>react-actions-chat-support</code>. Start in the customer
            inbox, then flip to the admin console to work the same tickets after
            paged reads and delayed writes.
          </p>

          <div className='support-desk-demo__controls'>
            <button
              type='button'
              className={[
                'support-desk-demo__view-button',
                activeView === 'customer' ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={activeView === 'customer'}
              onClick={() => {
                switchView('customer');
              }}
            >
              Customer inbox
            </button>
            <button
              type='button'
              className={[
                'support-desk-demo__view-button',
                activeView === 'admin' ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={activeView === 'admin'}
              onClick={() => {
                switchView('admin');
              }}
            >
              Admin console
            </button>
            <button
              type='button'
              className='support-desk-demo__reset-button'
              onClick={() => {
                resetWorkspace();
              }}
            >
              Reset workspace
            </button>
          </div>

          <section className='support-desk-demo__panel'>
            <h2>
              {activeView === 'customer' ? 'Customer journey' : 'Admin journey'}
            </h2>
            <ul className='support-desk-demo__checklist'>
              {activeNotes.map(note => {
                return <li key={note}>{note}</li>;
              })}
            </ul>
          </section>
        </section>

        <section className='support-desk-demo__workspace'>
          <header className='support-desk-demo__workspace-header'>
            <div>
              <p className='support-desk-demo__workspace-label'>
                {activeView === 'customer' ? 'Customer inbox' : 'Admin console'}
              </p>
              <h2 className='support-desk-demo__workspace-title'>
                {activeView === 'customer'
                  ? 'Customer portal with tickets, help center, and live chat.'
                  : 'Admin queue with assignment, replies, and resolution flows.'}
              </h2>
            </div>
            <div
              className='support-desk-demo__pills'
              aria-label='Demo highlights'
            >
              <span>Shared adapter</span>
              <span>Limited fake DB</span>
              <span>Ticketing</span>
              <span>Live chat</span>
            </div>
          </header>

          <div className='support-desk-demo__chat-frame'>
            <Chat
              key={`${activeView}-${chatInstance}`}
              initialMessages={flow.initialMessages}
              theme={activeTheme}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
