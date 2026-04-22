import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  MessageList,
  createFilePart,
  createImagePart,
  createMarkdownTextPart,
  createTextPart,
} from '../index';
import { DARK_THEME } from '../lib/themes';
import type { Message } from '../js/types';
import { createMessagePartsFromFiles } from '../lib/messageParts';

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

  it('renders image parts inline in the transcript', () => {
    render(
      <MessageList
        messages={[
          createMessage([
            createImagePart('https://example.com/screenshot.png', {
              alt: 'Checkout screenshot',
              fileName: 'checkout.png',
              maxHeightPx: 320,
              maxWidthPx: 480,
              sizeBytes: 32_768,
            }),
          ]),
        ]}
        theme={DARK_THEME}
      />
    );

    expect(
      screen.getByRole('img', { name: 'Checkout screenshot' })
    ).toBeInTheDocument();
    expect(screen.getByText(/checkout\.png/i)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Checkout screenshot' })
    ).toHaveStyle({
      maxHeight: '320px',
      maxWidth: '480px',
    });
  });

  it('caps uploaded image previews to the default attachment size', () => {
    const [imagePart] = createMessagePartsFromFiles([
      new File(['image-bytes'], 'checkout.png', {
        type: 'image/png',
      }),
    ]);

    expect(imagePart).toMatchObject({
      type: 'image',
      fileName: 'checkout.png',
      maxHeightPx: 320,
      maxWidthPx: 480,
    });
  });

  it('renders file parts as downloadable links', () => {
    render(
      <MessageList
        messages={[
          createMessage([
            createFilePart('https://example.com/invoice.pdf', {
              fileName: 'invoice.pdf',
              mimeType: 'application/pdf',
              sizeBytes: 84_992,
            }),
          ]),
        ]}
        theme={DARK_THEME}
      />
    );

    expect(screen.getByRole('link', { name: /invoice\.pdf/i })).toHaveAttribute(
      'download',
      'invoice.pdf'
    );
    expect(screen.getByText(/application\/pdf/i)).toBeInTheDocument();
  });

  it('adds animation hooks for message entry and loading states', () => {
    const { container } = render(
      <MessageList
        messages={[createMessage([createTextPart('Animated message')])]}
        isLoading
        theme={DARK_THEME}
      />
    );

    const message = container.querySelector("[data-asc-message-id='1']");
    const loadingMessage = container.querySelector(
      "[data-asc-message-loading='true']"
    );

    expect(message).toHaveClass('asc-message');
    expect(message?.querySelector('.asc-message-bubble')).not.toBeNull();
    expect(loadingMessage).toHaveClass('asc-message');
    expect(container.querySelectorAll('.asc-loading-dot')).toHaveLength(3);
  });
});
