import { expect, test } from '@playwright/test';

const CHAT_INPUT_PLACEHOLDER = 'Type your message...';

function escapeForExactMatch(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactMessage(page: import('@playwright/test').Page, text: string) {
  return page
    .getByTestId('chat-message-content')
    .filter({ hasText: new RegExp(`^${escapeForExactMatch(text)}$`) });
}

test.describe('Basic QA Bot E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows the initial bot greeting', async ({ page }) => {
    await expect(
      page.getByText(
        "Hello! I'm a basic Q&A bot. Ask me anything and I'll do my best to help you!"
      )
    ).toBeVisible();
  });

  test('handles a common help question end to end', async ({ page }) => {
    const input = page.getByPlaceholder(CHAT_INPUT_PLACEHOLDER);

    await input.fill('help');
    await input.press('Enter');

    await expect(exactMessage(page, 'help')).toHaveCount(1);
    await expect(
      page.getByText(
        'I can help answer questions, provide information, or assist with various topics. What would you like to know?'
      )
    ).toBeVisible();
  });

  test('handles unknown questions with fallback guidance', async ({ page }) => {
    const input = page.getByPlaceholder(CHAT_INPUT_PLACEHOLDER);

    await input.fill('What is quantum soup?');
    await input.press('Enter');

    await expect(exactMessage(page, 'What is quantum soup?')).toHaveCount(1);
    await expect(
      page.getByText(
        "That's an interesting question! I'm a basic Q&A bot, so I might not have all the answers, but I'll do my best to help. Could you rephrase your question?"
      )
    ).toBeVisible();
  });

  test('handles a goodbye message', async ({ page }) => {
    const input = page.getByPlaceholder(CHAT_INPUT_PLACEHOLDER);

    await input.fill('bye');
    await input.press('Enter');

    await expect(exactMessage(page, 'bye')).toHaveCount(1);
    await expect(page.getByText('Goodbye! Have a great day!')).toBeVisible();
  });

  test('does not send a whitespace-only message', async ({ page }) => {
    const input = page.getByPlaceholder(CHAT_INPUT_PLACEHOLDER);
    const messageLocator = page.getByTestId('chat-message-content');
    const initialMessageCount = await messageLocator.count();

    await input.fill('   ');
    await input.press('Enter');

    await expect(messageLocator).toHaveCount(initialMessageCount);
  });
});
