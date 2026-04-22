import { expect, test } from '@playwright/test';
import {
  assistantMessages,
  clickAssistantActionAndWaitForAssistant,
  clickPersistentActionAndWaitForAssistant,
  gotoExample,
  submitChatFilesAndWaitForAssistant,
  uploadChatFiles,
} from './support/chat';

test.describe('uploads example', () => {
  test('handles screenshot validation, abort, and successful image uploads', async ({
    page,
  }) => {
    await gotoExample(page, 'uploads');

    await expect(
      page.getByRole('heading', { name: 'A focused lab for file uploads.' })
    ).toBeVisible();

    await clickAssistantActionAndWaitForAssistant(page, 'Share screenshot');
    const screenshotMessageCount = await assistantMessages(page).count();
    await uploadChatFiles(page, {
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('plain text is not an image'),
    });
    await expect(
      page.getByRole('alert').filter({
        hasText: 'Only image files are allowed in the screenshot flow.',
      })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Send message' })
    ).toBeDisabled();
    await expect(assistantMessages(page)).toHaveCount(screenshotMessageCount);

    const invalidScreenshotMessage = page.getByRole('alert').filter({
      hasText: 'Only image files are allowed in the screenshot flow.',
    });
    await expect(invalidScreenshotMessage).toContainText(
      'Only image files are allowed in the screenshot flow.'
    );

    const abortedScreenshotMessage =
      await clickPersistentActionAndWaitForAssistant(page, 'Abort');
    await expect(abortedScreenshotMessage).toContainText(
      'Screenshot request cancelled.'
    );

    await clickAssistantActionAndWaitForAssistant(page, 'Share screenshot');
    const uploadedScreenshotMessage = await submitChatFilesAndWaitForAssistant(
      page,
      {
        name: 'checkout.png',
        mimeType: 'image/png',
        buffer: Buffer.from('not-a-real-png-but-good-enough-for-playwright'),
      },
      'The shipping summary wraps under the pay button.'
    );
    await expect(uploadedScreenshotMessage).toContainText(
      'Captured checkout.png.'
    );
    await expect(
      page.getByRole('img', { name: 'checkout.png' }).last()
    ).toBeVisible();
  });

  test('handles document validation, successful file uploads, and the explainer action', async ({
    page,
  }) => {
    await gotoExample(page, 'uploads');

    await clickAssistantActionAndWaitForAssistant(page, 'Attach document');
    const attachmentMessageCount = await assistantMessages(page).count();
    await uploadChatFiles(page, {
      name: 'installer.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('pretend executable'),
    });
    await expect(
      page.getByRole('alert').filter({
        hasText: 'Executable attachments are blocked in this demo.',
      })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Send message' })
    ).toBeDisabled();
    await expect(assistantMessages(page)).toHaveCount(attachmentMessageCount);

    const invalidAttachmentMessage = page.getByRole('alert').filter({
      hasText: 'Executable attachments are blocked in this demo.',
    });
    await expect(invalidAttachmentMessage).toContainText(
      'Executable attachments are blocked in this demo.'
    );

    const uploadedAttachmentMessage = await submitChatFilesAndWaitForAssistant(
      page,
      {
        name: 'invoice.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.7 demo attachment'),
      }
    );
    await expect(uploadedAttachmentMessage).toContainText(
      'Attached invoice.pdf.'
    );
    await expect(
      page.getByRole('link', { name: /invoice\.pdf/i }).last()
    ).toBeVisible();

    const explainerMessage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Explain message parts'
    );
    await expect(explainerMessage).toContainText('Upload demo map');
    await expect(explainerMessage).toContainText('image parts');
    await expect(explainerMessage).toContainText('file parts');
  });
});
