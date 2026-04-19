import { expect, test } from '@playwright/test';
import {
  assistantMessages,
  clickAssistantActionAndWaitForAssistant,
  getChatInput,
  gotoExample,
  submitChatInput,
  submitChatInputAndWaitForAssistant,
  waitForAssistantMessageCount,
} from './support/chat';

test.describe('settings example', () => {
  test('keeps fallback mode responsive across repeated recommendation attempts', async ({
    page,
  }) => {
    await gotoExample(page, 'settings');

    await expect(
      page.getByText('This build is running in fallback mode')
    ).toBeVisible();

    const initialAssistantMessageCount = await assistantMessages(page).count();
    await submitChatInput(page, 'change my email');
    await expect(getChatInput(page)).toBeDisabled();
    await expect(getChatInput(page)).toHaveAttribute(
      'placeholder',
      'Finding the best settings action...'
    );

    const fallbackMessage = await waitForAssistantMessageCount(
      page,
      initialAssistantMessageCount + 1
    );
    await expect(fallbackMessage).toContainText(
      'This build is running in fallback mode'
    );
    await expect(
      fallbackMessage.getByRole('button', { name: 'Help' })
    ).toBeVisible();
    await expect(getChatInput(page)).toBeEnabled();

    const helpMessage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Help'
    );
    await expect(helpMessage).toContainText(
      'Try asking about changing your email'
    );

    const secondAssistantMessageCount = await assistantMessages(page).count();
    await submitChatInput(page, 'delete my account');
    const repeatedFallbackMessage = await waitForAssistantMessageCount(
      page,
      secondAssistantMessageCount + 1
    );
    await expect(repeatedFallbackMessage).toContainText(
      'Switch VITE_SETTINGS_EXAMPLE_MODE back to auto or live'
    );
    await expect(getChatInput(page)).toBeEnabled();
  });
});

test.describe('settings example live flows', () => {
  test.skip(
    process.env.PLAYWRIGHT_LIVE_E2E !== 'true',
    'Live settings E2E only runs in the dedicated live lane.'
  );

  test('recommends the change-email flow and validates input before success @live', async ({
    page,
  }) => {
    await gotoExample(page, 'settings');

    const recommendationsMessage = await submitChatInputAndWaitForAssistant(
      page,
      'I need to change the email address on my account'
    );
    await expect(
      recommendationsMessage.getByRole('button', { name: 'Change Email' })
    ).toBeVisible();

    const promptMessage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Change Email'
    );
    await expect(promptMessage).toContainText(
      'Please enter your new email address:'
    );

    const invalidEmailMessage = await submitChatInputAndWaitForAssistant(
      page,
      'not-an-email'
    );
    await expect(invalidEmailMessage).toContainText(
      'Please enter a valid email address'
    );

    const successMessage = await submitChatInputAndWaitForAssistant(
      page,
      'updated.account@example.com'
    );
    await expect(successMessage).toContainText(
      'Email updated successfully! We sent a verification email to updated.account@example.com.'
    );
  });

  test('recommends security actions and supports destructive rejection plus confirmation @live', async ({
    page,
  }) => {
    await gotoExample(page, 'settings');

    const securityRecommendations = await submitChatInputAndWaitForAssistant(
      page,
      'Make my login more secure with verification codes'
    );
    await expect(
      securityRecommendations.getByRole('button', {
        name: 'Enable Two-Factor Authentication',
      })
    ).toBeVisible();

    await clickAssistantActionAndWaitForAssistant(
      page,
      'Enable Two-Factor Authentication'
    );
    const canceledTwoFactorMessage =
      await clickAssistantActionAndWaitForAssistant(page, 'Not Now');
    await expect(canceledTwoFactorMessage).toContainText(
      'Two-factor authentication stays off for now.'
    );

    const deleteRecommendations = await submitChatInputAndWaitForAssistant(
      page,
      'Permanently delete everything in this account'
    );
    await expect(
      deleteRecommendations.getByRole('button', { name: 'Delete Account' })
    ).toBeVisible();

    await clickAssistantActionAndWaitForAssistant(page, 'Delete Account');
    const keptAccountMessage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Keep Account'
    );
    await expect(keptAccountMessage).toContainText('Account kept.');

    await submitChatInputAndWaitForAssistant(
      page,
      'Permanently delete everything in this account'
    );
    await clickAssistantActionAndWaitForAssistant(page, 'Delete Account');
    const confirmedDeletionMessage =
      await clickAssistantActionAndWaitForAssistant(page, 'Delete Account');
    await expect(confirmedDeletionMessage).toContainText(
      'Your account deletion request has been submitted.'
    );
  });
});
