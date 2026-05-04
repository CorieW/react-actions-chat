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
  type SupportUserFlowBehavior,
} from 'react-actions-chat-support';
import {
  createFakeSupportDatabase,
  FAKE_DATABASE_MAX_TICKET_ROWS,
} from './fakeSupportDatabase';
import { loadSupportDeskSampleData } from './loader';

type DemoView = 'customer' | 'admin';

const SUPPORT_DESK_SAMPLE_DATA = loadSupportDeskSampleData();
const CUSTOMER_IDENTITY = SUPPORT_DESK_SAMPLE_DATA.customerIdentity;
const AGENT_IDENTITY = SUPPORT_DESK_SAMPLE_DATA.agentIdentity;

const SUPPORT_TICKET_PAGE_SIZE = 4;
const SUPPORT_LIVE_CHAT_PAGE_SIZE = 2;

const CUSTOMER_FLOW_BEHAVIOR: SupportUserFlowBehavior = {
  ticketListLimit: SUPPORT_TICKET_PAGE_SIZE,
};

const ADMIN_FLOW_BEHAVIOR: SupportAdminFlowBehavior = {
  queueLimit: SUPPORT_TICKET_PAGE_SIZE,
  assignedWorkLimit: SUPPORT_TICKET_PAGE_SIZE,
  liveChatQueueLimit: SUPPORT_LIVE_CHAT_PAGE_SIZE,
};

const SUPPORT_DESK_THEME: ChatTheme = {
  primaryColor: '#8b5cf6',
  secondaryColor: '#18181b',
  backgroundColor: '#09090b',
  textColor: '#f4f4f5',
  borderColor: '#3f3f46',
  inputBackgroundColor: '#18181b',
  inputTextColor: '#fafafa',
  buttonColor: '#8b5cf6',
  buttonTextColor: '#ffffff',
};

const CUSTOMER_NOTES = [
  'Open a ticket and switch to the admin console to review it.',
  'Start a live chat and watch the same session appear in the admin queue.',
  `Ticket reads are capped at ${FAKE_DATABASE_MAX_TICKET_ROWS} rows to mimic a constrained database.`,
];

const ADMIN_NOTES = [
  'Review the shared ticket queue from the same fake database.',
  'Assign ownership, reply to customers, and resolve tickets.',
  `Queue pagination keeps fetching through ${FAKE_DATABASE_MAX_TICKET_ROWS}-ticket database pages.`,
  'Join queued live chats after the fake read delay resolves.',
];

function createDemoSupportAdapter(): ReturnType<
  typeof createFakeSupportDatabase
> {
  return createFakeSupportDatabase({
    adapterOptions: {
      tickets: SUPPORT_DESK_SAMPLE_DATA.tickets,
      liveChats: SUPPORT_DESK_SAMPLE_DATA.liveChats,
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
              className='support-desk-demo__workspace-actions'
              aria-label='Workspace actions'
            >
              <div
                className='support-desk-demo__pills'
                aria-label='Demo highlights'
              >
                <span>Shared adapter</span>
                <span>Limited fake DB</span>
                <span>Ticketing</span>
                <span>Live chat</span>
              </div>
              <button
                type='button'
                className='support-desk-demo__reset-button'
                onClick={resetWorkspace}
              >
                Reset workspace
              </button>
            </div>
          </header>

          <div className='support-desk-demo__chat-frame'>
            <Chat
              key={`${activeView}-${chatInstance}`}
              initialMessages={flow.initialMessages}
              theme={SUPPORT_DESK_THEME}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
