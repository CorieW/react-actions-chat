import { useMemo } from 'react';
import type {
  ChatTheme,
  InputMessage,
  MessageButton,
} from 'actionable-support-chat';
import {
  Chat,
  createButton,
  createRequestInputButtonDef,
  useChatStore,
} from 'actionable-support-chat';

const SUPPORT_THEME: ChatTheme = {
  primaryColor: '#1f8a70',
  secondaryColor: '#133833',
  backgroundColor: '#081c1b',
  textColor: '#e8f3ef',
  borderColor: '#1c4c45',
  inputBackgroundColor: '#0d2b28',
  inputTextColor: '#f4fbf8',
  buttonColor: '#f2a65a',
  buttonTextColor: '#1f1305',
};

const ORDER_NUMBER_PATTERN = /^AS-\d{4}$/i;
const GREETING_PATTERN = /\b(hello|hi|hey)\b/i;

const ORDER_STATUS_UPDATES = [
  {
    status: 'confirmed',
    eta: 'Estimated arrival: tomorrow before 6 PM.',
    note: 'Your label has been created and the parcel is waiting for carrier pickup.',
  },
  {
    status: 'in transit',
    eta: 'Estimated arrival: in 2 business days.',
    note: 'The package left our regional warehouse and is moving through the network.',
  },
  {
    status: 'out for delivery',
    eta: 'Estimated arrival: today by 8 PM.',
    note: 'The package is already on the final courier route.',
  },
  {
    status: 'delivered',
    eta: 'Delivered earlier today.',
    note: 'If you cannot find it, check the mailbox area or building reception first.',
  },
] as const;

/**
 * Returns the most recent user-authored message so the example can keep a
 * lightweight conversation loop without extra component state.
 */
function getLatestUserMessage(): string | undefined {
  const messages = useChatStore.getState().getMessages();
  const lastSelfMessage = [...messages]
    .reverse()
    .find(message => message.type === 'self');

  return lastSelfMessage?.rawContent;
}

/**
 * Creates the callback attached to assistant messages so free-form follow-up
 * questions stay routed through the same local rule set.
 */
function createConversationCallback(): () => void {
  return () => {
    const latestUserMessage = getLatestUserMessage();

    if (latestUserMessage) {
      handleQuestion(latestUserMessage);
    }
  };
}

/**
 * Adds an assistant message and keeps the example ready for the next question.
 */
function addAssistantMessage(
  content: string,
  buttons: readonly MessageButton[] = createPrimaryButtons()
): void {
  useChatStore.getState().addMessage({
    type: 'other',
    content,
    buttons,
    userResponseCallback: createConversationCallback(),
  });
}

/**
 * Builds a deterministic order status update from a demo order number.
 */
function buildOrderStatusMessage(orderNumber: string): string {
  const normalizedOrderNumber = orderNumber.trim().toUpperCase();
  const orderDigits = Number(normalizedOrderNumber.slice(3));
  const orderStatus =
    ORDER_STATUS_UPDATES[orderDigits % ORDER_STATUS_UPDATES.length] ??
    ORDER_STATUS_UPDATES[0];

  return `${normalizedOrderNumber} is ${orderStatus.status}. ${orderStatus.note} ${orderStatus.eta}`;
}

function createShippingButtons(): readonly MessageButton[] {
  return [
    createButton({
      label: 'US and Canada',
      onClick: () => {
        addAssistantMessage(
          'Standard delivery takes 3 to 5 business days in the US and Canada. Express shipping usually arrives the next business day if the order is placed before 2 PM local time.',
          createPrimaryButtons('shipping')
        );
      },
    }),
    createButton({
      label: 'Europe',
      onClick: () => {
        addAssistantMessage(
          'Most European orders arrive in 4 to 7 business days. Customs processing can add an extra day for non-EU destinations.',
          createPrimaryButtons('shipping')
        );
      },
    }),
    createButton({
      label: 'Rest of world',
      onClick: () => {
        addAssistantMessage(
          'International orders outside North America and Europe usually arrive in 7 to 12 business days. Tracking updates can pause briefly while the parcel changes carriers.',
          createPrimaryButtons('shipping')
        );
      },
    }),
  ];
}

