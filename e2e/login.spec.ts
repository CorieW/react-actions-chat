import { expect, test } from '@playwright/test';
import {
  clickAssistantActionAndWaitForAssistant,
  clickPersistentActionAndWaitForAssistant,
  getChatInput,
  gotoExample,
  latestAssistantMessage,
  submitChatInputAndWaitForAssistant,
} from './support/chat';

test.describe('login example', () => {
  test('supports the standard sign-in flow, authenticated actions, and sign-out confirmation', async ({
    page,
  }) => {
    await gotoExample(page, 'login');

    await clickAssistantActionAndWaitForAssistant(page, 'Sign in with email');

    await expect(getChatInput(page)).toHaveAttribute(
      'placeholder',
      'you@northstar.app'
    );

    const passwordPrompt = await submitChatInputAndWaitForAssistant(
      page,
      'sam@northstar.app'
    );
    await expect(passwordPrompt).toContainText('Welcome back, Sam Rivera.');
    await expect(getChatInput(page)).toHaveAttribute(
      'placeholder',
      'Enter your password'
    );

    const signedInMessage = await submitChatInputAndWaitForAssistant(
      page,
      'Support!2026'
    );
    await expect(signedInMessage).toContainText(
      'You are in. Care Desk is ready'
    );
    await expect(getChatInput(page)).toBeDisabled();
    await expect(getChatInput(page)).toHaveAttribute(
      'placeholder',
      'You are signed in. Use the actions buttons.'
    );

    const sessionDetailsMessage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Session details'
    );
    await expect(sessionDetailsMessage).toContainText(
      'Sam Rivera is signed in as Support Manager.'
    );

    const securityTipsMessage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Security tips'
    );
    await expect(securityTipsMessage).toContainText(
      'This example reuses one shared chat input'
    );

    const signOutPrompt = await clickAssistantActionAndWaitForAssistant(
      page,
      'Sign out'
    );
    await expect(signOutPrompt).toContainText(
      'End this demo session and return to the sign-in assistant?'
    );

    const staySignedInMessage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Stay signed in'
    );
    await expect(staySignedInMessage).toContainText(
      'No problem. Your demo session is still active.'
    );

    await clickAssistantActionAndWaitForAssistant(page, 'Sign out');
    const signedOutMessage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Sign out'
    );
    await expect(signedOutMessage).toContainText('You are signed out.');
    await expect(
      page.getByRole('button', { name: 'Sign in with email' })
    ).toBeVisible();
    await expect(getChatInput(page)).toBeDisabled();
  });

  test('supports MFA with a wrong password, a wrong code, resend, and eventual success', async ({
    page,
  }) => {
    await gotoExample(page, 'login');

    await clickAssistantActionAndWaitForAssistant(page, 'Sign in with email');
    await submitChatInputAndWaitForAssistant(page, 'alex@northstar.app');

    const wrongPasswordMessage = await submitChatInputAndWaitForAssistant(
      page,
      'wrong-password'
    );
    await expect(wrongPasswordMessage).toContainText(
      'That password did not match alex@northstar.app.'
    );

    const oneTimeCodePrompt = await submitChatInputAndWaitForAssistant(
      page,
      'Northstar!24'
    );
    await expect(oneTimeCodePrompt).toContainText(
      'Password verified. Enter the 6-digit code sent to al'
    );
    await expect(getChatInput(page)).toHaveAttribute('placeholder', '246810');

    const wrongCodeMessage = await submitChatInputAndWaitForAssistant(
      page,
      '111111'
    );
    await expect(wrongCodeMessage).toContainText('That code did not match.');

    const resentCodeMessage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Resend code'
    );
    await expect(resentCodeMessage).toContainText('I sent a fresh code to');

    const signedInMessage = await submitChatInputAndWaitForAssistant(
      page,
      '246810'
    );
    await expect(signedInMessage).toContainText(
      'Northstar Ops is ready for Alex Chen'
    );
    await expect(getChatInput(page)).toBeDisabled();
  });

  test('restores the primary flow after aborting and supports password recovery', async ({
    page,
  }) => {
    await gotoExample(page, 'login');

    await clickAssistantActionAndWaitForAssistant(page, 'Sign in with email');
    const abortedMessage = await clickPersistentActionAndWaitForAssistant(
      page,
      'Abort'
    );
    await expect(abortedMessage).toContainText('Sign-in cancelled.');
    await expect(
      page.getByRole('button', { name: 'Reset password' })
    ).toBeVisible();

    await clickAssistantActionAndWaitForAssistant(page, 'Reset password');
    const recoveryMessage = await submitChatInputAndWaitForAssistant(
      page,
      'maya@northstar.app'
    );
    await expect(recoveryMessage).toContainText(
      'Password recovery started for maya@northstar.app.'
    );
    await expect(recoveryMessage).toContainText('Launchpad#42');
    await expect(latestAssistantMessage(page)).toContainText(
      'Password recovery started for maya@northstar.app.'
    );
  });
});
