import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Chat,
  createButton,
  createMarkdownTextPart,
  createRequestInputButtonDef,
  createTextPart,
  type ChatTheme,
  type InputMessage,
  type MessageButton,
  useChatStore,
  useInputFieldStore,
} from 'react-actions-chat';
import {
  createChatTextGenerationFlow,
  createTextGenerationBackend,
  type ChatTextGenerationFlow,
} from 'react-actions-chat-llms';

type LlmSupportExampleMode = 'auto' | 'fallback' | 'live';

const LLM_SUPPORT_THEME: ChatTheme = {
  primaryColor: '#7c93ad',
  secondaryColor: '#1a2430',
  backgroundColor: '#0e141b',
  textColor: '#d8e2ec',
  borderColor: '#243242',
  inputBackgroundColor: '#141d27',
  inputTextColor: '#d8e2ec',
  buttonColor: '#6f879f',
  buttonTextColor: '#f5f8fb',
};

const SYSTEM_PROMPT = `You are the support assistant for Northstar Cloud, a fictional SaaS workspace product.

Product facts:
- Password resets are done with an email link and usually arrive within two minutes.
- Billing is available monthly or annually, and annual billing gives a 15% discount.
- Customers can cancel anytime; the plan stays active until the current billing period ends.
- Data exports can be requested from Settings and usually finish within 24 hours.
- Human support is available Monday to Friday, 9 AM to 5 PM GMT.
- This demo cannot inspect a real account, place orders, or make account changes.

Behavior rules:
- Keep replies under four sentences.
- Be direct, helpful, and specific.
- If a request would need account access, explain the limitation and suggest the next step.
- Do not invent policies beyond the product facts above.`;

const MAX_OUTPUT_TOKENS = 512;
const MINIMUM_RESPONSE_WAIT_MS = 350;
const RESPONSE_WAIT_PLACEHOLDER = 'Thinking through your support question...';

function resolveLlmSupportExampleMode(
  rawMode: string | undefined
): LlmSupportExampleMode {
  if (rawMode === 'fallback' || rawMode === 'live' || rawMode === 'auto') {
    return rawMode;
  }

  return 'auto';
}

function getApiKeyRequestMessage(
  llmSupportExampleMode: LlmSupportExampleMode
): string {
  if (llmSupportExampleMode === 'fallback') {
    return 'Welcome to Northstar Support. This build is running in fallback mode. Enter any API key to unlock the deterministic demo chat.';
  }

  if (llmSupportExampleMode === 'live') {
    return 'Welcome to Northstar Support. Enter your OpenAI API key to start the live support demo.';
  }

  return 'Welcome to Northstar Support. Enter your OpenAI API key to start. This example keeps the key only in memory for the current tab.';
}

function getApiKeyInputPromptMessage(
  llmSupportExampleMode: LlmSupportExampleMode
): string {
  if (llmSupportExampleMode === 'fallback') {
    return 'Enter any API key to unlock the fallback demo:';
  }

  return 'Enter your OpenAI API key:';
}

function getApiKeyInputDescription(
  llmSupportExampleMode: LlmSupportExampleMode
): string {
  if (llmSupportExampleMode === 'fallback') {
    return 'Fallback mode never sends the value to OpenAI. Any non-empty key will unlock the deterministic demo.';
  }

  return 'The key stays in memory for this tab only. In production, keep provider credentials on your own backend.';
}

function getApiKeyReadyMessage(
  llmSupportExampleMode: LlmSupportExampleMode,
  hasExistingApiKey: boolean
): string {
  if (llmSupportExampleMode === 'fallback') {
    return hasExistingApiKey
      ? 'Fallback demo key updated. Keep asking about passwords, billing, exports, cancellations, or support hours.'
      : 'Fallback demo unlocked. Ask about passwords, billing, exports, cancellations, or support hours.';
  }

  return hasExistingApiKey
    ? 'API key updated for this tab. Ask about passwords, billing, exports, cancellations, or support hours.'
    : 'API key saved for this tab. Ask about passwords, billing, exports, cancellations, or support hours.';
}

function getApiKeyAbortedMessage(
  llmSupportExampleMode: LlmSupportExampleMode
): string {
  if (llmSupportExampleMode === 'fallback') {
    return 'Fallback demo stayed locked. Enter any API key when you want to start chatting.';
  }

  return 'No API key entered yet. Add one when you are ready to start the support demo.';
}

function waitForMs(durationMs: number): Promise<void> {
  return new Promise(resolve => {
    globalThis.setTimeout(resolve, durationMs);
  });
}

/**
 * LLM support demo wired to the companion package and a local backend route.
 *
 * This example asks for an API key in-chat and keeps it in memory for the
 * current tab only. In production, keep the real provider key on your own
 * backend instead of exposing it to the client bundle.
 */
