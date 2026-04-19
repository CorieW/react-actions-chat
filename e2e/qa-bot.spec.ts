import { expect, test } from '@playwright/test';
import {
  clickAssistantActionAndWaitForAssistant,
  clickPersistentActionAndWaitForAssistant,
  gotoExample,
  submitChatInputAndWaitForAssistant,
} from './support/chat';

test.describe('qa-bot example', () => {
  test('handles order tracking quick actions, validation errors, abort, and success', async ({
    page,
  }) => {
    await gotoExample(page, 'qa-bot');

    await clickAssistantActionAndWaitForAssistant(page, 'Track an order');

    const validationMessage = await submitChatInputAndWaitForAssistant(
      page,
      '2048'
    );
    await expect(validationMessage).toContainText(
      'Use the format AS-1234 so I can look up the order.'
    );

    const abortedMessage = await clickPersistentActionAndWaitForAssistant(
      page,
      'Abort'
    );
    await expect(abortedMessage).toContainText('Order lookup cancelled.');

    await clickAssistantActionAndWaitForAssistant(page, 'Track an order');
    const trackingMessage = await submitChatInputAndWaitForAssistant(
      page,
      'AS-2048'
    );
    await expect(trackingMessage).toContainText('AS-2048 is confirmed.');
    await expect(trackingMessage).toContainText(
      'Estimated arrival: tomorrow before 6 PM.'
    );
  });

  test('routes free-text support questions across greeting, orders, refunds, shipping, billing, and unknown prompts', async ({
    page,
  }) => {
    await gotoExample(page, 'qa-bot');

    const greetingMessage = await submitChatInputAndWaitForAssistant(
      page,
      'Hello there'
    );
    await expect(greetingMessage).toContainText(
      'Hello! I can help with order tracking'
    );

    const orderMessage = await submitChatInputAndWaitForAssistant(
      page,
      'Where is order AS-1703?'
    );
    await expect(orderMessage).toContainText('AS-1703 is delivered.');

    const refundMessage = await submitChatInputAndWaitForAssistant(
      page,
      'What is your refund policy?'
    );
    await expect(refundMessage).toContainText(
      'Our demo refund policy allows returns within 30 days'
    );

    const shippingPrompt = await submitChatInputAndWaitForAssistant(
      page,
      'How long does shipping take?'
    );
    await expect(shippingPrompt).toContainText(
      'Shipping speed depends on the destination'
    );

    const europeShippingMessage = await clickAssistantActionAndWaitForAssistant(
      page,
      'Europe'
    );
    await expect(europeShippingMessage).toContainText(
      'Most European orders arrive in 4 to 7 business days.'
    );

    const billingMessage = await submitChatInputAndWaitForAssistant(
      page,
      'I need billing help'
    );
    await expect(billingMessage).toContainText(
      'Charges appear immediately, renewal reminders go out 3 days before renewal'
    );

    const fallbackMessage = await submitChatInputAndWaitForAssistant(
      page,
      'Can you translate this poem for me?'
    );
    await expect(fallbackMessage).toContainText(
      'I am a local rules-based demo'
    );
  });

  test('supports a human handoff flow with abort and successful follow-up capture', async ({
    page,
  }) => {
    await gotoExample(page, 'qa-bot');

    await clickAssistantActionAndWaitForAssistant(page, 'Talk to a person');
    const abortedMessage = await clickPersistentActionAndWaitForAssistant(
      page,
      'Abort'
    );
    await expect(abortedMessage).toContainText('Support handoff cancelled.');

    await clickAssistantActionAndWaitForAssistant(page, 'Talk to a person');
    const handoffMessage = await submitChatInputAndWaitForAssistant(
      page,
      'help@example.com'
    );
    await expect(handoffMessage).toContainText(
      'Thanks. I queued a follow-up for help@example.com.'
    );
  });
});
