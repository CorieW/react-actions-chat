import { expect, type Locator, type Page } from '@playwright/test';

export type ExampleName =
  | 'coding'
  | 'llm-support'
  | 'login'
  | 'qa-bot'
  | 'uploads'
  | 'settings'
  | 'support-desk';

const exampleUrls: Record<ExampleName, string> = {
  coding: 'http://127.0.0.1:4176',
  'llm-support': 'http://127.0.0.1:4177',
  login: 'http://127.0.0.1:4173',
  'qa-bot': 'http://127.0.0.1:4174',
  uploads: 'http://127.0.0.1:4179',
  settings: 'http://127.0.0.1:4175',
  'support-desk': 'http://127.0.0.1:4178',
};

/**
 * Opens one of the example apps and waits for the shared chat UI to appear.
 */
export async function gotoExample(
  page: Page,
  exampleName: ExampleName
): Promise<void> {
  await page.goto(exampleUrls[exampleName]);
  await expect(getTranscript(page)).toBeVisible();
  await expect(getChatInput(page)).toBeVisible();
}

/**
 * Returns the shared chat transcript region.
 */
export function getTranscript(page: Page): Locator {
  return page.getByRole('log', { name: 'Chat transcript' });
}

/**
 * Returns the shared chat input.
 */
export function getChatInput(page: Page): Locator {
  return page.getByLabel('Chat input');
}

/**
 * Returns the hidden file input used by the optional upload button.
 */
export function getChatFileInput(page: Page): Locator {
  return page.locator('[data-asc-role="chat-file-input"]');
}

/**
 * Returns the persistent action region shown above the input.
 */
export function getPersistentActions(page: Page): Locator {
  return page.getByRole('region', { name: 'Chat persistent actions' });
}

/**
 * Returns the non-loading assistant messages currently shown in the transcript.
 */
export function assistantMessages(page: Page): Locator {
  return getTranscript(page).locator(
    '[data-asc-message-type="other"][data-asc-message-loading="false"]'
  );
}

/**
 * Returns the user-authored messages currently shown in the transcript.
 */
export function userMessages(page: Page): Locator {
  return getTranscript(page).locator(
    '[data-asc-message-type="self"][data-asc-message-loading="false"]'
  );
}

/**
 * Submits a message through the shared chat input.
 */
export async function submitChatInput(
  page: Page,
  message: string
): Promise<void> {
  const chatInput = getChatInput(page);

  await expect(chatInput).toBeEnabled();
  await chatInput.fill(message);
  await expect(
    page.getByRole('button', { name: 'Send message' })
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Send message' }).click();
}

export interface ChatUploadFile {
  readonly buffer: Buffer;
  readonly mimeType: string;
  readonly name: string;
}

/**
 * Selects one or more files in the shared chat uploader.
 */
export async function uploadChatFiles(
  page: Page,
  files: ChatUploadFile | ChatUploadFile[]
): Promise<void> {
  await getChatFileInput(page).setInputFiles(files);
}

/**
 * Uploads files, optionally fills the text input, and waits for the next
 * assistant response after sending the submission.
 */
export async function submitChatFilesAndWaitForAssistant(
  page: Page,
  files: ChatUploadFile | ChatUploadFile[],
  message = ''
): Promise<Locator> {
  const previousAssistantMessageCount = await assistantMessages(page).count();

  if (message.length > 0) {
    await getChatInput(page).fill(message);
  }

  await uploadChatFiles(page, files);
  await expect(
    page.getByRole('button', { name: 'Send message' })
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Send message' }).click();

  return waitForAssistantMessageCount(page, previousAssistantMessageCount + 1);
}

/**
 * Waits for the next assistant response after a submission or button click.
 */
export async function waitForAssistantMessageCount(
  page: Page,
  expectedCount: number
): Promise<Locator> {
  const messages = assistantMessages(page);

  await expect(messages).toHaveCount(expectedCount);

  return messages.nth(expectedCount - 1);
}

/**
 * Submits a user message and waits for the next assistant response.
 */
export async function submitChatInputAndWaitForAssistant(
  page: Page,
  message: string
): Promise<Locator> {
  const previousAssistantMessageCount = await assistantMessages(page).count();

  await submitChatInput(page, message);

  return waitForAssistantMessageCount(page, previousAssistantMessageCount + 1);
}

/**
 * Clicks the newest transcript button with the provided label.
 */
export async function clickAssistantAction(
  page: Page,
  label: string
): Promise<void> {
  const button = getTranscript(page)
    .getByRole('button', { name: label })
    .last();

  await expect(button).toBeVisible();
  await button.click();
}

/**
 * Clicks the newest transcript button and waits for the next assistant reply.
 */
export async function clickAssistantActionAndWaitForAssistant(
  page: Page,
  label: string
): Promise<Locator> {
  const previousAssistantMessageCount = await assistantMessages(page).count();

  await clickAssistantAction(page, label);

  return waitForAssistantMessageCount(page, previousAssistantMessageCount + 1);
}

/**
 * Clicks a persistent action button and waits for the next assistant reply.
 */
export async function clickPersistentActionAndWaitForAssistant(
  page: Page,
  label: string
): Promise<Locator> {
  const previousAssistantMessageCount = await assistantMessages(page).count();
  const button = getPersistentActions(page).getByRole('button', {
    name: label,
  });

  await expect(button).toBeVisible();
  await button.click();

  return waitForAssistantMessageCount(page, previousAssistantMessageCount + 1);
}

/**
 * Returns the latest assistant message in the transcript.
 */
export function latestAssistantMessage(page: Page): Locator {
  return assistantMessages(page).last();
}
