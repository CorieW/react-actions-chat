import { expect, test } from '@playwright/test';
import {
  clickAssistantAction,
  clickAssistantActionAndWaitForAssistant,
  clickPersistentActionAndWaitForAssistant,
  gotoExample,
  submitChatInputAndWaitForAssistant,
} from './support/chat';

test.describe('support-desk example', () => {
  test('shares a newly created ticket between the customer and admin views', async ({
    page,
  }) => {
    await gotoExample(page, 'support-desk');

    await expect(
      page.getByRole('heading', { name: 'Harbor Support Desk' })
    ).toBeVisible();

    await clickAssistantActionAndWaitForAssistant(page, 'Open a ticket');
    const createdTicketMessage = await submitChatInputAndWaitForAssistant(
      page,
      'Our finance leads cannot download the updated invoice PDF after enabling SSO.'
    );
    await expect(createdTicketMessage).toContainText(
      'SUP-2043 is open for Alex Morgan'
    );
    await expect(createdTicketMessage).toContainText('Subject:');

    await page.getByRole('button', { name: 'Admin console' }).click();

    await clickAssistantActionAndWaitForAssistant(page, 'View queue');
    const reviewedTicket = await clickAssistantActionAndWaitForAssistant(
      page,
      'SUP-2043'
    );
    await expect(reviewedTicket).toContainText(
      'Assigned to: No agent assigned yet'
    );

    const fullActivity = await clickAssistantActionAndWaitForAssistant(
      page,
      'View full activity'
    );
    await expect(fullActivity).toContainText('Full activity for SUP-2043');
    await expect(fullActivity).toContainText(
      'Our finance leads cannot download the updated invoice PDF after enabling SSO.'
    );

    const assignedTicket = await clickAssistantActionAndWaitForAssistant(
      page,
      'Assign to me'
    );
    await expect(assignedTicket).toContainText(
      'SUP-2043 is now assigned to Morgan Admin'
    );
    await expect(assignedTicket).toContainText('Status: open');

    const confirmationPrompt = await clickAssistantActionAndWaitForAssistant(
      page,
      'Resolve ticket'
    );
    await expect(confirmationPrompt).toContainText(
      'Resolve SUP-2043 and mark the work complete?'
    );

    const resolvedTicket = await clickAssistantActionAndWaitForAssistant(
      page,
      'Resolve'
    );
    await expect(resolvedTicket).toContainText('SUP-2043 has been resolved');
  });

  test('supports knowledge-base search, seeded ticket review, live chat, and workspace reset', async ({
    page,
  }) => {
    await gotoExample(page, 'support-desk');

    await clickAssistantActionAndWaitForAssistant(page, 'Search help center');
    const knowledgeBaseResults = await submitChatInputAndWaitForAssistant(
      page,
      'refund'
    );
    await expect(knowledgeBaseResults).toContainText(
      'Refund and cancellation policy'
    );

    await page.getByRole('button', { name: 'Reset workspace' }).click();
    await expect(
      page.getByRole('button', { name: 'Customer inbox', pressed: true })
    ).toBeVisible();

    await clickAssistantActionAndWaitForAssistant(page, 'View my tickets');
    const seededTicket = await clickAssistantActionAndWaitForAssistant(
      page,
      'SUP-2042'
    );
    await expect(seededTicket).toContainText('Ticket SUP-2042');
    await expect(seededTicket).toContainText('Status: pending customer');
    await expect(seededTicket).toContainText('Priority: high');

    const fullSeededActivity = await clickAssistantActionAndWaitForAssistant(
      page,
      'View full activity'
    );
    await expect(fullSeededActivity).toContainText(
      'Full activity for SUP-2042'
    );
    await expect(fullSeededActivity).toContainText(
      'I confirmed the duplicate charge and queued a refund review with finance.'
    );

    await clickAssistantActionAndWaitForAssistant(page, 'Start live chat');
    const liveChatMessage = await submitChatInputAndWaitForAssistant(
      page,
      'Finance is waiting on the refund answer before they release the launch hold.'
    );
    await expect(liveChatMessage).toContainText(
      'Live chat request chat-0001 is queued'
    );

    await page.getByRole('button', { name: 'Reset workspace' }).click();

    const resetTicketList = await clickAssistantActionAndWaitForAssistant(
      page,
      'View my tickets'
    );
    await expect(resetTicketList).toContainText('SUP-2042');

    await clickAssistantAction(page, 'SUP-2042');
    await expect(
      page.getByRole('button', { name: 'Start live chat' }).last()
    ).toBeVisible();
  });

  test('recovers with guided next steps after customer and admin aborts', async ({
    page,
  }) => {
    await gotoExample(page, 'support-desk');

    await clickAssistantActionAndWaitForAssistant(page, 'Search help center');
    const customerAbortMessage = await clickPersistentActionAndWaitForAssistant(
      page,
      'Abort'
    );
    await expect(customerAbortMessage).toContainText(
      'Help-center search cancelled.'
    );
    await expect(
      page
        .getByRole('log', { name: 'Chat transcript' })
        .getByRole('button', { name: 'View my tickets' })
        .last()
    ).toBeVisible();

    await page.getByRole('button', { name: 'Admin console' }).click();

    await clickAssistantActionAndWaitForAssistant(page, 'Review a ticket');
    const adminAbortMessage = await clickPersistentActionAndWaitForAssistant(
      page,
      'Abort'
    );
    await expect(adminAbortMessage).toContainText('Ticket review cancelled.');
    await expect(
      page
        .getByRole('log', { name: 'Chat transcript' })
        .getByRole('button', { name: 'View queue' })
        .last()
    ).toBeVisible();
  });
});
