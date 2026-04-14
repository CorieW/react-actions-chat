import { useEffect, useMemo, useRef } from 'react';
import { Chat, useChatStore, type ChatTheme } from 'react-actions-chat';
import {
  createLlmAssistantResponder,
  createRemoteTextGenerator,
  type TextGenerator,
  type LlmAssistantResponder,
} from 'react-actions-chat-llms';

const CHAT_THEME: ChatTheme = {
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

export function App(): React.JSX.Element {
  const { addMessage, clearMessages } = useChatStore();
  const responderRef = useRef<LlmAssistantResponder | null>(null);
  const generator = useMemo<TextGenerator>(() => {
    const remoteGenerator = createRemoteTextGenerator({
      url: '/api/llm',
    });

    return {
      generateText: request =>
        remoteGenerator.generateText({
          ...request,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        }),
    };
  }, []);

  const responder = useMemo(
    () =>
      createLlmAssistantResponder({
        generator,
        systemPrompt: SYSTEM_PROMPT,
        createAssistantMessage: result => ({
          type: 'other',
          content: result.text,
          userResponseCallback: () => {
            void responderRef.current?.respond();
          },
        }),
        createErrorMessage: error => ({
          type: 'other',
          content:
            error instanceof Error
              ? error.message
              : 'Something went wrong while contacting OpenAI.',
          userResponseCallback: () => {
            void responderRef.current?.respond();
          },
        }),
      }),
    [generator]
  );

  useEffect(() => {
    responderRef.current = responder;
  }, [responder]);

  useEffect(() => {
    clearMessages();
    addMessage({
      type: 'other',
      content:
        'You are chatting with OpenAI through the local backend route. Ask anything about passwords, billing, exports, or support.',
      userResponseCallback: () => {
        void responderRef.current?.respond();
      },
    });
  }, [addMessage, clearMessages]);

  return (
    <div className='llm-demo-shell'>
      <div className='llm-demo-header'>
        <section className='llm-demo-card llm-demo-intro'>
          <p className='llm-demo-kicker'>Companion Example</p>
          <h1 className='llm-demo-title'>
            Chat with OpenAI through your backend
          </h1>
          <p className='llm-demo-copy'>
            This example keeps the chat UI simple: every message is sent to a
            local backend route, and that backend calls OpenAI with the server
            side <code>OPENAI_API_KEY</code>. The browser never receives the
            provider token.
          </p>
          <p className='llm-demo-note'>
            Add <code>OPENAI_API_KEY</code> to
            <code> examples/llm-support/.env.local</code> before starting the
            example.
          </p>
        </section>
      </div>

      <section className='llm-demo-card llm-demo-chat-frame'>
        <Chat theme={CHAT_THEME} />
      </section>
    </div>
  );
}
