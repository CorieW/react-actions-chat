import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequestConfirmationButton } from '../components/RequestConfirmationButton';
import { useChatStore } from '../lib/chatStore';

describe('Request confirmation button integration tests', () => {
  beforeEach(() => {
    useChatStore.getState().clearMessages();
  });

  it('adds a follow-up confirmation message with action buttons', () => {
    const onConfirm = vi.fn();
    const onReject = vi.fn();

    const button = createRequestConfirmationButton({
      initialLabel: 'Delete account',
      confirmationMessage: 'Are you sure?',
      confirmLabel: 'Yes, delete',
      rejectLabel: 'No, cancel',
      onConfirm,
      onReject,
      variant: 'error',
    });

    button.onClick?.();

    const latestMessage = useChatStore.getState().getPreviousMessage();
    expect(latestMessage).toMatchObject({
      type: 'other',
      content: 'Are you sure?',
    });

    const buttons = latestMessage?.buttons;
    expect(buttons).toHaveLength(2);
    expect(buttons?.[0]).toMatchObject({
      label: 'Yes, delete',
      variant: 'success',
    });
    expect(buttons?.[1]).toMatchObject({
      label: 'No, cancel',
      variant: 'dull',
    });

    buttons?.[0]?.onClick?.();
    buttons?.[1]?.onClick?.();

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('uses default text when labels and message are omitted', () => {
    const onConfirm = vi.fn();
    const onReject = vi.fn();

    const button = createRequestConfirmationButton({
      initialLabel: 'Run action',
      onConfirm,
      onReject,
    });

    button.onClick?.();

    const latestMessage = useChatStore.getState().getPreviousMessage();
    expect(latestMessage?.content).toBe('Are you sure you want to do this?');

    const buttons = latestMessage?.buttons;
    expect(buttons?.[0]?.label).toBe('Confirm');
    expect(buttons?.[1]?.label).toBe('Decline');
  });
});
