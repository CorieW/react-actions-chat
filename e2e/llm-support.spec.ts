import { expect, test } from '@playwright/test';
import {
  clickAssistantActionAndWaitForAssistant,
  getChatInput,
  gotoExample,
  submitChatInput,
  submitChatInputAndWaitForAssistant,
} from './support/chat';

async function unlockFallbackDemo(
  page: Parameters<typeof gotoExample>[0]
): Promise<void> {
  await expect(getChatInput(page)).toBeDisabled();

  const promptMessage = await clickAssistantActionAndWaitForAssistant(
    page,
    'Enter OpenAI API Key'
  );
  await expect(promptMessage).toContainText(
    'Enter any API key to unlock the fallback demo'
  );

  const readyMessage = await submitChatInputAndWaitForAssistant(
    page,
    'demo-key'
  );
  await expect(readyMessage).toContainText('Fallback demo unlocked');
  await expect(getChatInput(page)).toBeEnabled();
}

test.describe('llm-support example', () => {
  test('blocks new input until the current AI response finishes', async ({
    page,
  }) => {
    await gotoExample(page, 'llm-support');
    await unlockFallbackDemo(page);

    await submitChatInput(page, 'How do I reset my password?');
    await expect(getChatInput(page)).toBeDisabled();
    await expect(getChatInput(page)).toHaveAttribute(
      'placeholder',
      'Thinking through your support question...'
    );
  });

  test('answers common support questions through the deterministic fallback backend', async ({
    page,
  }) => {
    await gotoExample(page, 'llm-support');
    await unlockFallbackDemo(page);

    const passwordMessage = await submitChatInputAndWaitForAssistant(
      page,
      'How do I reset my password?'
    );
    await expect(passwordMessage).toContainText('email link');
    await expect(passwordMessage).toContainText('two minutes');

    const billingMessage = await submitChatInputAndWaitForAssistant(
      page,
      'Do you offer an annual billing discount?'
    );
    await expect(billingMessage).toContainText('15% discount');

    const exportMessage = await submitChatInputAndWaitForAssistant(
      page,
      'How long do data exports take?'
    );
    await expect(exportMessage).toContainText('usually finish within 24 hours');
  });
});
