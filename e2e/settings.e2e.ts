import { expect, test } from '@playwright/test';

function escapeForExactMatch(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactMessage(page: import('@playwright/test').Page, text: string) {
  return page
    .getByTestId('chat-message-content')
    .filter({ hasText: new RegExp(`^${escapeForExactMatch(text)}$`) });
}

test.describe('Settings Example E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('retries a password change until the input passes validation', async ({
    page,
  }) => {
    await expect(
      page.getByText('Welcome to Settings! What would you like to change?')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Change Password' }).click();

    const passwordInput = page.getByPlaceholder('Enter password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(
      page.getByText(
        'Password must be at least 8 characters long and contain uppercase, lowercase, and a number'
      )
    ).toBeVisible();

    await passwordInput.fill('short');
    await passwordInput.press('Enter');

    await expect(
      exactMessage(page, 'Password must be at least 8 characters long')
    ).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Abort' })).toBeVisible();

    await passwordInput.fill('Password1');
    await passwordInput.press('Enter');

    await expect(
      exactMessage(page, '\u2022'.repeat('Password1'.length))
    ).toHaveCount(1);
    await expect(
      page.getByText('Password changed successfully!')
    ).toBeVisible();
  });

  test('allows the user to cancel logout from the confirmation step', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Logout' }).click();

    await expect(
      page.getByText(
        'Are you sure you want to logout? You will need to log in again to access your account.'
      )
    ).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(
      page.getByText('Logout cancelled. You remain logged in.')
    ).toBeVisible();
  });

  test('logs the user out after confirmation', async ({ page }) => {
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.getByRole('button', { name: 'Yes, Logout' }).click();

    await expect(
      page.getByText(
        'You have been logged out successfully. Thank you for using our service!'
      )
    ).toBeVisible();
  });
});
