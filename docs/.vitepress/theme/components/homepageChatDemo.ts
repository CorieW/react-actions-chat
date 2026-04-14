import React, { createElement, useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type {
  ChatTheme,
  InputMessage,
  MessageButton,
} from 'react-actions-chat';
import {
  Chat,
  createButton,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
  useChatStore,
  useInputFieldStore,
  usePersistentButtonStore,
} from 'react-actions-chat';
import chatStyles from '../../../../src/styles.css?inline';

const HOMEPAGE_CHAT_THEME: ChatTheme = {
  primaryColor: 'var(--vp-c-brand-3, #5672cd)',
  secondaryColor: 'var(--vp-c-bg-soft, #f6f6f7)',
  backgroundColor: 'var(--vp-c-bg, #ffffff)',
  textColor: 'var(--vp-c-text-1, #242424)',
  borderColor: 'var(--vp-c-divider, #d0d0d7)',
  inputBackgroundColor: 'var(--vp-c-bg, #ffffff)',
  inputTextColor: 'var(--vp-c-text-1, #242424)',
  buttonColor: 'var(--vp-c-brand-3, #5672cd)',
  buttonTextColor: 'var(--vp-button-brand-text, #ffffff)',
};

const EMBEDDED_CHAT_OVERRIDES = `
:host {
  display: block;
  height: 100%;
  font-size: 120%;
}

.asc-homepage-chat {
  height: 100%;
}

.asc-homepage-chat .asc-chat-wrapper {
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider, #d0d0d7);
  border-radius: 24px;
  background: var(--vp-c-bg, #ffffff);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.08),
    0 2px 10px rgba(0, 0, 0, 0.04);
}

.dark .asc-homepage-chat .asc-chat-wrapper,
:host(.dark) .asc-homepage-chat .asc-chat-wrapper {
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.35),
    0 2px 12px rgba(0, 0, 0, 0.22);
}

.asc-homepage-chat .h-screen {
  height: 100%;
  min-height: 0;
}

.asc-homepage-chat .flex-row > .max-w-\\[85\\%\\] > .rounded-lg {
  background: color-mix(
    in srgb,
    var(--vp-c-default-soft, #f6f6f7) 72%,
    var(--vp-c-bg, #ffffff)
  ) !important;
  color: var(--vp-c-text-1, #242424) !important;
  border: 1px solid var(--vp-c-divider, #d0d0d7);
}

.asc-homepage-chat .flex-row-reverse > .max-w-\\[85\\%\\] > .rounded-lg {
  background: color-mix(
    in srgb,
    var(--vp-c-brand-3, #5672cd) 92%,
    var(--vp-c-brand-2, #3a5ccc)
  ) !important;
  color: var(--vp-button-brand-text, #ffffff) !important;
}

.asc-homepage-chat .flex-row > .max-w-\\[85\\%\\] > .rounded-lg .text-xs {
  color: var(--vp-c-text-2, #52525b) !important;
}

.asc-homepage-chat
  .flex-row-reverse
  > .max-w-\\[85\\%\\]
  > .rounded-lg
  .text-xs {
  color: color-mix(
    in srgb,
    var(--vp-button-brand-text, #ffffff) 78%,
    transparent
  ) !important;
}

.asc-homepage-chat .text-xs {
  font-size: 0.9rem;
  line-height: 1.35;
}

.asc-homepage-chat .text-sm {
  font-size: 1.05rem;
  line-height: 1.55;
}

.asc-homepage-chat .text-base {
  font-size: 1.2rem;
  line-height: 1.55;
}
`;

const EMAIL_CAPTURE_BUTTON_DEF = createRequestInputButtonDef({
  initialLabel: 'Collect an email',
  inputPromptMessage:
    'Drop in an email address and the demo will validate it with the package input helper.',
  inputType: 'email',
  placeholder: 'you@example.com',
  inputDescription: 'This stays local to the docs demo. Try hello@example.com.',
  validator: value => {
    const trimmedValue = value.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
      return 'Enter a valid email address to continue.';
    }

    return true;
  },
  onSuccess: emailAddress => {
    addAssistantMessage(
      `Nice. ${emailAddress.trim()} passed validation, and the chat input switched into an email-specific flow without leaving the shared composer.`,
      createPrimaryButtons('input')
    );
  },
});

const RESET_DEMO_BUTTON_DEF = createRequestConfirmationButtonDef({
  initialLabel: 'Reset demo',
  confirmationMessage:
    'Reset the embedded transcript and start the homepage preview from the beginning?',
  confirmLabel: 'Reset',
  rejectLabel: 'Keep going',
  variant: 'dull',
  onSuccess: () => {
    replaceTranscriptWithInitialState();
  },
});

/**
 * Clears the shared stores so the homepage demo starts from a clean state.
 */
function resetHomepageDemoState(): void {
  const chatStore = useChatStore.getState();
  const inputFieldStore = useInputFieldStore.getState();
  const persistentButtonStore = usePersistentButtonStore.getState();

  chatStore.clearMessages();
  chatStore.clearLoading();
  persistentButtonStore.clearButtons();
  inputFieldStore.resetInputField();
  inputFieldStore.resetInputFieldValue();
  inputFieldStore.resetInputFieldDescription();
  inputFieldStore.resetInputFieldType();
  inputFieldStore.resetInputFieldPlaceholder();
  inputFieldStore.resetInputFieldValidator();
}

/**
 * Returns the latest raw message written by the user.
 */
function getLatestUserMessage(): string | undefined {
  const messages = useChatStore.getState().getMessages();
  const latestSelfMessage = [...messages]
    .reverse()
    .find(message => message.type === 'self');

  return latestSelfMessage?.rawContent;
}

