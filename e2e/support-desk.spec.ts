import { expect, test } from '@playwright/test';
import {
  clickAssistantAction,
  clickAssistantActionAndWaitForAssistant,
  clickPersistentActionAndWaitForAssistant,
  gotoExample,
  latestAssistantMessage,
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

    await clickAssistantActionAndWaitForAssistant(page, 'Start ticket');
    const createdTicketMessage = await submitChatInputAndWaitForAssistant(
      page,
      'Our finance leads cannot download the updated invoice PDF after enabling SSO.'
    );
    await expect(createdTicketMessage).toContainText(
      'SUP-1000 is open for Alex Morgan'
    );
    await expect(createdTicketMessage).toContainText('Subject:');

    await page.getByRole('button', { name: 'Admin console' }).click();

    const firstQueuePage = await clickAssistantActionAndWaitForAssistant(
      page,
      'View ticket queue'
    );
    await expect(firstQueuePage).toContainText('Showing tickets 1-2 of 6');
    await expect(
      firstQueuePage.getByRole('button', { name: 'SUP-1000' })
    ).toBeVisible();
    await expect(
      firstQueuePage.getByRole('button', { name: 'Next tickets' })
    ).toBeVisible();

    const secondQueuePage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Next tickets'
    );
    await expect(secondQueuePage).toContainText('Showing tickets 3-4 of 6');
    await expect(
      secondQueuePage.getByRole('button', { name: 'Previous tickets' })
    ).toBeVisible();

    await clickAssistantActionAndWaitForAssistant(page, 'Previous tickets');
    const reviewedTicket = await clickAssistantActionAndWaitForAssistant(
      page,
      'SUP-1000'
    );
    await expect(reviewedTicket).toContainText(
      'Assigned to: No agent assigned yet'
    );

    const fullActivity = await clickAssistantActionAndWaitForAssistant(
      page,
      'View full activity'
    );
    await expect(fullActivity).toContainText('Full activity for SUP-1000');
    await expect(fullActivity).toContainText(
      'Our finance leads cannot download the updated invoice PDF after enabling SSO.'
    );

    const assignedTicket = await clickAssistantActionAndWaitForAssistant(
      page,
      'Assign to me'
    );
    await expect(assignedTicket).toContainText(
      'SUP-1000 is now assigned to Morgan Admin'
    );
    await expect(assignedTicket).toContainText('Status: open');

    const confirmationPrompt = await clickAssistantActionAndWaitForAssistant(
      page,
      'Resolve ticket'
    );
    await expect(confirmationPrompt).toContainText(
      'Resolve SUP-1000 and mark the work complete?'
    );

    const resolvedTicket = await clickAssistantActionAndWaitForAssistant(
      page,
      'Resolve'
    );
    await expect(resolvedTicket).toContainText('SUP-1000 has been resolved');
  });

  test('paginates seeded customer tickets and admin queues', async ({
    page,
  }) => {
    await gotoExample(page, 'support-desk');

    const firstCustomerPage = await clickAssistantActionAndWaitForAssistant(
      page,
      'View tickets'
    );
    await expect(firstCustomerPage).toContainText('Showing tickets 1-2 of 5');
    await expect(
      firstCustomerPage.getByRole('button', { name: 'SUP-0995' })
    ).toBeVisible();
    await expect(
      firstCustomerPage.getByRole('button', { name: 'SUP-0996' })
    ).toBeVisible();

    const secondCustomerPage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Next tickets'
    );
    await expect(secondCustomerPage).toContainText('Showing tickets 3-4 of 5');
    await expect(
      secondCustomerPage.getByRole('button', { name: 'SUP-0997' })
    ).toBeVisible();
    await expect(
      secondCustomerPage.getByRole('button', { name: 'SUP-0998' })
    ).toBeVisible();

    const finalCustomerPage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Next tickets'
    );
    await expect(finalCustomerPage).toContainText('Showing tickets 5-5 of 5');
    await expect(
      finalCustomerPage.getByRole('button', { name: 'SUP-0999' })
    ).toBeVisible();
    await expect(
      finalCustomerPage.getByRole('button', { name: 'Previous tickets' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Admin console' }).click();

    const firstAssignedPage = await clickAssistantActionAndWaitForAssistant(
      page,
      'My assigned work'
    );
    await expect(firstAssignedPage).toContainText('Showing tickets 1-2 of 3');
    await expect(
      firstAssignedPage.getByRole('button', { name: 'SUP-0997' })
    ).toBeVisible();
    await expect(
      firstAssignedPage.getByRole('button', { name: 'SUP-0998' })
    ).toBeVisible();

    const finalAssignedPage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Next tickets'
    );
    await expect(finalAssignedPage).toContainText('Showing tickets 3-3 of 3');
    await expect(
      finalAssignedPage.getByRole('button', { name: 'SUP-0999' })
    ).toBeVisible();

    await clickAssistantActionAndWaitForAssistant(
      page,
      'Back to admin options'
    );

    const firstLiveChatPage = await clickAssistantActionAndWaitForAssistant(
      page,
      'View live chat queue'
    );
    await expect(firstLiveChatPage).toContainText(
      'Showing live chats 1-2 of 4'
    );
    await expect(
      firstLiveChatPage.getByRole('button', { name: 'chat-demo-01' })
    ).toBeVisible();
    await expect(
      firstLiveChatPage.getByRole('button', { name: 'chat-demo-02' })
    ).toBeVisible();

    const finalLiveChatPage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Next live chats'
    );
    await expect(finalLiveChatPage).toContainText(
      'Showing live chats 3-4 of 4'
    );
    await expect(
      finalLiveChatPage.getByRole('button', { name: 'chat-demo-03' })
    ).toBeVisible();
    await expect(
      finalLiveChatPage.getByRole('button', { name: 'chat-demo-04' })
    ).toBeVisible();
  });

  test('supports live chat handoff and workspace reset', async ({ page }) => {
    await gotoExample(page, 'support-desk');

    await clickAssistantActionAndWaitForAssistant(page, 'Start live chat');
    const liveChatMessage = await submitChatInputAndWaitForAssistant(
      page,
      'Finance is waiting on the refund answer before they release the launch hold.'
    );
    await expect(liveChatMessage).toContainText('Live chat');
    await expect(liveChatMessage).toContainText('Status: queued');
    await expect(liveChatMessage).toContainText('Estimated wait:');

    await page.getByRole('button', { name: 'Admin console' }).click();

    const liveChatQueue = await clickAssistantActionAndWaitForAssistant(
      page,
      'View live chat queue'
    );
    await expect(liveChatQueue).toContainText('Showing live chats 1-2 of 5');
    await expect(liveChatQueue).toContainText('Live chat queue');
    await expect(liveChatQueue).toContainText('chat-0001');

    const liveChatDetails = await clickAssistantActionAndWaitForAssistant(
      page,
      'chat-0001'
    );
    await expect(liveChatDetails).toContainText('Live chat chat-0001');
    await expect(liveChatDetails).toContainText(
      'Finance is waiting on the refund answer before they release the launch hold.'
    );

    await clickAssistantAction(page, 'Join live chat');
    await expect(
      page.getByRole('heading', { name: 'Joined live chat chat-0001' })
    ).toBeVisible();
    await expect(latestAssistantMessage(page)).toContainText(
      'Live chat chat-0001'
    );
    await expect(latestAssistantMessage(page)).toContainText('Status: active');

    await page.getByRole('button', { name: 'Reset workspace' }).click();
    await expect(
      page.getByRole('button', { name: 'Admin console', pressed: true })
    ).toBeVisible();

    const resetLiveChatQueue = await clickAssistantActionAndWaitForAssistant(
      page,
      'View live chat queue'
    );
    await expect(resetLiveChatQueue).toContainText(
      'Showing live chats 1-2 of 4'
    );
    await expect(resetLiveChatQueue).toContainText('chat-demo-01');
    await expect(resetLiveChatQueue).not.toContainText('chat-0001');

    await page.getByRole('button', { name: 'Customer inbox' }).click();

    await expect(
      page.getByRole('button', { name: 'Start ticket' }).last()
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Start live chat' }).last()
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'View tickets' })
    ).toBeVisible();
  });

  test('recovers with guided next steps after customer and admin aborts', async ({
    page,
  }) => {
    await gotoExample(page, 'support-desk');

    await clickAssistantActionAndWaitForAssistant(page, 'Start ticket');
    const customerAbortMessage = await clickPersistentActionAndWaitForAssistant(
      page,
      'Abort'
    );
    await expect(customerAbortMessage).toContainText(
      'Ticket creation cancelled.'
    );
    await expect(
      page
        .getByRole('log', { name: 'Chat transcript' })
        .getByRole('button', { name: 'Start live chat' })
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
        .getByRole('button', { name: 'View ticket queue' })
        .last()
    ).toBeVisible();
  });
});
