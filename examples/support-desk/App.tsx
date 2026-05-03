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
  'Open a ticket and switch to the admin console to review it.',
  'Start a live chat and watch the same session appear in the admin queue.',
  'Reset the workspace whenever you want a fresh in-memory adapter.',
];

const ADMIN_NOTES = [
  'Review the shared ticket queue from the same adapter instance.',
  'Assign ownership, reply to customers, and resolve tickets.',
  'Join queued live chats without extra example-level glue code.',
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

export function App(): React.JSX.Element {
  const [activeView, setActiveView] = useState<DemoView>('customer');
  const [adapter, setAdapter] = useState(() =>
    createInMemorySupportFlowAdapter()
  );
  const [chatInstance, setChatInstance] = useState(0);

  const flow =
    activeView === 'customer'
      ? createSupportUserFlow({
          adapter,
          customer: CUSTOMER_IDENTITY,
          brandName: 'Harbor Support',
        })
      : createSupportAdminFlow({
          adapter,
          agent: AGENT_IDENTITY,
          brandName: 'Harbor Ops',
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
      setAdapter(createInMemorySupportFlowAdapter());
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
