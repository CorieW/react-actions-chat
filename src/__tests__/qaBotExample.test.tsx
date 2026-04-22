import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../examples/qa-bot/App';
import { useChatGlobalsStore } from '../lib/chatGlobalsStore';
import { useChatStore } from '../lib/chatStore';
import { useInputFieldStore } from '../lib/inputFieldStore';
import { usePersistentButtonStore } from '../lib/persistentButtonStore';

describe('qa bot example', () => {
  beforeEach(() => {
    useChatStore.getState().clearMessages();
    usePersistentButtonStore.getState().clearButtons();
    useChatGlobalsStore.getState().resetChatGlobals();
    useInputFieldStore.getState().resetInputFieldValue();
    useInputFieldStore.getState().resetInputFieldDescription();
    useInputFieldStore.getState().resetInputFieldType();
    useInputFieldStore.getState().resetInputFieldPlaceholder();
    useInputFieldStore.getState().resetInputFieldDisabledPlaceholder();
    useInputFieldStore.getState().resetInputFieldValidator();
    useInputFieldStore.getState().resetInputFieldSubmitGuard();
    useInputFieldStore.getState().resetInputFieldFiles();
    useInputFieldStore.getState().resetInputFieldFileUploadEnabled();
    useInputFieldStore.getState().resetInputFieldDisabledDefault();
    useInputFieldStore.getState().resetInputFieldDisabledPlaceholderDefault();
    useInputFieldStore.getState().resetInputFieldDisabled();
  });

  it('restores quick actions when order lookup is aborted', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Track an order' }));
    await user.click(screen.getByRole('button', { name: 'Abort' }));

    expect(
      await screen.findByText(
        'Order lookup cancelled. You can try another demo order number whenever you are ready.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Track an order' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Talk to a person' })
    ).toBeInTheDocument();
  });

  it('restores quick actions when support handoff is aborted', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Talk to a person' }));
    await user.click(screen.getByRole('button', { name: 'Abort' }));

    expect(
      await screen.findByText(
        'Support handoff cancelled. You can keep exploring answers here or request a follow-up again any time.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Talk to a person' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Track an order' })
    ).toBeInTheDocument();
  });
});
