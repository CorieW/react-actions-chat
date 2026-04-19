import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageList, createMarkdownTextPart, createTextPart } from '../index';
import { DARK_THEME } from '../lib/themes';
import type { Message } from '../js/types';

function createMessage(parts: Message['parts']): Message {
  return {
    id: 1,
    type: 'other',
    parts,
    rawContent: '',
    timestamp: new Date('2026-01-01T12:00:00.000Z'),
  };
}

describe('message part rendering', () => {
  it('renders text parts with the plain text formatter', () => {
    render(
      <MessageList
        messages={[
          createMessage([
            createTextPart('Plain text'),
            createTextPart('Second line of text'),
          ]),
        ]}
        theme={DARK_THEME}
      />
    );

    expect(screen.getByText('Plain text')).toBeInTheDocument();
    expect(screen.getByText('Second line of text')).toBeInTheDocument();
  });

  it('renders markdown text parts with rich formatting', () => {
    render(
      <MessageList
        messages={[
          createMessage([
            createMarkdownTextPart(
              [
                '## Fix plan',
                '',
                '- Check the `handleSubmit` branch',
                '- Guard against empty code blocks',
                '',
                '```ts',
                "const answer = 'ready';",
                '```',
              ].join('\n')
            ),
          ]),
        ]}
        theme={DARK_THEME}
      />
    );

    expect(screen.getByRole('heading', { name: 'Fix plan' })).toBeVisible();
    expect(screen.getByRole('list')).toBeVisible();
    expect(screen.getByText('handleSubmit')).toHaveProperty('tagName', 'CODE');
    expect(
      screen.getByText("const answer = 'ready';").closest('pre')
    ).not.toBeNull();
  });

  it('optionally syntax-highlights markdown code blocks', () => {
    const { container } = render(
      <MessageList
        messages={[
          createMessage([
            createMarkdownTextPart(
              ['```ts', "const answer = 'ready';", '```'].join('\n'),
              {
                syntaxHighlighting: true,
              }
            ),
          ]),
        ]}
        theme={DARK_THEME}
      />
    );

    expect(container.querySelector('pre')).not.toBeNull();
    expect(container.querySelector('pre code')).not.toBeNull();
    expect(container.querySelector("span[style*='color']")).not.toBeNull();
  });

  it('keeps fenced code blocks without a language as block code', () => {
    const { container } = render(
      <MessageList
        messages={[
          createMessage([
            createMarkdownTextPart(
              ['```', "const answer = 'ready';", '```'].join('\n'),
              {
                syntaxHighlighting: true,
              }
            ),
          ]),
        ]}
        theme={DARK_THEME}
      />
    );

    expect(container.querySelector('pre')).not.toBeNull();
    expect(container.querySelector('pre code')).not.toBeNull();
    expect(container.querySelector('pre .token')).toBeNull();
  });
});
