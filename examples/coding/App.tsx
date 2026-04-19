import { useEffect, useRef } from 'react';
import type {
  ChatTheme,
  InputMessage,
  MessageButton,
} from 'react-actions-chat';
import {
  Chat,
  createButton,
  createMarkdownTextPart,
  type Message,
  useChatStore,
} from 'react-actions-chat';

const CODING_THEME: ChatTheme = {
  primaryColor: '#53d6a1',
  secondaryColor: '#141a2f',
  backgroundColor: '#09101f',
  textColor: '#e6edf7',
  borderColor: '#2c3657',
  inputBackgroundColor: '#111a31',
  inputTextColor: '#f7fbff',
  buttonColor: '#f6b73c',
  buttonTextColor: '#18120a',
};

type CodingTopic = 'react' | 'typescript' | 'tests' | 'fallback';

function getLatestUserMessage(): string | undefined {
  const messages = useChatStore.getState().getMessages();
  const lastSelfMessage = [...messages]
    .reverse()
    .find(message => message.type === 'self');

  return lastSelfMessage?.rawContent;
}

function renderLatestUserMessageAsMarkdown(): void {
  const chatStore = useChatStore.getState();
  const messages = chatStore.getMessages();
  const lastSelfMessage = [...messages]
    .reverse()
    .find(message => message.type === 'self');

  if (!lastSelfMessage) {
    return;
  }

  const alreadyMarkdown = lastSelfMessage.parts.every(part => {
    return part.type === 'text' && part.format === 'markdown';
  });

  if (alreadyMarkdown) {
    return;
  }

  const nextMessages = messages.map((message): Message => {
    if (message.id !== lastSelfMessage.id) {
      return message;
    }

    return {
      ...message,
      parts: [
        createMarkdownTextPart(message.rawContent, {
          syntaxHighlighting: true,
        }),
      ],
    };
  });

  chatStore.setMessages(nextMessages);
}

function createConversationCallback(): () => void {
  return () => {
    const latestUserMessage = getLatestUserMessage();

    if (latestUserMessage) {
      handleCodingQuestion(latestUserMessage);
    }
  };
}

function addAssistantMessage(
  markdown: string,
  activeTopic?: CodingTopic
): void {
  useChatStore.getState().addMessage({
    type: 'other',
    parts: [
      createMarkdownTextPart(markdown, {
        syntaxHighlighting: true,
      }),
    ],
    buttons: createPrimaryButtons(activeTopic),
    userResponseCallback: createConversationCallback(),
  });
}

function createPrimaryButtons(
  activeTopic?: CodingTopic
): readonly MessageButton[] {
  const buttons: MessageButton[] = [];

  if (activeTopic !== 'react') {
    buttons.push(
      createButton({
        label: 'React effect loop',
        onClick: () => {
          addAssistantMessage(
            [
              '## React debugging starter',
              '',
              'Paste the component or error message and I will turn it into:',
              '',
              '- a likely root cause',
              '- a safer effect or state pattern',
              '- a small patch you can try next',
              '',
              'A great prompt looks like:',
              '',
              '```tsx',
              'useEffect(() => {',
              '  setDraft(formState);',
              '}, [formState]);',
              '```',
            ].join('\n'),
            'react'
          );
        },
      })
    );
  }

  if (activeTopic !== 'typescript') {
    buttons.push(
      createButton({
        label: 'TS2322 mismatch',
        onClick: () => {
          addAssistantMessage(
            [
              '## TypeScript starter',
              '',
              'Drop in the failing assignment, prop type, or compiler error and I will respond with:',
              '',
              '- the type mismatch in plain English',
              '- the smallest safe fix',
              '- a typed example you can copy',
            ].join('\n'),
            'typescript'
          );
        },
      })
    );
  }

  if (activeTopic !== 'tests') {
    buttons.push(
      createButton({
        label: 'Vitest plan',
        onClick: () => {
          addAssistantMessage(
            [
              '## Test planning starter',
              '',
              'Paste a component, store, or reducer and I will suggest:',
              '',
              '1. the highest-value happy path',
              '2. the most likely regression case',
              '3. a focused `vitest` example',
            ].join('\n'),
            'tests'
          );
        },
      })
    );
  }

  return buttons;
}

function buildReactReply(): string {
  return [
    '## Likely React issue',
    '',
    'This looks like an effect that writes state every time one of its own dependencies changes.',
    '',
    '- Move derived values into render when possible.',
    '- If the effect must stay, guard the state update so it only runs when the meaningful input changed.',
    '- Keep the dependency list honest and make the effect idempotent.',
    '',
    '```tsx',
    'useEffect(() => {',
    '  if (draft.id === formState.id) {',
    '    return;',
    '  }',
    '',
    '  setDraft(formState);',
    '}, [draft.id, formState]);',
    '```',
    '',
    'Next step: paste the component around the effect and I can tighten the dependency list.',
  ].join('\n');
}

