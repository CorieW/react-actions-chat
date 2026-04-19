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
  createInMemorySupportFlowAdapter,
  createSupportAdminFlow,
  createSupportUserFlow,
  type SupportTicket,
} from 'react-actions-chat-support';

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
  'Open a fresh ticket and watch it appear in the admin queue.',
  'Search the help center before you escalate to a live handoff.',
  'Check the seeded ticket to see how returning customers pick up where they left off.',
];

const ADMIN_NOTES = [
  'Review the shared queue, assign ownership, and reply to the customer.',
  'Offer live chat when the issue needs real-time handling.',
  'Resolve or reopen tickets without leaving the chat surface.',
];

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

function minutesAgo(reference: Date, minutes: number): Date {
  return new Date(reference.getTime() - minutes * 60 * 1000);
}

function buildSeedTickets(now = new Date()): readonly SupportTicket[] {
  return [
    {
      reference: 'SUP-2042',
      subject: 'Duplicate renewal invoice after seat change',
      summary:
        'Our workspace was charged twice after we increased seats before renewal.',
      customer: CUSTOMER_IDENTITY,
      status: 'pending-customer',
      priority: 'high',
      assignedTo: 'Rina Gomez',
      liveChatOffered: true,
      createdAt: minutesAgo(now, 170),
      updatedAt: minutesAgo(now, 24),
      tags: ['billing', 'renewal'],
      messages: [
        {
          id: 'seed-message-2042-1',
          author: 'customer',
          authorLabel: 'Alex Morgan',
          body: 'Our workspace was charged twice after we increased seats before renewal.',
          createdAt: minutesAgo(now, 170),
        },
        {
          id: 'seed-message-2042-2',
          author: 'agent',
          authorLabel: 'Rina Gomez',
          body: 'I confirmed the duplicate charge and queued a refund review with finance.',
          createdAt: minutesAgo(now, 55),
        },
        {
          id: 'seed-message-2042-3',
          author: 'system',
          authorLabel: 'System',
          body: 'Live chat was offered because the billing lock delayed a production launch.',
          createdAt: minutesAgo(now, 24),
        },
      ],
    },
    {
      reference: 'SUP-2041',
      subject: 'SSO login failures after certificate rotation',
      summary:
        'New hires cannot complete SSO sign-in after the latest Okta certificate rotation.',
      customer: {
        id: 'customer-priya',
        name: 'Priya Chen',
        email: 'priya@northwind.test',
        company: 'Northwind',
      },
      status: 'open',
      priority: 'urgent',
      assignedTo: undefined,
      liveChatOffered: false,
      createdAt: minutesAgo(now, 235),
      updatedAt: minutesAgo(now, 18),
      tags: ['sso', 'auth'],
      messages: [
        {
          id: 'seed-message-2041-1',
          author: 'customer',
          authorLabel: 'Priya Chen',
          body: 'New hires cannot complete SSO sign-in after the latest Okta certificate rotation.',
          createdAt: minutesAgo(now, 235),
        },
        {
          id: 'seed-message-2041-2',
          author: 'system',
          authorLabel: 'System',
          body: 'Priority was raised to urgent after the customer reported an onboarding blocker.',
          createdAt: minutesAgo(now, 18),
        },
      ],
    },
  ];
}

function createDemoAdapter() {
  return createInMemorySupportFlowAdapter({
    tickets: buildSeedTickets(),
    nextTicketNumber: 2043,
  });
}

export function App(): React.JSX.Element {
  const [activeView, setActiveView] = useState<DemoView>('customer');
  const [adapter, setAdapter] = useState(() => createDemoAdapter());
  const [chatInstance, setChatInstance] = useState(0);

  const flow =
    activeView === 'customer'
      ? createSupportUserFlow({
          adapter,
          customer: CUSTOMER_IDENTITY,
          brandName: 'Harbor Support',
          initialMessage: [
            '## Harbor Support is ready',
            '',
            'Use the customer inbox to:',
            '',
            '- Open a new request',
            '- Check your existing billing ticket',
            '- Search the help center before you ask for a live handoff',
          ].join('\n'),
        })
      : createSupportAdminFlow({
          adapter,
          agent: AGENT_IDENTITY,
          brandName: 'Harbor Ops',
          initialMessage: [
            '## Harbor Ops is online',
            '',
            'From the admin console you can:',
            '',
            '- Review the shared queue',
            '- Assign yourself work',
            '- Reply to customers and resolve tickets from one place',
          ].join('\n'),
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
      setAdapter(createDemoAdapter());
    });
  }

  return (
    <div className='support-desk-demo'>
      <main className='support-desk-demo__shell'>
        <section className='support-desk-demo__sidebar'>
          <p className='support-desk-demo__eyebrow'>Support Package Demo</p>
          <h1 className='support-desk-demo__title'>Harbor Support Desk</h1>
          <p className='support-desk-demo__description'>
            This example demos the shared adapter and both exported flows from{' '}
            <code>react-actions-chat-support</code>. Start in the customer
            inbox, then flip to the admin console to work the same tickets.
          </p>

          <div className='support-desk-demo__controls'>
            <button
              type='button'
              className={`support-desk-demo__view-button${activeView === 'customer' ? 'is-active' : ''}`}
              aria-pressed={activeView === 'customer'}
              onClick={() => {
                switchView('customer');
              }}
            >
              Customer inbox
            </button>
            <button
              type='button'
              className={`support-desk-demo__view-button${activeView === 'admin' ? 'is-active' : ''}`}
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

          <section className='support-desk-demo__panel'>
            <h2>What is seeded</h2>
            <div className='support-desk-demo__ticket-cards'>
              <article className='support-desk-demo__ticket-card'>
                <strong>SUP-2042</strong>
                <span>Alex Morgan</span>
                <p>
                  High-priority duplicate renewal invoice with live chat already
                  offered.
                </p>
              </article>
              <article className='support-desk-demo__ticket-card'>
                <strong>SUP-2041</strong>
                <span>Priya Chen</span>
                <p>Urgent SSO outage waiting in the admin queue.</p>
              </article>
            </div>
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
              <span>Ticketing</span>
              <span>Live chat</span>
              <span>Queue actions</span>
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