const ORDER_LOOKUP_BUTTON_DEF = createRequestInputButtonDef({
  initialLabel: 'Track an order',
  inputPromptMessage:
    'Share your demo order number in the format AS-1234 and I will check the latest status.',
  placeholder: 'AS-2048',
  inputDescription:
    'This example uses local demo data only. Try AS-2048, AS-4812, or AS-1703.',
  validator: value => {
    if (!ORDER_NUMBER_PATTERN.test(value.trim())) {
      return 'Use the format AS-1234 so I can look up the order.';
    }

    return true;
  },
  onSuccess: orderNumber => {
    addAssistantMessage(
      buildOrderStatusMessage(orderNumber),
      createPrimaryButtons('tracking')
    );
  },
});

const HUMAN_SUPPORT_BUTTON_DEF = createRequestInputButtonDef({
  initialLabel: 'Talk to a person',
  inputPromptMessage:
    'Drop in the best email for follow-up and I will queue a support handoff.',
  inputType: 'email',
  placeholder: 'you@example.com',
  inputDescription:
    'This is a demo, so no email is actually sent. It just shows a realistic handoff step.',
  validator: value => {
    const trimmedValue = value.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue);

    if (!isValidEmail) {
      return 'Please enter a valid email address.';
    }

    return true;
  },
  onSuccess: email => {
    addAssistantMessage(
      `Thanks. I queued a follow-up for ${email.trim()}. In a production setup, this is where you would create a support ticket or hand the chat to a live agent.`,
      createPrimaryButtons('human')
    );
  },
});

/**
 * Creates the reusable quick actions shown throughout the demo.
 */
function createPrimaryButtons(
  activeTopic?: 'tracking' | 'refund' | 'shipping' | 'billing' | 'human'
): readonly MessageButton[] {
  const buttons: MessageButton[] = [];

  if (activeTopic !== 'tracking') {
    buttons.push(createButton(ORDER_LOOKUP_BUTTON_DEF));
  }

  if (activeTopic !== 'refund') {
    buttons.push(
      createButton({
        label: 'Refund policy',
        onClick: () => {
          addAssistantMessage(
            'Refunds are available within 30 days for unused items. Digital purchases are reviewed case by case, and approved refunds usually appear on the original payment method within 5 to 10 business days.',
            createPrimaryButtons('refund')
          );
        },
      })
    );
  }

  if (activeTopic !== 'shipping') {
    buttons.push(
      createButton({
        label: 'Shipping times',
        onClick: () => {
          addAssistantMessage(
            'I can break shipping times down by region. Choose the destination that matches your order.',
            createShippingButtons()
          );
        },
      })
    );
  }

  if (activeTopic !== 'billing') {
    buttons.push(
      createButton({
        label: 'Billing help',
        onClick: () => {
          addAssistantMessage(
            'For billing questions, I can help explain invoices, charges, and subscription renewals. Charges usually appear instantly, while invoice PDFs are generated within a few minutes of payment.',
            createPrimaryButtons('billing')
          );
        },
      })
    );
  }

  if (activeTopic !== 'human') {
    buttons.push(createButton(HUMAN_SUPPORT_BUTTON_DEF));
  }

  return buttons;
}

/**
 * Responds to free-form questions using a small local intent matcher so the
 * example feels more like a support assistant than a plain echo bot.
 */
