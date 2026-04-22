import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../examples/login/App';
import { useChatGlobalsStore } from '../lib/chatGlobalsStore';
import { useChatStore } from '../lib/chatStore';
import { useInputFieldStore } from '../lib/inputFieldStore';
import { usePersistentButtonStore } from '../lib/persistentButtonStore';

describe('login example', () => {
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

  it('keeps the shared input enabled across email, password, and code steps', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(
      screen.getByRole('button', { name: 'Sign in with email' })
    );

    const emailInput = await screen.findByPlaceholderText('you@northstar.app');
    await user.type(emailInput, 'alex@northstar.app');
    await user.keyboard('{Enter}');

    const passwordInput = await screen.findByPlaceholderText(
      'Enter your password'
    );
    await waitFor(() => {
      expect(passwordInput).toBeEnabled();
    });

    await user.type(passwordInput, 'Northstar!24');
    await user.keyboard('{Enter}');

    const codeInput = await screen.findByPlaceholderText('246810');
    await waitFor(() => {
      expect(codeInput).toBeEnabled();
    });

    await user.type(codeInput, '246810');
    await user.keyboard('{Enter}');

    const authenticatedInput = await screen.findByPlaceholderText(
      'You are signed in. Use the actions buttons.'
    );
    await waitFor(() => {
      expect(authenticatedInput).toBeDisabled();
    });
  }, 15_000);

  it('restores the primary actions when email sign-in is aborted', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(
      screen.getByRole('button', { name: 'Sign in with email' })
    );

    await user.click(screen.getByRole('button', { name: 'Abort' }));

    expect(
      await screen.findByText(
        'Sign-in cancelled. Start again when you are ready, or try password recovery instead.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sign in with email' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reset password' })
    ).toBeInTheDocument();
  });
});
