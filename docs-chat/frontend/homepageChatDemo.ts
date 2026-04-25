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
  createMarkdownTextPart,
  createRequestConfirmationButtonDef,
  createTextPart,
  useChatStore,
  useInputFieldStore,
  usePersistentButtonStore,
} from 'react-actions-chat';
import {
  createChatTextGenerationFlow,
  createTextGenerationBackend,
  type ChatTextGenerationFlow,
} from 'react-actions-chat-llms';
import chatStyles from '../../src/styles.css?inline';

const DOCS_ASSISTANT_API_URL =
  import.meta.env.VITE_DOCS_ASSISTANT_API_URL?.trim() ?? '';
const MAX_OUTPUT_TOKENS = 1024;
const MINIMUM_RESPONSE_WAIT_MS = 350;
const RESPONSE_WAIT_PLACEHOLDER = 'Searching the docs...';

const STARTER_PROMPTS = [
  {
    label: 'Tell me about this',
    prompt: 'What is react-actions-chat, and what problems does it help solve?',
  },
  {
    label: 'Getting started',
    prompt: 'How do I get started with react-actions-chat?',
  },
  {
    label: 'Use cases',
    prompt: 'What use cases is react-actions-chat designed for?',
  },
] as const;

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

const DOCS_ASSISTANT_BACKEND = DOCS_ASSISTANT_API_URL
  ? createTextGenerationBackend({
      url: DOCS_ASSISTANT_API_URL,
      headers: () => {
        const docsBaseUrl = buildDocsBaseUrl();

        return docsBaseUrl
          ? {
              'X-Docs-Base-Url': docsBaseUrl,
            }
          : {};
      },
    })
  : null;

let activeAbortController: AbortController | null = null;
let responsePending = false;
let responseCycle: (() => Promise<void>) | null = null;

function waitForMs(durationMs: number): Promise<void> {
  return new Promise(resolve => {
    globalThis.setTimeout(resolve, durationMs);
  });
}

function buildDocsBaseUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return new URL(
    import.meta.env.BASE_URL ?? '/',
    window.location.origin
  ).toString();
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';
}

function abortActiveRequest(): void {
  activeAbortController?.abort();
  activeAbortController = null;
  responsePending = false;
}

const RESET_CHAT_BUTTON_DEF = createRequestConfirmationButtonDef({
  initialLabel: 'Reset chat',
  confirmationMessage:
    'Reset the docs assistant and start a fresh conversation?',
  confirmLabel: 'Reset',
  rejectLabel: 'Keep chat',
  variant: 'dull',
  onSuccess: () => {
    replaceTranscriptWithInitialState();
  },
});

