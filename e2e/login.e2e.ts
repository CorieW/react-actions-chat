import { expect, test } from '@playwright/test';

const DEFAULT_PLACEHOLDER = 'Type your message...';

function escapeForExactMatch(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactMessage(page: import('@playwright/test').Page, text: string) {
  return page
    .getByTestId('chat-message-content')
    .filter({ hasText: new RegExp(`^${escapeForExactMatch(text)}$`) });
}

test.describe('Login Example E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('validates email input and lets the user abort the login flow', async ({
    page,
  }) => {
    await expect(
      page.getByText('Welcome! Please log in to continue.')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Login with Email' }).click();

    await expect(
      page.getByText('Please enter your email address:')
    ).toBeVisible();
    await expect(
      page.getByText('We will use this email to log you in')
    ).toBeVisible();
    const emailInput = page.getByPlaceholder('your.email@example.com');
    await expect(emailInput).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abort' })).toBeVisible();

    await emailInput.fill('not-an-email');
    await emailInput.press('Enter');

    await expect(exactMessage(page, 'not-an-email')).toHaveCount(1);
    await expect(
      page.getByText('Please enter a valid email address')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abort' })).toBeVisible();

    await page.getByRole('button', { name: 'Abort' }).click();

    await expect(page.getByRole('button', { name: 'Abort' })).toHaveCount(0);
    await expect(page.getByPlaceholder(DEFAULT_PLACEHOLDER)).toBeVisible();
    await expect(
      page.getByText('We will use this email to log you in')
    ).toHaveCount(0);
  });

  test('collects email and password and masks the password message', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Login with Email' }).click();

    const emailInput = page.getByPlaceholder('your.email@example.com');
    await emailInput.fill('user@example.com');
    await emailInput.press('Enter');

    await expect(exactMessage(page, 'user@example.com')).toHaveCount(1);
    await expect(
      page.getByText('Great! Now please enter your password.')
    ).toBeVisible();

    const passwordInput = page.getByPlaceholder('Enter your password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(
      page.getByText('Your password will be kept secure')
    ).toBeVisible();

    await passwordInput.fill('Secret123');
    await passwordInput.press('Enter');

    await expect(
      exactMessage(page, '\u2022'.repeat('Secret123'.length))
    ).toHaveCount(1);
    await expect(
      page.getByText(
        "Welcome back! You've successfully logged in with user@example.com."
      )
    ).toBeVisible();
  });
});