/**
 * Builds a callback that routes free-form follow-up input through the local demo logic.
 */
function createConversationCallback(): () => void {
  return () => {
    const latestUserMessage = getLatestUserMessage();

    if (latestUserMessage) {
      respondToFreeformMessage(latestUserMessage);
    }
  };
}

/**
 * Adds an assistant message and keeps the demo ready for the next turn.
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
 * Creates the transcript shown when the homepage demo first loads or resets.
 */
function createInitialMessages(): readonly InputMessage[] {
  return [
    {
      type: 'other',
      content:
        'Hi! I am the docs homepage demo. Ask about theming, guided actions, or input validation, or tap a quick action to explore the package.',
      buttons: createPrimaryButtons(),
      userResponseCallback: createConversationCallback(),
    },
  ];
}

/**
 * Replaces the current transcript with the initial homepage demo state.
 */
function replaceTranscriptWithInitialState(): void {
  resetHomepageDemoState();
  useChatStore.getState().addMessages(createInitialMessages());
}

/**
 * Creates the main quick actions shown throughout the homepage demo.
 */
function createPrimaryButtons(
  activeTopic?: 'actions' | 'input' | 'theme'
): readonly MessageButton[] {
  const buttons: MessageButton[] = [];

  if (activeTopic !== 'actions') {
    buttons.push(
      createButton({
        label: 'Guided actions',
        onClick: () => {
          addAssistantMessage(
            'Each assistant reply can offer follow-up buttons, so the chat can branch into support flows without making the UI feel like a form wizard.',
            createPrimaryButtons('actions')
          );
        },
      })
    );
  }

  if (activeTopic !== 'input') {
    buttons.push(createButton(EMAIL_CAPTURE_BUTTON_DEF));
  }

  if (activeTopic !== 'theme') {
    buttons.push(
      createButton({
        label: 'Docs-matched theme',
        onClick: () => {
          addAssistantMessage(
            'This embed maps the chat theme to VitePress tokens like --vp-c-brand-1, --vp-c-bg-alt, and --vp-c-text-1, so it stays aligned with the docs palette in both light and dark modes.',
            createPrimaryButtons('theme')
          );
        },
      })
    );
  }

  buttons.push(
    createButton(RESET_DEMO_BUTTON_DEF, {
      onReject: () => {
        addAssistantMessage(
          'Sounds good. I will keep the current demo conversation right where it is.',
          createPrimaryButtons(activeTopic)
        );
      },
    })
  );

  return buttons;
}

/**
 * Responds to free-form user input with a small deterministic demo flow.
 */
function respondToFreeformMessage(message: string): void {
  const normalizedMessage = message.trim().toLowerCase();

  if (normalizedMessage === '') {
    addAssistantMessage(
      'Type a question or use one of the quick actions below to explore the component.',
      createPrimaryButtons()
    );
    return;
  }

  if (/(hello|hi|hey)/.test(normalizedMessage)) {
    addAssistantMessage(
      'Hello! This preview is powered by the actual chat component, not a static mock. You can ask about the theme, buttons, or validation helpers.',
      createPrimaryButtons()
    );
    return;
  }

  if (/(theme|color|brand|docs|dark|light)/.test(normalizedMessage)) {
    addAssistantMessage(
      'The homepage embed uses docs theme variables directly, which keeps the chat colors synchronized with VitePress instead of duplicating a second palette.',
      createPrimaryButtons('theme')
    );
    return;
  }

  if (/(input|email|validate|validation)/.test(normalizedMessage)) {
    addAssistantMessage(
      'The shared input field can switch types and validators on demand. Try the Collect an email action to see the input-request helper in motion.',
      createPrimaryButtons('input')
    );
    return;
  }

  if (/(button|action|flow|guided)/.test(normalizedMessage)) {
    addAssistantMessage(
      'Guided actions let you offer next-step buttons in context, which is especially useful for support flows like refunds, order tracking, and account recovery.',
      createPrimaryButtons('actions')
    );
    return;
  }

  addAssistantMessage(
    'This homepage demo keeps the logic local and deterministic, but it uses the same chat primitives you would wire to real support workflows in an app.',
    createPrimaryButtons()
  );
}

/**
 * React app mounted into the docs homepage preview.
 */
function HomepageChatDemoApp(): React.JSX.Element {
  const initialMessagesRef = useRef<readonly InputMessage[]>([]);

  if (initialMessagesRef.current.length === 0) {
    initialMessagesRef.current = createInitialMessages();
  }

  useEffect(() => {
    return () => {
      resetHomepageDemoState();
    };
  }, []);

  return createElement(
    'div',
    { className: 'asc-homepage-chat' },
    createElement(Chat, {
      initialMessages: initialMessagesRef.current,
      theme: HOMEPAGE_CHAT_THEME,
    })
  );
}

/**
 * Mounts the React homepage demo inside an isolated shadow root.
 *
 * The chat stylesheet includes global resets, so the shadow boundary keeps the
 * docs shell and the embedded demo from affecting each other.
 */
export function mountHomepageChatDemo(hostElement: HTMLDivElement): () => void {
  const shadowRoot = hostElement.attachShadow({ mode: 'open' });
  const styleElement = document.createElement('style');
  const mountPoint = document.createElement('div');
  let root: Root | undefined;

  styleElement.textContent = `${chatStyles}\n${EMBEDDED_CHAT_OVERRIDES}`;
  mountPoint.style.height = '100%';

  shadowRoot.append(styleElement, mountPoint);
  root = createRoot(mountPoint);
  root.render(createElement(HomepageChatDemoApp));

  return () => {
    root?.unmount();
    resetHomepageDemoState();
    shadowRoot.replaceChildren();
  };
}