function resetHomepageDemoState(): void {
  abortActiveRequest();

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

function createConversationCallback(): () => void {
  return () => {
    void responseCycle?.();
  };
}

function createResetButton(): MessageButton {
  return createButton(RESET_CHAT_BUTTON_DEF, {
    onReject: () => {
      addAssistantMarkdownMessage(
        'Keeping the current conversation in place. Ask another docs question any time.',
        createResetOnlyButtons()
      );
    },
  });
}

function createResetOnlyButtons(): readonly MessageButton[] {
  return useChatStore.getState().getMessages().length > 1
    ? [createResetButton()]
    : [];
}

function submitSuggestedQuestion(question: string): void {
  if (!DOCS_ASSISTANT_FLOW || responsePending) {
    return;
  }

  const trimmedQuestion = question.trim();

  if (trimmedQuestion === '') {
    return;
  }

  useChatStore.getState().addMessage({
    type: 'self',
    parts: [createTextPart(trimmedQuestion)],
    rawContent: trimmedQuestion,
  });

  void responseCycle?.();
}

function createStarterButtons(): readonly MessageButton[] {
  return STARTER_PROMPTS.map(({ label, prompt }) =>
    createButton({
      label,
      onClick: () => {
        submitSuggestedQuestion(prompt);
      },
    })
  );
}

function createErrorButtons(): readonly MessageButton[] {
  return [...createStarterButtons(), ...createResetOnlyButtons()];
}

function createDocsMarkdownPart(markdown: string) {
  return createMarkdownTextPart(markdown, {
    syntaxHighlighting: true,
  });
}

function addAssistantMarkdownMessage(
  markdown: string,
  buttons: readonly MessageButton[] = createResetOnlyButtons(),
  shouldAcceptFollowUps = true
): void {
  useChatStore.getState().addMessage({
    type: 'other',
    parts: [createDocsMarkdownPart(markdown)],
    buttons,
    ...(shouldAcceptFollowUps && DOCS_ASSISTANT_FLOW
      ? {
          userResponseCallback: createConversationCallback(),
        }
      : {}),
  });
}

function createInitialMessages(): readonly InputMessage[] {
  if (!DOCS_ASSISTANT_FLOW) {
    return [
      {
        type: 'other',
        parts: [
          createDocsMarkdownPart(
            'The live docs assistant is disabled for this build because `VITE_DOCS_ASSISTANT_API_URL` is not configured yet.'
          ),
        ],
      },
    ];
  }

  return [
    {
      type: 'other',
      parts: [
        createTextPart(
          'Ask about the docs, guides, APIs, or examples. I will answer from the documentation and link the sections I used.'
        ),
      ],
      buttons: createStarterButtons(),
      userResponseCallback: createConversationCallback(),
    },
  ];
}

function replaceTranscriptWithInitialState(): void {
  resetHomepageDemoState();
  useChatStore.getState().addMessages(createInitialMessages());
}

const DOCS_ASSISTANT_FLOW: ChatTextGenerationFlow | null =
  DOCS_ASSISTANT_BACKEND
    ? createChatTextGenerationFlow({
        generator: {
          generateText: async request => {
            const abortController = new AbortController();
            activeAbortController = abortController;

            try {
              return await DOCS_ASSISTANT_BACKEND.generateText({
                ...request,
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                signal: abortController.signal,
              });
            } finally {
              if (activeAbortController === abortController) {
                activeAbortController = null;
              }
            }
          },
        },
        createAssistantMessage: result => ({
          type: 'other',
          parts: [createDocsMarkdownPart(result.text)],
          buttons: createResetOnlyButtons(),
          userResponseCallback: createConversationCallback(),
        }),
        createErrorMessage: error => {
          if (isAbortError(error)) {
            return null;
          }

          return {
            type: 'other',
            parts: [
              createTextPart(
                error instanceof Error
                  ? error.message
                  : 'Something went wrong while contacting the docs assistant.'
              ),
            ],
            buttons: createErrorButtons(),
            userResponseCallback: createConversationCallback(),
          };
        },
      })
    : null;

async function runResponseCycle(): Promise<void> {
  if (!DOCS_ASSISTANT_FLOW || responsePending) {
    return;
  }

  responsePending = true;
  const inputFieldStore = useInputFieldStore.getState();
  inputFieldStore.setInputFieldParams({
    disabled: true,
    disabledPlaceholder: RESPONSE_WAIT_PLACEHOLDER,
  });

  try {
    const responseStartTime = Date.now();
    await DOCS_ASSISTANT_FLOW.respond();
    const elapsedResponseTime = Date.now() - responseStartTime;

    if (elapsedResponseTime < MINIMUM_RESPONSE_WAIT_MS) {
      await waitForMs(MINIMUM_RESPONSE_WAIT_MS - elapsedResponseTime);
    }
  } finally {
    inputFieldStore.resetInputFieldDisabled();
    responsePending = false;
  }
}

function HomepageChatDemoApp(): React.JSX.Element {
  const initialMessagesRef = useRef<readonly InputMessage[]>([]);

  if (initialMessagesRef.current.length === 0) {
    initialMessagesRef.current = createInitialMessages();
  }

  useEffect(() => {
    responseCycle = runResponseCycle;

    return () => {
      responseCycle = null;
      resetHomepageDemoState();
    };
  }, []);

  return createElement(
    'div',
    { className: 'asc-homepage-chat' },
    createElement(Chat, {
      allowFreeTextInput: DOCS_ASSISTANT_FLOW !== null,
      initialMessages: initialMessagesRef.current,
      theme: HOMEPAGE_CHAT_THEME,
    })
  );
}

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