function handleQuestion(question: string): void {
  const trimmedQuestion = question.trim();
  const normalizedQuestion = trimmedQuestion.toLowerCase();
  const detectedOrderNumber = trimmedQuestion.match(/AS-\d{4}/i)?.[0];

  if (GREETING_PATTERN.test(trimmedQuestion)) {
    addAssistantMessage(
      'Hello! I can help with order tracking, refunds, billing questions, or a support handoff. You can type naturally or use one of the quick actions below.',
      createPrimaryButtons()
    );
    return;
  }

  if (normalizedQuestion.includes('thank')) {
    addAssistantMessage(
      'You are welcome. If you want to keep exploring the demo, try tracking an order or asking about refunds, shipping, or billing.',
      createPrimaryButtons()
    );
    return;
  }

  if (detectedOrderNumber) {
    addAssistantMessage(
      buildOrderStatusMessage(detectedOrderNumber),
      createPrimaryButtons('tracking')
    );
    return;
  }

  if (
    normalizedQuestion.includes('track') ||
    normalizedQuestion.includes('order') ||
    normalizedQuestion.includes('delivery')
  ) {
    addAssistantMessage(
      'I can check a demo order right away. Use the order tracker and try AS-2048, AS-4812, or AS-1703.',
      createPrimaryButtons('tracking')
    );
    return;
  }

  if (
    normalizedQuestion.includes('refund') ||
    normalizedQuestion.includes('return') ||
    normalizedQuestion.includes('cancel')
  ) {
    addAssistantMessage(
      'Our demo refund policy allows returns within 30 days for unused items. If the package has already shipped, cancellation becomes a return request instead. Want the policy details or help from a person?',
      [
        createButton({
          label: 'Show policy',
          onClick: () => {
            addAssistantMessage(
              'Refunds are typically processed within 2 business days after approval, and banks can take another 5 to 10 business days to post the credit.',
              createPrimaryButtons('refund')
            );
          },
        }),
        createButton(HUMAN_SUPPORT_BUTTON_DEF),
        createButton(ORDER_LOOKUP_BUTTON_DEF),
      ]
    );
    return;
  }

  if (
    normalizedQuestion.includes('ship') ||
    normalizedQuestion.includes('arrival') ||
    normalizedQuestion.includes('how long')
  ) {
    addAssistantMessage(
      'Shipping speed depends on the destination and delivery method. Choose a region and I will show the typical window.',
      createShippingButtons()
    );
    return;
  }

  if (
    normalizedQuestion.includes('bill') ||
    normalizedQuestion.includes('invoice') ||
    normalizedQuestion.includes('charge') ||
    normalizedQuestion.includes('price') ||
    normalizedQuestion.includes('subscription')
  ) {
    addAssistantMessage(
      'I can help with billing basics. Charges appear immediately, renewal reminders go out 3 days before renewal, and invoice PDFs are usually ready a few minutes after a successful payment.',
      createPrimaryButtons('billing')
    );
    return;
  }

  if (
    normalizedQuestion.includes('human') ||
    normalizedQuestion.includes('agent') ||
    normalizedQuestion.includes('person') ||
    normalizedQuestion.includes('contact')
  ) {
    addAssistantMessage(
      'I can collect a follow-up email and simulate a support handoff for you.',
      [
        createButton(HUMAN_SUPPORT_BUTTON_DEF),
        createButton(ORDER_LOOKUP_BUTTON_DEF),
      ]
    );
    return;
  }

  addAssistantMessage(
    `I am a local rules-based demo, so I focus on a small support knowledge base. I could not confidently answer "${trimmedQuestion}" yet, but I can help with order tracking, refunds, shipping times, billing, or a support handoff.`,
    createPrimaryButtons()
  );
}

/**
 * Seeds the example with a guided welcome message.
 */
function createInitialMessages(): readonly InputMessage[] {
  return [
    {
      id: 1,
      type: 'other',
      content:
        'Welcome to the upgraded Q&A bot demo. It still runs entirely in the browser, but now it behaves more like a lightweight support assistant with quick actions and follow-up prompts.',
      timestamp: new Date(),
      buttons: createPrimaryButtons(),
      userResponseCallback: createConversationCallback(),
    },
  ];
}

/**
 * Q&A Bot Example
 *
 * This example demonstrates a richer support-style Q&A bot with:
 * - guided quick actions
 * - deterministic demo order lookup
 * - simple free-form question routing
 * - a more intentional landing experience around the chat component
 */
export function App(): React.JSX.Element {
  const initialMessages = useMemo(() => createInitialMessages(), []);

  return (
    <div className='qa-demo'>
      <main className='qa-demo__shell'>
        <header className='qa-demo__header'>
          <p className='qa-demo__eyebrow'>Q&amp;A Bot Example</p>
          <h1 className='qa-demo__title'>Simple local support demo.</h1>
          <p className='qa-demo__description'>
            Ask naturally or try a prompt like “Where is order AS-2048?”, “What
            is your refund policy?”, or “I need billing help”.
          </p>
        </header>

        <div className='qa-demo__chat-frame'>
          <Chat
            initialMessages={initialMessages}
            theme={SUPPORT_THEME}
          />
        </div>
      </main>
    </div>
  );
}
