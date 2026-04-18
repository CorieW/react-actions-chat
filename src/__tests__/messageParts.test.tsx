import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageList, createTextPart } from '../index';
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
});