function buildTypeScriptReply(): string {
  return [
    '## Why `TS2322` usually happens',
    '',
    'TypeScript is telling you the value on the right cannot satisfy the target type on the left.',
    '',
    '- Compare optional vs required fields first.',
    '- Check whether the value is `string | undefined` while the prop expects `string`.',
    '- Prefer narrowing or mapping into the exact shape instead of forcing a cast.',
    '',
    '```ts',
    'interface UserCardProps {',
    '  email: string;',
    '}',
    '',
    'const email = apiUser.email ?? fallbackEmail;',
    'const props: UserCardProps = { email };',
    '```',
    '',
    'If you paste the exact error, I can rewrite the failing line directly.',
  ].join('\n');
}

function buildTestReply(): string {
  return [
    '## Small Vitest plan',
    '',
    '1. Assert the main success path first.',
    '2. Add one regression test for the bug-prone branch.',
    '3. Keep mocks close to the behavior you actually care about.',
    '',
    '```ts',
    "it('shows the retry message after a failed request', async () => {",
    '  render(<SupportPanel />);',
    '',
    "  await user.click(screen.getByRole('button', { name: 'Retry' }));",
    '',
    "  expect(await screen.findByText('Try again in a moment.')).toBeVisible();",
    '});',
    '```',
    '',
    'Paste the file under test and I can turn this into a more exact case list.',
  ].join('\n');
}

function buildFallbackReply(): string {
  return [
    '## Triage outline',
    '',
    'I can help best when you paste:',
    '',
    '- the error text',
    '- the smallest failing snippet',
    '- what you expected to happen',
    '',
    'Use `Shift+Enter` for new lines when you want to include code.',
    '',
    '```txt',
    'Expected: saveDraft() runs once',
    'Actual: Maximum update depth exceeded',
    '```',
  ].join('\n');
}

function handleCodingQuestion(question: string): void {
  const normalizedQuestion = question.toLowerCase();

  if (
    normalizedQuestion.includes('useeffect') ||
    normalizedQuestion.includes('maximum update depth') ||
    normalizedQuestion.includes('dependency array') ||
    normalizedQuestion.includes('render loop')
  ) {
    addAssistantMessage(buildReactReply(), 'react');
    return;
  }

  if (
    normalizedQuestion.includes('ts2322') ||
    normalizedQuestion.includes('typescript') ||
    normalizedQuestion.includes('type error') ||
    normalizedQuestion.includes('not assignable')
  ) {
    addAssistantMessage(buildTypeScriptReply(), 'typescript');
    return;
  }

  if (
    normalizedQuestion.includes('test') ||
    normalizedQuestion.includes('vitest') ||
    normalizedQuestion.includes('coverage') ||
    normalizedQuestion.includes('assert')
  ) {
    addAssistantMessage(buildTestReply(), 'tests');
    return;
  }

  addAssistantMessage(buildFallbackReply(), 'fallback');
}

/**
 * Coding-focused example app that shows multiline prompts and markdown replies.
 */
export function App(): React.JSX.Element {
  const initialMessagesRef = useRef<readonly InputMessage[] | null>(null);
  const messages = useChatStore(state => state.messages);

  useEffect(() => {
    renderLatestUserMessageAsMarkdown();
  }, [messages]);

  if (!initialMessagesRef.current) {
    initialMessagesRef.current = [
      {
        type: 'other',
        parts: [
          createMarkdownTextPart(
            [
              '## Ship a faster debugging loop',
              '',
              'Paste a stack trace, a component, or a failing test and this demo will answer in markdown.',
              '',
              '- Use **Enter** to send.',
              '- Use **Shift+Enter** to add more lines.',
              '- Try `useEffect`, `TS2322`, or `vitest` prompts to see richer replies.',
            ].join('\n'),
            {
              syntaxHighlighting: true,
            }
          ),
        ],
        buttons: createPrimaryButtons(),
        userResponseCallback: createConversationCallback(),
      },
    ];
  }

  return (
    <main className='coding-demo'>
      <section className='coding-demo__shell'>
        <header className='coding-demo__header'>
          <p className='coding-demo__eyebrow'>Local Coding Assistant</p>
          <div className='coding-demo__title-row'>
            <h1 className='coding-demo__title'>Debug with multiline prompts</h1>
            <div className='coding-demo__pills'>
              <span>Markdown Replies</span>
              <span>Code Blocks</span>
              <span>Shift+Enter</span>
            </div>
          </div>
          <p className='coding-demo__description'>
            This workspace demo stays fully local. It is tuned to show how the
            shared chat input can handle pasted code and how message text parts
            can render headings, lists, inline code, and fenced blocks.
          </p>
        </header>

        <div className='coding-demo__chat-frame'>
          <Chat
            allowFreeTextInput
            initialMessages={initialMessagesRef.current}
            theme={CODING_THEME}
          />
        </div>
      </section>
    </main>
  );
}