export function App(): React.JSX.Element {
  const flowRef = useRef<ChatTextGenerationFlow | null>(null);
  const apiKeyRef = useRef('');
  const isApiKeyReadyRef = useRef(false);
  const responsePendingRef = useRef(false);
  const responseCycleRef = useRef<(() => Promise<void>) | null>(null);
  const [isApiKeyReady, setIsApiKeyReady] = useState(false);
  const addMessage = useChatStore(state => state.addMessage);
  const llmSupportExampleMode = resolveLlmSupportExampleMode(
    import.meta.env.VITE_LLM_SUPPORT_EXAMPLE_MODE
  );
  const backend = useMemo(
    () =>
      createTextGenerationBackend({
        url: '/api/llm',
        headers: () => ({
          ...(apiKeyRef.current.trim()
            ? {
                'X-OpenAI-API-Key': apiKeyRef.current.trim(),
              }
            : {}),
        }),
      }),
    []
  );
  const getApiKeyButtons = (): readonly MessageButton[] => {
    return isApiKeyReadyRef.current ? [] : [apiKeyButton];
  };

  function addApiKeyReadyMessage(hasExistingApiKey: boolean): void {
    addMessage({
      type: 'other',
      parts: [
        createTextPart(
          getApiKeyReadyMessage(llmSupportExampleMode, hasExistingApiKey)
        ),
      ],
      buttons: getApiKeyButtons(),
      userResponseCallback: () => {
        void responseCycleRef.current?.();
      },
    });
  }

  function handleApiKeyEntryAborted(): void {
    addMessage({
      type: 'other',
      parts: [createTextPart(getApiKeyAbortedMessage(llmSupportExampleMode))],
      buttons: getApiKeyButtons(),
    });
  }

  const apiKeyButtonDef = useMemo(
    () =>
      createRequestInputButtonDef({
        id: 'llm-support-api-key',
        initialLabel: 'Enter OpenAI API Key',
        inputPromptMessage: getApiKeyInputPromptMessage(llmSupportExampleMode),
        inputType: 'password',
        placeholder: 'sk-proj-...',
        inputDescription: getApiKeyInputDescription(llmSupportExampleMode),
        shouldWaitForTurn: true,
        validator: value => {
          return value.trim().length > 0
            ? true
            : 'Enter an API key to unlock the support demo.';
        },
        onSuccess: apiKey => {
          const hasExistingApiKey = apiKeyRef.current.trim().length > 0;
          apiKeyRef.current = apiKey.trim();
          isApiKeyReadyRef.current = true;
          setIsApiKeyReady(true);
          addApiKeyReadyMessage(hasExistingApiKey);
        },
      }),
    [addMessage, llmSupportExampleMode]
  );
  const apiKeyButton = useMemo(
    () =>
      createButton(apiKeyButtonDef, {
        abortCallback: handleApiKeyEntryAborted,
      }),
    [apiKeyButtonDef]
  );
  const flow = useMemo(
    () =>
      createChatTextGenerationFlow({
        generator: {
          generateText: request =>
            backend.generateText({
              ...request,
              maxOutputTokens: MAX_OUTPUT_TOKENS,
            }),
        },
        systemPrompt: SYSTEM_PROMPT,
        createAssistantMessage: result => ({
          type: 'other',
          parts: [createMarkdownTextPart(result.text)],
          buttons: getApiKeyButtons(),
          userResponseCallback: () => {
            void responseCycleRef.current?.();
          },
        }),
        createErrorMessage: error => ({
          type: 'other',
          parts: [
            createTextPart(
              error instanceof Error
                ? error.message
                : 'Something went wrong while contacting OpenAI.'
            ),
          ],
          buttons: getApiKeyButtons(),
          userResponseCallback: () => {
            void responseCycleRef.current?.();
          },
        }),
      }),
    [apiKeyButton, backend]
  );
  const initialMessages = useMemo<readonly InputMessage[]>(
    () => [
      {
        type: 'other',
        parts: [createTextPart(getApiKeyRequestMessage(llmSupportExampleMode))],
        buttons: [apiKeyButton],
      },
    ],
    [apiKeyButton, llmSupportExampleMode]
  );

  async function runResponseCycle(): Promise<void> {
    if (responsePendingRef.current) {
      return;
    }

    responsePendingRef.current = true;
    const inputFieldStore = useInputFieldStore.getState();
    inputFieldStore.setInputFieldParams({
      disabledPlaceholder: RESPONSE_WAIT_PLACEHOLDER,
      disabled: true,
    });

    try {
      const responseStartTime = Date.now();
      await flow.respond();
      const elapsedResponseTime = Date.now() - responseStartTime;

      if (elapsedResponseTime < MINIMUM_RESPONSE_WAIT_MS) {
        await waitForMs(MINIMUM_RESPONSE_WAIT_MS - elapsedResponseTime);
      }
    } finally {
      inputFieldStore.resetInputFieldDisabled();
      responsePendingRef.current = false;
    }
  }

  useEffect(() => {
    flowRef.current = flow;
  }, [flow]);

  useEffect(() => {
    responseCycleRef.current = runResponseCycle;
  });

  return (
    <div className='llm-demo-shell'>
      <section className='llm-demo-card llm-demo-chat-frame'>
        <Chat
          allowFreeTextInput={isApiKeyReady}
          initialMessages={initialMessages}
          theme={LLM_SUPPORT_THEME}
        />
      </section>
    </div>
  );
}
