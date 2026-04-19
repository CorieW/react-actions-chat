import { expect, test } from '@playwright/test';
import {
  assistantMessages,
  getTranscript,
  gotoExample,
  submitChatInputAndWaitForAssistant,
} from './support/chat';

test.describe('coding example', () => {
  test('renders fenced code input as markdown in the user message bubble', async ({
    page,
  }) => {
    await gotoExample(page, 'coding');

    const assistantMessage = await submitChatInputAndWaitForAssistant(
      page,
      [
        '```tsx',
        'useEffect(() => {',
        '  setDraft(formState);',
        '}, [formState]);',
        '```',
      ].join('\n')
    );

    const latestUserMessage = getTranscript(page)
      .locator('[data-asc-message-type="self"]')
      .last();

    await expect(latestUserMessage.locator('pre')).toContainText(
      'setDraft(formState);'
    );
    await expect(latestUserMessage.locator('code')).toContainText(
      'useEffect(() => {'
    );
    await expect(
      latestUserMessage.locator('span[style*="color"]').first()
    ).toBeVisible();
    await expect(assistantMessage.getByRole('heading')).toContainText(
      'Likely React issue'
    );
  });

  test('accepts multiline prompts and renders markdown-rich coding replies', async ({
    page,
  }) => {
    await gotoExample(page, 'coding');

    const assistantMessage = await submitChatInputAndWaitForAssistant(
      page,
      [
        'I am hitting Maximum update depth exceeded in useEffect.',
        'Can you suggest a safer dependency array and patch?',
      ].join('\n')
    );

    await expect(assistantMessage.getByRole('heading')).toContainText(
      'Likely React issue'
    );
    await expect(assistantMessage.getByRole('list')).toBeVisible();
    await expect(assistantMessage.locator('pre')).toContainText('useEffect');
    await expect(assistantMessage.getByText('idempotent')).toBeVisible();

    await expect(
      assistantMessages(page).nth(0).getByText('Ship a faster debugging loop')
    ).toBeVisible();
    await expect(
      getTranscript(page).locator('[data-asc-message-type="self"]').last()
    ).toContainText('Maximum update depth exceeded');
    await expect(
      getTranscript(page).locator('[data-asc-message-type="self"]').last()
    ).toContainText('safer dependency array and patch?');
  });
});
