import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Chat,
  useChatGlobalsStore,
  useChatStore,
  useInputFieldStore,
  usePersistentButtonStore,
} from 'react-actions-chat';
import {
  createInMemorySupportFlowAdapter,
  createSupportAdminFlow,
  createSupportUserFlow,
  type SupportFlowAdapter,
  type SupportLiveChatSession,
  type SupportTicket,
} from 'react-actions-chat-support';
import { createSupportLoadingController } from '../supportFlowUtils';

/**
 * Resets shared chat stores before support flow tests.
 */
function resetChatStores(): void {
  useChatGlobalsStore.getState().resetChatGlobals();
  useChatStore.getState().clearMessages();
  usePersistentButtonStore.getState().clearButtons();
  useInputFieldStore.getState().setInputFieldValue('');
  useInputFieldStore.getState().resetInputFieldDescription();
  useInputFieldStore.getState().resetInputFieldPlaceholder();
  useInputFieldStore.getState().resetInputFieldDisabledPlaceholder();
  useInputFieldStore.getState().resetInputFieldType();
  useInputFieldStore.getState().resetInputFieldValidator();
  useInputFieldStore.getState().resetInputFieldSubmitGuard();
  useInputFieldStore.getState().resetInputFieldFiles();
  useInputFieldStore.getState().resetInputFieldOptions();
  useInputFieldStore.getState().resetInputFieldFileUploadEnabled();
  useInputFieldStore.getState().resetInputFieldDisabledDefault();
  useInputFieldStore.getState().resetInputFieldDisabledPlaceholderDefault();
  useInputFieldStore.getState().resetInputFieldDisabled();
}

/**
 * Returns the latest rendered button with the provided label.
 *
 * @param label - Label value passed to the helper.
 */
function getLatestButton(label: string): HTMLElement {
  const buttons = screen.getAllByRole('button', { name: label });
  return buttons[buttons.length - 1]!;
}

/**
 * Creates a test user that waits for button action locks before clicking.
 */
function setupSupportUser(): ReturnType<typeof userEvent.setup> {
  const user = userEvent.setup();
  const click = user.click.bind(user);

  return {
    ...user,
    /**
     * Clicks an element after rendered buttons leave the action-locked state.
     *
     * @param element - Rendered element targeted by the click.
     */
    click: async (element: Element): Promise<void> => {
      if (element instanceof HTMLButtonElement) {
        await waitFor(() => {
          expect(element).toBeEnabled();
        });
      }

      await click(element);
    },
  };
}

/**
 * Clicks the latest rendered button after the action lock releases it.
 *
 * @param user - Testing-library user instance used to interact with the UI.
 * @param label - Accessible button label to click.
 */
async function clickLatestButtonWhenEnabled(
  user: ReturnType<typeof userEvent.setup>,
  label: string
): Promise<void> {
  const button = getLatestButton(label);

  await waitFor(() => {
    expect(button).toBeEnabled();
  });
  await user.click(button);
}

/**
 * Selects a support list filter through the rendered input.
 *
 * @param user - Testing-library user instance used to interact with the UI.
 * @param activeFilterLabel - Current filter label shown on the filter button.
 * @param nextFilterId - Filter identifier to select.
 */
async function chooseFilter(
  user: ReturnType<typeof userEvent.setup>,
  activeFilterLabel: string,
  nextFilterId: string
): Promise<void> {
  await user.click(getLatestButton(`Filter: ${activeFilterLabel}`));
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Chat input' }),
    nextFilterId
  );
  await user.click(screen.getByRole('button', { name: 'Send message' }));
}

/**
 * Opens and aborts a support list filter input.
 *
 * @param user - Testing-library user instance used to interact with the UI.
 * @param activeFilterLabel - Current filter label shown on the filter button.
 */
async function abortFilter(
  user: ReturnType<typeof userEvent.setup>,
  activeFilterLabel: string
): Promise<void> {
  await user.click(getLatestButton(`Filter: ${activeFilterLabel}`));
  expect(
    screen.getByRole('combobox', { name: 'Chat input' })
  ).toBeInTheDocument();
  await clickLatestButtonWhenEnabled(user, 'Abort');
}

/**
 * Returns the number of rendered headings matching a name.
 *
 * @param name - Heading name matcher to query.
 */
function getHeadingCount(name: RegExp): number {
  return screen.queryAllByRole('heading', { name }).length;
}

/**
 * Waits for a heading count to increase.
 *
 * @param name - Heading name matcher to query.
 * @param previousCount - Heading count observed before the action.
 */
async function expectHeadingCountToIncrease(
  name: RegExp,
  previousCount: number
): Promise<void> {
  await waitFor(() => {
    expect(getHeadingCount(name)).toBeGreaterThan(previousCount);
  });
}

/**
 * Wraps a support adapter with async methods for tests.
 *
 * @param adapter - Support adapter to wrap with async methods.
 */
function createAsyncSupportFlowAdapter(
  adapter: SupportFlowAdapter
): SupportFlowAdapter {
  return {
    createTicket: async input => adapter.createTicket(input),
    getTicketByReference: async reference =>
      adapter.getTicketByReference(reference),
    listCustomerTickets: async (customer, request) =>
      adapter.listCustomerTickets(customer, request),
    deleteTicket: async input => adapter.deleteTicket?.(input) ?? false,
    listQueue: async (filter, request) => adapter.listQueue(filter, request),
    listLiveChatQueue: async filter => adapter.listLiveChatQueue(filter),
    getLiveChatById: async sessionId => adapter.getLiveChatById(sessionId),
    listCustomerLiveChats: async customer =>
      adapter.listCustomerLiveChats(customer),
    updateTicket: async input => adapter.updateTicket(input),
    appendTicketMessage: async input => adapter.appendTicketMessage(input),
    startLiveChat: async input => adapter.startLiveChat(input),
    updateLiveChat: async input => adapter.updateLiveChat(input),
    appendLiveChatMessage: async input => adapter.appendLiveChatMessage(input),
  };
}

/**
 * Creates a support ticket fixture for queue sorting tests.
 *
 * @param options - Options object passed to the helper.
 */
function createQueueTestTicket({
  reference,
  priority,
  updatedAt,
  assignedTo,
  status = 'open',
}: {
  /**
   * Ticket reference used by the queue fixture.
   */
  readonly reference: string;
  /**
   * Ticket priority used by the queue fixture.
   */
  readonly priority: SupportTicket['priority'];
  /**
   * Updated timestamp used by the queue fixture.
   */
  readonly updatedAt: string;
  /**
   * Optional assignee label used by the queue fixture.
   */
  readonly assignedTo?: string | undefined;
  /**
   * Support status used by the fixture.
   */
  readonly status?: SupportTicket['status'] | undefined;
}): SupportTicket {
  const createdAt = new Date('2026-04-30T12:00:00Z');

  return {
    reference,
    subject: `${reference} subject`,
    summary: `${reference} queue test`,
    customer: {
      id: `customer-${reference}`,
      name: 'Queue Customer',
    },
    status,
    priority,
    ...(assignedTo ? { assignedTo } : {}),
    liveChatOffered: false,
    createdAt,
    updatedAt: new Date(updatedAt),
    messages: [
      {
        id: `message-${reference}`,
        author: 'customer',
        body: `${reference} queue test`,
        createdAt,
      },
    ],
  };
}

/**
 * Creates a live-chat fixture for queue sorting tests.
 *
 * @param options - Options object passed to the helper.
 */
function createQueueTestLiveChat({
  id,
  queuePosition,
  status = 'queued',
}: {
  /**
   * Live-chat session identifier used by the queue fixture.
   */
  readonly id: string;
  /**
   * Queue position used by the live-chat fixture.
   */
  readonly queuePosition: number;
  /**
   * Support status used by the fixture.
   */
  readonly status?: SupportLiveChatSession['status'] | undefined;
}): SupportLiveChatSession {
  const createdAt = new Date('2026-04-30T12:00:00Z');

  return {
    id,
    summary: `${id} queue handoff`,
    requestedBy: 'customer',
    queuePosition,
    estimatedWaitMinutes: queuePosition * 3,
    status,
    createdAt,
    customer: {
      id: `customer-${id}`,
      name: 'Queue Customer',
    },
    messages: [
      {
        id: `message-${id}`,
        author: 'customer',
        body: `${id} queue handoff`,
        createdAt,
      },
    ],
  };
}

/**
 * Deferred promise helper used to hold async support operations open.
 */
interface Deferred<TResult> {
  /**
   * Promise exposed to the async operation under test.
   */
  readonly promise: Promise<TResult>;
  /**
   * Resolves the pending promise with a result value.
   *
   * @param value - Result passed back to the waiting operation.
   */
  readonly resolve: (value: TResult | PromiseLike<TResult>) => void;
}

/**
 * Creates a promise that tests can resolve after asserting pending UI state.
 */
function createDeferred<TResult>(): Deferred<TResult> {
  let resolve: (value: TResult | PromiseLike<TResult>) => void = () => {};
  const promise = new Promise<TResult>(nextResolve => {
    resolve = nextResolve;
  });

  return {
    promise,
    resolve,
  };
}

describe('support flows package', () => {
  beforeEach(() => {
    resetChatStores();
  });

  it('keeps support loading visible when an earlier loading owner clears first', async () => {
    const loadingController = createSupportLoadingController();
    const operation = createDeferred<string>();

    act(() => {
      useChatStore.getState().setLoading(true);
    });

    const result = loadingController.runWithLoading(() => operation.promise);

    await new Promise<void>(resolve => {
      globalThis.setTimeout(resolve, 200);
    });
    expect(useChatStore.getState().isLoading).toBe(true);

    act(() => {
      useChatStore.getState().clearLoading();
    });
    expect(useChatStore.getState().isLoading).toBe(true);

    await act(async () => {
      operation.resolve('done');
      await result;
    });
    expect(useChatStore.getState().isLoading).toBe(false);
  });

  it('does not reclaim loading after the chat is reset', async () => {
    const loadingController = createSupportLoadingController();
    const operation = createDeferred<string>();

    const result = loadingController.runWithLoading(() => operation.promise);

    await new Promise<void>(resolve => {
      globalThis.setTimeout(resolve, 200);
    });
    expect(useChatStore.getState().isLoading).toBe(true);

    act(() => {
      useChatStore.getState().clearMessages();
    });
    expect(useChatStore.getState().isLoading).toBe(false);

    await act(async () => {
      operation.resolve('done');
      await result;
    });
    expect(useChatStore.getState().isLoading).toBe(false);
  });

  it('clears support-owned loading after the transcript is replaced', async () => {
    const loadingController = createSupportLoadingController();
    const operation = createDeferred<string>();

    const result = loadingController.runWithLoading(() => operation.promise);

    await new Promise<void>(resolve => {
      globalThis.setTimeout(resolve, 200);
    });
    expect(useChatStore.getState().isLoading).toBe(true);

    act(() => {
      useChatStore.getState().setMessages([
        {
          id: 1,
          type: 'other',
          rawContent: 'Transcript replaced while support work is pending.',
          parts: [
            {
              type: 'text',
              text: 'Transcript replaced while support work is pending.',
            },
          ],
          timestamp: new Date(),
        },
      ]);
    });
    expect(useChatStore.getState().isLoading).toBe(true);

    await act(async () => {
      operation.resolve('done');
      await result;
    });
    expect(useChatStore.getState().isLoading).toBe(false);
  });

  it('handles the customer support flow for tickets and live chat', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const flow = createSupportUserFlow({
      adapter,
      customer: {
        id: 'customer-1',
        name: 'Alex Morgan',
        email: 'alex@example.com',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    expect(
      screen.getByRole('button', { name: 'View tickets' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Start ticket',
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start ticket' }));
    await user.type(
      screen.getByPlaceholderText(
        'Our team cannot invite new users after enabling SSO.'
      ),
      'Our admins cannot invite new users after enabling SSO in production.'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is open for Alex Morgan/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start live chat' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Back to support options' })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Back to support options' })
    );
    expect(
      await screen.findByRole('button', { name: 'Start live chat' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View tickets' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View tickets' }));
    expect(
      await screen.findByRole('heading', {
        name: /Here are your latest tickets:/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/SUP-1000 \(normal\):/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Back to support options' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start ticket' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start live chat' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'SUP-1000' }));
    expect(
      await screen.findByRole('heading', { name: /Ticket SUP-1000/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start live chat' })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Status:/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Our admins cannot invite new users after enabling SSO in production\./i
      ).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Add detail' }));
    await user.type(
      screen.getByPlaceholderText(
        'The error started after we rotated SSO certificates...'
      ),
      'The failures started right after the Okta certificate rotation at 9 AM UTC.'
    );
    await user.keyboard('{Enter}');
    expect(
      await screen.findByRole('heading', { name: /New detail/i })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /The failures started right after the Okta certificate rotation at 9 AM UTC\./i
      ).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Refresh status' }));
    expect(
      screen.getAllByText(
        /The failures started right after the Okta certificate rotation at 9 AM UTC\./i
      ).length
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('button', { name: 'View full activity' })
    );
    expect(
      await screen.findByRole('heading', {
        name: /Full activity for SUP-1000/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Our admins cannot invite new users after enabling SSO in production\./i
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        /The failures started right after the Okta certificate rotation at 9 AM UTC\./i
      ).length
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('button', { name: 'Back to support options' })
    );
    await user.click(screen.getByRole('button', { name: 'Start live chat' }));
    await user.type(
      screen.getByPlaceholderText(
        'We are blocked from deploying to production...'
      ),
      'Production admins are blocked and need an urgent handoff.'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', {
        name: /^Live chat$/i,
      })
    ).toBeInTheDocument();
    expect(screen.queryByText(/chat-0001/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Status:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Estimated wait:/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Handoff summary/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chat transcript/i)).not.toBeInTheDocument();

    expect(
      screen.getByPlaceholderText('Waiting for a support agent to join...')
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Type a live chat message...')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Join chat' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Send chat message' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Chat persistent actions' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'End live chat' })
    ).toBeInTheDocument();

    await adapter.updateLiveChat({
      sessionId: 'chat-0001',
      status: 'active',
      queuePosition: 0,
      estimatedWaitMinutes: 0,
      agent: {
        id: 'agent-chat-1',
        name: 'Morgan Admin',
        email: 'morgan@example.com',
      },
    });
    await user.click(screen.getByRole('button', { name: 'Refresh chat' }));
    expect(
      await screen.findByPlaceholderText('Type a live chat message...')
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText('Type a live chat message...'),
      'The invite modal now fails with a 403 response.'
    );
    await user.keyboard('{Enter}');
    expect(
      (
        await screen.findAllByText(
          /The invite modal now fails with a 403 response\./i
        )
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/The invite modal now fails with a 403 response\./i)
        .length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'End live chat' }));
    expect(
      await screen.findByRole('heading', {
        name: /^Ended live chat$/i,
      })
    ).toBeInTheDocument();
    expect(screen.queryByText(/chat-0001/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'End live chat' })
    ).not.toBeInTheDocument();
  }, 60_000);

  it('lets customers delete their tickets', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const customer = {
      id: 'customer-delete',
      name: 'Delete Tester',
      email: 'delete@example.com',
    };
    const flow = createSupportUserFlow({
      adapter,
      customer,
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'Start ticket' }));
    await user.type(
      screen.getByPlaceholderText(
        'Our team cannot invite new users after enabling SSO.'
      ),
      'Please delete this ticket after we verify the confirmation flow.'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is open for Delete Tester/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete ticket' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete ticket' }));
    expect(
      await screen.findByText(/Delete SUP-1000 permanently\?/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Keep ticket' }));
    expect(
      await screen.findByText(/Ticket SUP-1000 was not deleted\./i)
    ).toBeInTheDocument();
    expect(await adapter.getTicketByReference('SUP-1000')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Delete ticket' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(
      await screen.findByRole('heading', {
        name: /Deleted ticket SUP-1000/i,
      })
    ).toBeInTheDocument();
    expect(await adapter.getTicketByReference('SUP-1000')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'View tickets' }));
    expect(
      await screen.findByRole('heading', {
        name: /Here are your latest tickets:/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/No tickets to show\./i)).toBeInTheDocument();
    expect(screen.queryByText(/SUP-1000 \(normal\):/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Back to support options' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start ticket' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Start live chat' })
    ).not.toBeInTheDocument();
  });

  it('restores customer guidance after an input flow is aborted', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const flow = createSupportUserFlow({
      adapter,
      customer: {
        id: 'customer-3',
        name: 'Taylor Hart',
        email: 'taylor@example.com',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'Start ticket' }));
    await clickLatestButtonWhenEnabled(user, 'Abort');

    expect(
      await screen.findByText(/Ticket creation cancelled\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start ticket' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start live chat' })
    ).toBeInTheDocument();
  });

  it('shows ticket lookup on initial customer messages when tickets load asynchronously', async () => {
    const user = setupSupportUser();
    const ticket = createQueueTestTicket({
      reference: 'SUP-2000',
      priority: 'normal',
      updatedAt: '2026-04-30T18:00:00Z',
    });
    const flow = createSupportUserFlow({
      callbacks: {
        listTickets: () => Promise.resolve([ticket]),
      },
      customer: {
        id: 'async-ticket-customer',
        name: 'Ari Kim',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    expect(
      screen.getByRole('button', { name: 'View tickets' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View tickets' }));

    expect(
      await screen.findByRole('heading', {
        name: /Here are your latest tickets:/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/SUP-2000 \(normal\):/i)).toBeInTheDocument();
  });

  it('paginates customer ticket lists beyond the configured limit', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-3000',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3001',
        priority: 'normal',
        updatedAt: '2026-04-30T19:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3002',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3003',
        priority: 'normal',
        updatedAt: '2026-04-30T17:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3004',
        priority: 'normal',
        updatedAt: '2026-04-30T16:00:00Z',
      }),
    ];
    const flow = createSupportUserFlow({
      callbacks: {
        listTickets: () => tickets,
      },
      customer: {
        id: 'ticket-pagination-customer',
        name: 'Ari Kim',
      },
      behavior: {
        ticketListLimit: 2,
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View tickets' }));

    expect(
      await screen.findByText(/Showing tickets 1-2 of 5/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'SUP-3000' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'SUP-3001' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'SUP-3002' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous tickets' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next tickets' }));

    expect(
      await screen.findByText(/Showing tickets 3-4 of 5/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-3002')).toBeInTheDocument();
    expect(getLatestButton('SUP-3003')).toBeInTheDocument();
    expect(getLatestButton('Previous tickets')).toBeInTheDocument();

    await user.click(getLatestButton('Next tickets'));

    expect(
      await screen.findByText(/Showing tickets 5-5 of 5/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-3004')).toBeInTheDocument();

    await user.click(getLatestButton('Previous tickets'));

    expect(getLatestButton('SUP-3002')).toBeInTheDocument();
    expect(getLatestButton('SUP-3003')).toBeInTheDocument();
  });

  it('paginates customer ticket lists returned in backend-limited pages', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-3050',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3051',
        priority: 'normal',
        updatedAt: '2026-04-30T19:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3052',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3053',
        priority: 'normal',
        updatedAt: '2026-04-30T17:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3054',
        priority: 'normal',
        updatedAt: '2026-04-30T16:00:00Z',
      }),
    ];
    const requestedOffsets: number[] = [];
    const flow = createSupportUserFlow({
      callbacks: {
        listTickets: (_customer, request) => {
          const offset = request?.offset ?? 0;

          if (request) {
            requestedOffsets.push(offset);
          }

          return {
            tickets: tickets.slice(offset, offset + 2),
            totalTickets: tickets.length,
          };
        },
      },
      customer: {
        id: 'ticket-backend-page-customer',
        name: 'Ari Kim',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View tickets' }));

    expect(
      await screen.findByText(/Showing tickets 1-2 of 5/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'SUP-3050' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'SUP-3051' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next tickets' }));

    expect(
      await screen.findByText(/Showing tickets 3-4 of 5/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-3052')).toBeInTheDocument();
    expect(getLatestButton('SUP-3053')).toBeInTheDocument();

    await user.click(getLatestButton('Next tickets'));

    expect(
      await screen.findByText(/Showing tickets 5-5 of 5/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-3054')).toBeInTheDocument();
    expect(requestedOffsets).toEqual([0, 2, 4]);
  }, 10000);

  it('paginates customer ticket lists with next offsets alone', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-3060',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3061',
        priority: 'normal',
        updatedAt: '2026-04-30T19:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3062',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
      }),
    ];
    const requestedOffsets: number[] = [];
    const flow = createSupportUserFlow({
      callbacks: {
        listTickets: (_customer, request) => {
          const offset = request?.offset ?? 0;
          const nextOffset = offset + 1;
          requestedOffsets.push(offset);

          return {
            tickets: tickets.slice(offset, nextOffset),
            nextOffset: nextOffset < tickets.length ? nextOffset : undefined,
          };
        },
      },
      customer: {
        id: 'ticket-next-offset-customer',
        name: 'Ari Kim',
      },
      behavior: {
        ticketListLimit: 1,
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View tickets' }));

    expect(
      await screen.findByText(/Showing tickets 1-1 of at least 2/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'SUP-3060' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next tickets' }));

    expect(
      await screen.findByText(/Showing tickets 2-2 of at least 3/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-3061')).toBeInTheDocument();

    await user.click(getLatestButton('Next tickets'));

    expect(
      await screen.findByText(/Showing tickets 3-3 of 3/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-3062')).toBeInTheDocument();
    expect(requestedOffsets).toEqual([0, 0, 1, 2]);
  });

  it('keeps the requested customer ticket page size for short backend pages', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-3070',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3071',
        priority: 'normal',
        updatedAt: '2026-04-30T19:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3072',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3073',
        priority: 'normal',
        updatedAt: '2026-04-30T17:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3074',
        priority: 'normal',
        updatedAt: '2026-04-30T16:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3075',
        priority: 'normal',
        updatedAt: '2026-04-30T15:00:00Z',
      }),
    ];
    const flow = createSupportUserFlow({
      callbacks: {
        listTickets: (_customer, request) => {
          const offset = request?.offset ?? 0;
          const requestedLimit = request?.limit ?? 3;
          const nextOffset = offset + requestedLimit;

          return {
            tickets: tickets.slice(offset, offset + 1),
            totalTickets: tickets.length,
            hasMore: nextOffset < tickets.length,
            nextOffset,
          };
        },
      },
      customer: {
        id: 'ticket-short-page-customer',
        name: 'Ari Kim',
      },
      behavior: {
        ticketListLimit: 3,
      },
      formatters: {
        ticketList: ({ pageCount, pageSize }) => {
          return `## Customer ticket page ${pageSize}/${pageCount}`;
        },
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View tickets' }));

    expect(
      await screen.findByRole('heading', {
        name: /Customer ticket page 3\/2/i,
      })
    ).toBeInTheDocument();
  });

  it('shows loading while a customer ticket list read is pending', async () => {
    const user = setupSupportUser();
    const ticket = createQueueTestTicket({
      reference: 'SUP-3080',
      priority: 'normal',
      updatedAt: '2026-04-30T20:00:00Z',
    });
    const ticketRead = createDeferred<readonly SupportTicket[]>();
    const flow = createSupportUserFlow({
      callbacks: {
        listTickets: (_customer, request) => {
          return request ? ticketRead.promise : [ticket];
        },
      },
      customer: {
        id: 'ticket-loading-customer',
        name: 'Ari Kim',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View tickets' }));

    expect(
      await screen.findByRole('status', { name: 'Loading' })
    ).toBeInTheDocument();

    act(() => {
      ticketRead.resolve([ticket]);
    });

    expect(
      await screen.findByRole('button', { name: ticket.reference })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole('status', { name: 'Loading' })
      ).not.toBeInTheDocument();
    });
  });

  it('shows loading while a customer ticket creation is pending', async () => {
    const user = setupSupportUser();
    const ticket = createQueueTestTicket({
      reference: 'SUP-3081',
      priority: 'normal',
      updatedAt: '2026-04-30T20:00:00Z',
    });
    const ticketCreation = createDeferred<SupportTicket>();
    const flow = createSupportUserFlow({
      callbacks: {
        createTicket: () => ticketCreation.promise,
      },
      customer: {
        id: 'ticket-write-loading-customer',
        name: 'Ari Kim',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'Start ticket' }));
    await user.type(
      screen.getByPlaceholderText(
        'Our team cannot invite new users after enabling SSO.'
      ),
      'Our admins cannot invite new users after enabling SSO in production.'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('status', { name: 'Loading' })
    ).toBeInTheDocument();

    act(() => {
      ticketCreation.resolve(ticket);
    });

    expect(
      await screen.findByRole('heading', { name: /SUP-3081 is open/i })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole('status', { name: 'Loading' })
      ).not.toBeInTheDocument();
    });
  });

  it('keeps external loading visible after a customer ticket read finishes', async () => {
    const user = setupSupportUser();
    const ticket = createQueueTestTicket({
      reference: 'SUP-3082',
      priority: 'normal',
      updatedAt: '2026-04-30T20:00:00Z',
    });
    const ticketRead = createDeferred<readonly SupportTicket[]>();
    const flow = createSupportUserFlow({
      callbacks: {
        listTickets: (_customer, request) => {
          return request ? ticketRead.promise : [ticket];
        },
      },
      customer: {
        id: 'ticket-loading-owner-customer',
        name: 'Ari Kim',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View tickets' }));

    expect(
      await screen.findByRole('status', { name: 'Loading' })
    ).toBeInTheDocument();

    act(() => {
      useChatStore.getState().setLoading(true);
    });
    act(() => {
      ticketRead.resolve([ticket]);
    });

    expect(
      await screen.findByRole('button', { name: ticket.reference })
    ).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();

    act(() => {
      useChatStore.getState().clearLoading();
    });
    await waitFor(() => {
      expect(
        screen.queryByRole('status', { name: 'Loading' })
      ).not.toBeInTheDocument();
    });
  });

  it('shows every customer ticket when no ticket list limit is configured', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-3100',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3101',
        priority: 'normal',
        updatedAt: '2026-04-30T19:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3102',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3103',
        priority: 'normal',
        updatedAt: '2026-04-30T17:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-3104',
        priority: 'normal',
        updatedAt: '2026-04-30T16:00:00Z',
      }),
    ];
    let formatterTicketListLimit: number | undefined = 1;
    const flow = createSupportUserFlow({
      callbacks: {
        listTickets: () => tickets,
      },
      customer: {
        id: 'ticket-unlimited-customer',
        name: 'Ari Kim',
      },
      formatters: {
        ticketList: ({ ticketListLimit, totalTickets, visibleTickets }) => {
          formatterTicketListLimit = ticketListLimit;
          return `## Ticket list (${ticketListLimit ?? 'no limit'})\n\n${visibleTickets?.map(ticket => ticket.reference).join(', ')}\n\nTotal: ${totalTickets}`;
        },
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View tickets' }));

    expect(
      await screen.findByRole('heading', {
        name: /Ticket list \(no limit\)/i,
      })
    ).toBeInTheDocument();
    expect(formatterTicketListLimit).toBeUndefined();
    expect(screen.getByText(/Total: 5/i)).toBeInTheDocument();
    for (const ticket of tickets) {
      expect(
        screen.getByRole('button', { name: ticket.reference })
      ).toBeInTheDocument();
    }
    expect(
      screen.queryByRole('button', { name: 'Next tickets' })
    ).not.toBeInTheDocument();
  });

  it('filters customer ticket lists with custom local predicates', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-4000',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-4001',
        priority: 'high',
        updatedAt: '2026-04-30T19:00:00Z',
        status: 'resolved',
      }),
      createQueueTestTicket({
        reference: 'SUP-4002',
        priority: 'urgent',
        updatedAt: '2026-04-30T18:00:00Z',
      }),
    ];
    const flow = createSupportUserFlow({
      callbacks: {
        listTickets: () => tickets,
      },
      customer: {
        id: 'ticket-filter-customer',
        name: 'Ari Kim',
      },
      filterOptions: {
        tickets: [
          {
            id: 'all',
            label: 'All cases',
          },
          {
            id: 'open',
            label: 'Open cases',
            predicate: ticket => ticket.status === 'open',
          },
        ],
      },
      formatters: {
        ticketList: ({ activeFilterLabel, totalTickets, visibleTickets }) => {
          return `## ${activeFilterLabel ?? 'Tickets'} (${totalTickets})\n\n${visibleTickets?.map(ticket => ticket.reference).join(', ')}`;
        },
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View tickets' }));
    expect(
      await screen.findByRole('heading', { name: /All cases \(3\)/i })
    ).toBeInTheDocument();
    const initialAllCasesCount = getHeadingCount(/All cases \(3\)/i);

    await abortFilter(user, 'All cases');

    await expectHeadingCountToIncrease(
      /All cases \(3\)/i,
      initialAllCasesCount
    );
    expect(getLatestButton('Filter: All cases')).toBeInTheDocument();

    await chooseFilter(user, 'All cases', 'open');

    expect(
      await screen.findByRole('heading', { name: /Open cases \(2\)/i })
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-4000')).toBeInTheDocument();
    expect(getLatestButton('SUP-4002')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'SUP-4001' })
    ).not.toBeInTheDocument();
  });

  it('filters customer backend-paged ticket lists beyond the first backend page', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-4050',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
        status: 'resolved',
      }),
      createQueueTestTicket({
        reference: 'SUP-4051',
        priority: 'high',
        updatedAt: '2026-04-30T19:00:00Z',
        status: 'resolved',
      }),
      createQueueTestTicket({
        reference: 'SUP-4052',
        priority: 'urgent',
        updatedAt: '2026-04-30T18:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-4053',
        priority: 'normal',
        updatedAt: '2026-04-30T17:00:00Z',
      }),
    ];
    const flow = createSupportUserFlow({
      callbacks: {
        listTickets: (_customer, request) => {
          const offset = request?.offset ?? 0;
          const limit = request?.limit ?? 2;
          const nextOffset = offset + limit;

          return {
            tickets: tickets.slice(offset, nextOffset),
            hasMore: nextOffset < tickets.length,
            nextOffset: nextOffset < tickets.length ? nextOffset : undefined,
          };
        },
      },
      customer: {
        id: 'ticket-backend-filter-customer',
        name: 'Ari Kim',
      },
      filterOptions: {
        tickets: [
          {
            id: 'all',
            label: 'All cases',
          },
          {
            id: 'open',
            label: 'Open cases',
            predicate: ticket => ticket.status === 'open',
          },
        ],
      },
      formatters: {
        ticketList: ({ activeFilterLabel, totalTickets, visibleTickets }) => {
          return `## ${activeFilterLabel ?? 'Tickets'} (${totalTickets})\n\n${visibleTickets?.map(ticket => ticket.reference).join(', ')}`;
        },
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View tickets' }));
    await chooseFilter(user, 'All cases', 'open');

    expect(
      await screen.findByRole('heading', { name: /Open cases \(2\)/i })
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-4052')).toBeInTheDocument();
    expect(getLatestButton('SUP-4053')).toBeInTheDocument();
    expect(
      screen.queryByText(/No tickets match Open cases/i)
    ).not.toBeInTheDocument();
  });

  it('handles customer tickets and live chat through async adapter methods', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const asyncAdapter = createAsyncSupportFlowAdapter(adapter);
    const flow = createSupportUserFlow({
      adapter: asyncAdapter,
      customer: {
        id: 'async-customer',
        name: 'Ari Kim',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    expect(
      screen.getByRole('button', { name: 'View tickets' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start ticket' }));
    await user.type(
      screen.getByPlaceholderText(
        'Our team cannot invite new users after enabling SSO.'
      ),
      'Async callbacks need to keep ticket creation working for customers.'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is open for Ari Kim/i,
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add detail' }));
    await user.type(
      screen.getByPlaceholderText(
        'The error started after we rotated SSO certificates...'
      ),
      'The async backend accepted the follow-up details.'
    );
    await user.keyboard('{Enter}');
    expect(
      await screen.findByRole('heading', { name: /New detail/i })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'View full activity' })
    );
    expect(
      await screen.findByRole('heading', {
        name: /Full activity for SUP-1000/i,
      })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Back to support options' })
    );
    await user.click(screen.getByRole('button', { name: 'View tickets' }));
    expect(
      await screen.findByRole('heading', {
        name: /Here are your latest tickets:/i,
      })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Back to support options' })
    );
    await user.click(screen.getByRole('button', { name: 'Start live chat' }));
    await user.type(
      screen.getByPlaceholderText(
        'We are blocked from deploying to production...'
      ),
      'Async callbacks need to keep live chat handoff working.'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', { name: /^Live chat$/i })
    ).toBeInTheDocument();

    await asyncAdapter.updateLiveChat({
      sessionId: 'chat-0001',
      status: 'active',
      queuePosition: 0,
      estimatedWaitMinutes: 0,
      agent: {
        id: 'async-agent',
        name: 'Morgan Admin',
      },
    });
    await user.click(screen.getByRole('button', { name: 'Refresh chat' }));
    expect(
      await screen.findByPlaceholderText('Type a live chat message...')
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText('Type a live chat message...'),
      'The async backend accepted the chat reply.'
    );
    await user.keyboard('{Enter}');
    expect(
      (
        await screen.findAllByText(
          /The async backend accepted the chat reply\./i
        )
      ).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'End live chat' }));
    expect(
      await screen.findByRole('heading', { name: /^Ended live chat$/i })
    ).toBeInTheDocument();
  }, 30_000);

  it('allows library users to customize support input validation', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const flow = createSupportUserFlow({
      adapter,
      customer: {
        id: 'customer-validation',
        name: 'Riley Chen',
        email: 'riley@example.com',
      },
      validation: {
        ticketSummary: {
          minMessageLength: 0,
          maxMessageLength: 12,
          maxMessageLengthMessage: 'Keep ticket summaries short.',
        },
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'Start ticket' }));
    await user.type(
      screen.getByPlaceholderText(
        'Our team cannot invite new users after enabling SSO.'
      ),
      'This summary is too long.'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText(/Keep ticket summaries short\./i)
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(
        'Our team cannot invite new users after enabling SSO.'
      ),
      'Short'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is open for Riley Chen/i,
      })
    ).toBeInTheDocument();
  });

  it('does not apply built-in minimum validation to customer ticket summaries', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const flow = createSupportUserFlow({
      adapter,
      customer: {
        id: 'customer-no-default-validation',
        name: 'Riley Chen',
        email: 'riley@example.com',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'Start ticket' }));
    await user.type(
      screen.getByPlaceholderText(
        'Our team cannot invite new users after enabling SSO.'
      ),
      'Short'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is open for Riley Chen/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Please share a little more detail/i)
    ).not.toBeInTheDocument();
  });

  it('does not apply built-in minimum validation to admin ticket replies', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const ticket = await adapter.createTicket({
      customer: {
        id: 'admin-no-default-validation-customer',
        name: 'Alex Morgan',
      },
      summary: 'Admin reply defaults should not block short replies.',
    });
    const flow = createSupportAdminFlow({
      adapter,
      agent: {
        id: 'admin-no-default-validation',
        name: 'Priya Admin',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));
    await user.click(getLatestButton(ticket.reference));
    await user.click(screen.getByRole('button', { name: 'Reply to customer' }));
    await user.type(
      screen.getByPlaceholderText(
        'We reproduced the issue and are working on a fix.'
      ),
      'Ok'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', {
        name: new RegExp(`Sent your reply on ${ticket.reference}`, 'i'),
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Please enter at least/i)
    ).not.toBeInTheDocument();
  });

  it('allows customer flows to customize prompts, rendering, and button slots', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const flow = createSupportUserFlow({
      adapter,
      customer: {
        id: 'customer-custom',
        name: 'Jordan Blake',
        email: 'jordan@example.com',
      },
      formatters: {
        openingMessage: ({ customer }) => {
          return `## ${customer.name} support portal`;
        },
        ticketCreated: ({ ticket }) => {
          return `## Custom case ${ticket.reference}`;
        },
      },
      requestInputs: {
        createTicket: {
          initialLabel: 'Open case',
          inputPromptMessage: 'Tell us what changed.',
          placeholder: ({ customer }) => `What should ${customer.name} know?`,
        },
      },
      customizeButtons: ({ slot, defaultButtons }) => {
        if (slot !== 'primary') {
          return defaultButtons;
        }

        return [
          ...defaultButtons,
          {
            label: 'Custom link',
            onClick: () => {},
          },
        ];
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    expect(
      screen.getByRole('heading', { name: /Jordan Blake support portal/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open case' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Custom link' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open case' }));
    expect(
      await screen.findByPlaceholderText('What should Jordan Blake know?')
    ).toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText('What should Jordan Blake know?'),
      'The workspace cannot provision seats after the renewal completed.'
    );
    await user.keyboard('{Enter}');

    expect(
      await screen.findByRole('heading', { name: /Custom case SUP-1000/i })
    ).toBeInTheDocument();
  });

  it('allows the in-memory adapter to customize IDs, defaults, matching, and queue math', async () => {
    const now = new Date('2026-04-30T09:30:00Z');
    const adapter = createInMemorySupportFlowAdapter({
      now: () => now,
      createTicketReference: ({ nextTicketNumber }) => {
        return `CASE-${nextTicketNumber}`;
      },
      createTicketSubject: ({ input }) => {
        return `Custom subject: ${input.summary.slice(0, 12)}`;
      },
      createTicketMessageId: ({ nextMessageNumber }) => {
        return `ticket-note-${nextMessageNumber}`;
      },
      createLiveChatId: ({ nextLiveChatNumber }) => {
        return `session-${nextLiveChatNumber}`;
      },
      createLiveChatMessageId: ({ nextMessageNumber }) => {
        return `chat-note-${nextMessageNumber}`;
      },
      defaultTicketStatus: 'open',
      defaultTicketPriority: 'high',
      getLiveChatQueuePosition: () => 7,
      getEstimatedWaitMinutes: () => 42,
      matchCustomer: (candidate, customer) => {
        return Boolean(
          candidate.company &&
          customer.company &&
          candidate.company === customer.company
        );
      },
    });

    const ticket = await adapter.createTicket({
      customer: {
        company: 'Acme',
      },
      summary: 'Provisioning is blocked after renewal.',
    });
    const session = await adapter.startLiveChat({
      requestedBy: 'customer',
      customer: {
        company: 'Acme',
      },
      summary: 'Need a live handoff for provisioning.',
    });
    const customerSessions = await adapter.listCustomerLiveChats({
      company: 'Acme',
    });

    expect(ticket.reference).toBe('CASE-1000');
    expect(ticket.subject).toBe('Custom subject: Provisioning');
    expect(ticket.messages[0]?.id).toBe('ticket-note-1');
    expect(ticket.status).toBe('open');
    expect(ticket.priority).toBe('high');
    expect(ticket.createdAt).toEqual(now);
    expect(session.id).toBe('session-1');
    expect(session.messages?.[0]?.id).toBe('chat-note-1');
    expect(session.queuePosition).toBe(7);
    expect(session.estimatedWaitMinutes).toBe(42);
    expect(customerSessions).toHaveLength(1);
  });

  it('orders untaken queue tickets by priority', async () => {
    const adapter = createInMemorySupportFlowAdapter({
      tickets: [
        createQueueTestTicket({
          reference: 'SUP-1000',
          priority: 'low',
          updatedAt: '2026-04-30T18:00:00Z',
        }),
        createQueueTestTicket({
          reference: 'SUP-1001',
          priority: 'urgent',
          updatedAt: '2026-04-30T12:00:00Z',
        }),
        createQueueTestTicket({
          reference: 'SUP-1002',
          priority: 'normal',
          updatedAt: '2026-04-30T15:00:00Z',
        }),
        createQueueTestTicket({
          reference: 'SUP-1003',
          priority: 'high',
          updatedAt: '2026-04-30T20:00:00Z',
          assignedTo: 'Priya Admin',
        }),
      ],
    });

    const queue = await adapter.listQueue();
    const queueTickets: readonly SupportTicket[] = Array.isArray(queue)
      ? queue
      : (queue as { readonly tickets: readonly SupportTicket[] }).tickets;

    expect(queueTickets.map(ticket => ticket.reference)).toEqual([
      'SUP-1001',
      'SUP-1002',
      'SUP-1000',
      'SUP-1003',
    ]);
  });

  it('shows unassigned tickets before assigned tickets in admin queues', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-1000',
        priority: 'urgent',
        updatedAt: '2026-04-30T20:00:00Z',
        assignedTo: 'Priya Admin',
      }),
      createQueueTestTicket({
        reference: 'SUP-1001',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1002',
        priority: 'low',
        updatedAt: '2026-04-30T16:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1003',
        priority: 'high',
        updatedAt: '2026-04-30T14:00:00Z',
        assignedTo: 'Morgan Admin',
      }),
    ];
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: () => tickets,
        getTicket: reference => {
          return tickets.find(ticket => ticket.reference === reference) ?? null;
        },
      },
      agent: {
        id: 'assignment-order-agent',
        name: 'Priya Admin',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));

    const firstUnassigned = await screen.findByText(/SUP-1001 \(normal\):/i);
    const secondUnassigned = screen.getByText(/SUP-1002 \(low\):/i);
    const firstAssigned = screen.getByText(/SUP-1000 \(urgent\):/i);
    const secondAssigned = screen.getByText(/SUP-1003 \(high\):/i);

    expect(
      firstUnassigned.compareDocumentPosition(secondUnassigned) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      secondUnassigned.compareDocumentPosition(firstAssigned) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      firstAssigned.compareDocumentPosition(secondAssigned) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('shows every admin ticket and live chat when no queue limits are configured', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-1100',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1101',
        priority: 'normal',
        updatedAt: '2026-04-30T19:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1102',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1103',
        priority: 'normal',
        updatedAt: '2026-04-30T17:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1104',
        priority: 'normal',
        updatedAt: '2026-04-30T16:00:00Z',
      }),
    ];
    const sessions = [
      createQueueTestLiveChat({
        id: 'chat-1100',
        queuePosition: 1,
      }),
      createQueueTestLiveChat({
        id: 'chat-1101',
        queuePosition: 2,
      }),
      createQueueTestLiveChat({
        id: 'chat-1102',
        queuePosition: 3,
      }),
      createQueueTestLiveChat({
        id: 'chat-1103',
        queuePosition: 4,
      }),
      createQueueTestLiveChat({
        id: 'chat-1104',
        queuePosition: 5,
      }),
    ];
    let formatterQueueLimit: number | undefined = 1;
    let formatterLiveChatQueueLimit: number | undefined = 1;
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: () => tickets,
        getTicket: reference => {
          return tickets.find(ticket => ticket.reference === reference) ?? null;
        },
        listLiveChatQueue: () => sessions,
        getLiveChat: sessionId => {
          return sessions.find(session => session.id === sessionId) ?? null;
        },
      },
      agent: {
        id: 'queue-unlimited-agent',
        name: 'Priya Admin',
      },
      formatters: {
        ticketQueue: ({ queueLimit, totalTickets, visibleTickets }) => {
          formatterQueueLimit = queueLimit;
          return `## Ticket queue (${queueLimit ?? 'no limit'})\n\n${visibleTickets?.map(ticket => ticket.reference).join(', ')}\n\nTotal: ${totalTickets}`;
        },
        liveChatQueue: ({
          liveChatQueueLimit,
          totalSessions,
          visibleSessions,
        }) => {
          formatterLiveChatQueueLimit = liveChatQueueLimit;
          return `## Live chat queue (${liveChatQueueLimit ?? 'no limit'})\n\n${visibleSessions?.map(session => session.id).join(', ')}\n\nTotal: ${totalSessions}`;
        },
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));

    expect(
      await screen.findByRole('heading', {
        name: /Ticket queue \(no limit\)/i,
      })
    ).toBeInTheDocument();
    expect(formatterQueueLimit).toBeUndefined();
    expect(screen.getByText(/Total: 5/i)).toBeInTheDocument();
    for (const ticket of tickets) {
      expect(
        screen.getByRole('button', { name: ticket.reference })
      ).toBeInTheDocument();
    }
    expect(
      screen.queryByRole('button', { name: 'Next tickets' })
    ).not.toBeInTheDocument();

    await user.click(getLatestButton('Back to admin options'));
    await user.click(getLatestButton('View live chat queue'));

    expect(
      await screen.findByRole('heading', {
        name: /Live chat queue \(no limit\)/i,
      })
    ).toBeInTheDocument();
    expect(formatterLiveChatQueueLimit).toBeUndefined();
    expect(screen.getAllByText(/Total: 5/i)).toHaveLength(2);
    for (const session of sessions) {
      expect(
        screen.getByRole('button', { name: session.id })
      ).toBeInTheDocument();
    }
    expect(
      screen.queryByRole('button', { name: 'Next live chats' })
    ).not.toBeInTheDocument();
  });

  it('paginates admin ticket queues beyond the configured limit', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-1000',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1001',
        priority: 'normal',
        updatedAt: '2026-04-30T19:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1002',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1003',
        priority: 'normal',
        updatedAt: '2026-04-30T17:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1004',
        priority: 'normal',
        updatedAt: '2026-04-30T16:00:00Z',
      }),
    ];
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: () => tickets,
        getTicket: reference => {
          return tickets.find(ticket => ticket.reference === reference) ?? null;
        },
      },
      agent: {
        id: 'queue-pagination-agent',
        name: 'Priya Admin',
      },
      behavior: {
        queueLimit: 2,
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));

    expect(
      await screen.findByText(/Showing tickets 1-2 of 5/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'SUP-1000' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'SUP-1001' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'SUP-1002' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous tickets' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next tickets' }));

    expect(
      await screen.findByText(/Showing tickets 3-4 of 5/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-1002')).toBeInTheDocument();
    expect(getLatestButton('SUP-1003')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'SUP-1004' })
    ).not.toBeInTheDocument();
    expect(getLatestButton('Previous tickets')).toBeInTheDocument();

    await user.click(getLatestButton('Next tickets'));

    expect(
      await screen.findByText(/Showing tickets 5-5 of 5/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-1004')).toBeInTheDocument();

    await user.click(getLatestButton('Previous tickets'));

    expect(getLatestButton('SUP-1002')).toBeInTheDocument();
    expect(getLatestButton('SUP-1003')).toBeInTheDocument();
  });

  it('paginates admin ticket queues returned in backend-limited pages', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-1050',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
        assignedTo: 'Priya Admin',
      }),
      createQueueTestTicket({
        reference: 'SUP-1051',
        priority: 'normal',
        updatedAt: '2026-04-30T19:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1052',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1053',
        priority: 'normal',
        updatedAt: '2026-04-30T17:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1054',
        priority: 'normal',
        updatedAt: '2026-04-30T16:00:00Z',
      }),
    ];
    const requestedOffsets: number[] = [];
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: (_filter, request) => {
          const offset = request?.offset ?? 0;

          if (request) {
            requestedOffsets.push(offset);
          }

          return {
            tickets: tickets.slice(offset, offset + 2),
            totalTickets: tickets.length,
          };
        },
        getTicket: reference => {
          return tickets.find(ticket => ticket.reference === reference) ?? null;
        },
      },
      agent: {
        id: 'queue-backend-page-agent',
        name: 'Priya Admin',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));

    expect(
      await screen.findByText(/Showing tickets 1-2 of 5/i)
    ).toBeInTheDocument();
    const firstBackendTicket = screen.getByText(/SUP-1050 \(normal\):/i);
    const secondBackendTicket = screen.getByText(/SUP-1051 \(normal\):/i);
    expect(
      screen.getByRole('button', { name: 'SUP-1050' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'SUP-1051' })
    ).toBeInTheDocument();
    expect(
      firstBackendTicket.compareDocumentPosition(secondBackendTicket) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Next tickets' }));

    expect(
      await screen.findByText(/Showing tickets 3-4 of 5/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-1052')).toBeInTheDocument();
    expect(getLatestButton('SUP-1053')).toBeInTheDocument();

    await user.click(getLatestButton('Next tickets'));

    expect(
      await screen.findByText(/Showing tickets 5-5 of 5/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-1054')).toBeInTheDocument();
    expect(requestedOffsets).toEqual([0, 2, 4]);
  });

  it('paginates admin ticket queues with next offsets alone', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-1070',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1071',
        priority: 'normal',
        updatedAt: '2026-04-30T19:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1072',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
      }),
    ];
    const requestedOffsets: number[] = [];
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: (_filter, request) => {
          const offset = request?.offset ?? 0;
          const nextOffset = offset + 1;
          requestedOffsets.push(offset);

          return {
            tickets: tickets.slice(offset, nextOffset),
            nextOffset: nextOffset < tickets.length ? nextOffset : undefined,
          };
        },
        getTicket: reference => {
          return tickets.find(ticket => ticket.reference === reference) ?? null;
        },
      },
      agent: {
        id: 'queue-next-offset-agent',
        name: 'Priya Admin',
      },
      behavior: {
        queueLimit: 1,
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));

    expect(
      await screen.findByText(/Showing tickets 1-1 of at least 2/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'SUP-1070' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next tickets' }));

    expect(
      await screen.findByText(/Showing tickets 2-2 of at least 3/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-1071')).toBeInTheDocument();

    await user.click(getLatestButton('Next tickets'));

    expect(
      await screen.findByText(/Showing tickets 3-3 of 3/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-1072')).toBeInTheDocument();
    expect(requestedOffsets).toEqual([0, 1, 2]);
  });

  it('keeps admin ticket queue offsets when assigned work opens page zero', async () => {
    const user = setupSupportUser();
    const queuePages = [
      {
        offset: 0,
        ticket: createQueueTestTicket({
          reference: 'SUP-1080',
          priority: 'normal',
          updatedAt: '2026-04-30T20:00:00Z',
        }),
        nextOffset: 10,
      },
      {
        offset: 10,
        ticket: createQueueTestTicket({
          reference: 'SUP-1081',
          priority: 'normal',
          updatedAt: '2026-04-30T19:00:00Z',
        }),
        nextOffset: 20,
      },
      {
        offset: 20,
        ticket: createQueueTestTicket({
          reference: 'SUP-1082',
          priority: 'normal',
          updatedAt: '2026-04-30T18:00:00Z',
        }),
      },
    ];
    const queueTicketsByOffset = new Map(
      queuePages.map(page => [page.offset, page] as const)
    );
    const assignedTicket = createQueueTestTicket({
      reference: 'SUP-2080',
      priority: 'normal',
      updatedAt: '2026-04-30T17:00:00Z',
      assignedTo: 'Priya Admin',
    });
    const requestedQueueOffsets: number[] = [];
    const requestedAssignedOffsets: number[] = [];
    let showQueueThirdPage:
      | (() => PromiseLike<unknown> | void | undefined)
      | undefined;
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: (filter, request) => {
          const offset = request?.offset ?? 0;

          if (filter?.assignedTo === 'Priya Admin') {
            requestedAssignedOffsets.push(offset);

            return {
              tickets: offset === 0 ? [assignedTicket] : [],
            };
          }

          requestedQueueOffsets.push(offset);
          const page = queueTicketsByOffset.get(offset);

          return {
            tickets: page ? [page.ticket] : [],
            nextOffset: page?.nextOffset,
          };
        },
        getTicket: reference => {
          const queueTicket = Array.from(queueTicketsByOffset.values()).find(
            page => page.ticket.reference === reference
          )?.ticket;

          if (queueTicket) {
            return queueTicket;
          }

          return assignedTicket.reference === reference ? assignedTicket : null;
        },
      },
      agent: {
        id: 'queue-assigned-offset-agent',
        name: 'Priya Admin',
      },
      behavior: {
        queueLimit: 1,
        assignedWorkLimit: 1,
      },
      customizeButtons: context => {
        if (
          context.slot === 'ticket-queue' &&
          context.visibleTickets?.some(
            ticket => ticket.reference === 'SUP-1081'
          ) === true
        ) {
          showQueueThirdPage = context.defaultButtons.find(
            button => button.label === 'Next tickets'
          )?.onClick;
        }

        return context.defaultButtons;
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));
    expect(
      await screen.findByText(/Showing tickets 1-1 of at least 2/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'SUP-1080' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next tickets' }));
    expect(
      await screen.findByText(/Showing tickets 11-11 of at least 12/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-1081')).toBeInTheDocument();
    expect(showQueueThirdPage).toBeDefined();

    await user.click(getLatestButton('Back to admin options'));
    await user.click(getLatestButton('My assigned work'));
    expect(
      await screen.findByRole('button', { name: 'SUP-2080' })
    ).toBeInTheDocument();

    await act(async () => {
      showQueueThirdPage?.();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(requestedQueueOffsets).toEqual([0, 10, 20]);
    });
    expect(
      await screen.findByRole('button', { name: 'SUP-1082' })
    ).toBeInTheDocument();
    expect(requestedQueueOffsets).toEqual([0, 10, 20]);
    expect(requestedAssignedOffsets).toEqual([0]);
  });

  it('keeps requested admin ticket page sizes for short backend pages', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-1060',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
        assignedTo: 'Priya Admin',
      }),
      createQueueTestTicket({
        reference: 'SUP-1061',
        priority: 'normal',
        updatedAt: '2026-04-30T19:00:00Z',
        assignedTo: 'Priya Admin',
      }),
      createQueueTestTicket({
        reference: 'SUP-1062',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
        assignedTo: 'Priya Admin',
      }),
      createQueueTestTicket({
        reference: 'SUP-1063',
        priority: 'normal',
        updatedAt: '2026-04-30T17:00:00Z',
        assignedTo: 'Priya Admin',
      }),
      createQueueTestTicket({
        reference: 'SUP-1064',
        priority: 'normal',
        updatedAt: '2026-04-30T16:00:00Z',
        assignedTo: 'Priya Admin',
      }),
      createQueueTestTicket({
        reference: 'SUP-1065',
        priority: 'normal',
        updatedAt: '2026-04-30T15:00:00Z',
        assignedTo: 'Priya Admin',
      }),
    ];
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: (filter, request) => {
          const matchingTickets = filter?.assignedTo
            ? tickets.filter(ticket => ticket.assignedTo === filter.assignedTo)
            : tickets;
          const offset = request?.offset ?? 0;
          const requestedLimit = request?.limit ?? 3;
          const nextOffset = offset + requestedLimit;

          return {
            tickets: matchingTickets.slice(offset, offset + 1),
            totalTickets: matchingTickets.length,
            hasMore: nextOffset < matchingTickets.length,
            nextOffset,
          };
        },
        getTicket: reference => {
          return tickets.find(ticket => ticket.reference === reference) ?? null;
        },
      },
      agent: {
        id: 'queue-short-page-agent',
        name: 'Priya Admin',
      },
      behavior: {
        queueLimit: 3,
        assignedWorkLimit: 2,
      },
      formatters: {
        ticketQueue: ({ pageCount, pageSize }) => {
          return `## Admin ticket page ${pageSize}/${pageCount}`;
        },
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));

    expect(
      await screen.findByRole('heading', {
        name: /Admin ticket page 3\/2/i,
      })
    ).toBeInTheDocument();

    await user.click(getLatestButton('Back to admin options'));
    await user.click(getLatestButton('My assigned work'));

    expect(
      await screen.findByRole('heading', {
        name: /Admin ticket page 2\/3/i,
      })
    ).toBeInTheDocument();
  });

  it('resets admin ticket offsets when refreshing the queue', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-1070',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1071',
        priority: 'normal',
        updatedAt: '2026-04-30T19:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1072',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-1073',
        priority: 'normal',
        updatedAt: '2026-04-30T17:00:00Z',
      }),
    ];
    const requestedOffsets: number[] = [];
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: (_filter, request) => {
          const offset = request?.offset ?? 0;
          const limit = request?.limit ?? tickets.length;
          const nextOffset = offset + limit;
          requestedOffsets.push(offset);

          return {
            tickets: tickets.slice(offset, nextOffset),
            totalTickets: tickets.length,
            hasMore: nextOffset < tickets.length,
            nextOffset: nextOffset < tickets.length ? nextOffset : undefined,
          };
        },
        getTicket: reference => {
          return tickets.find(ticket => ticket.reference === reference) ?? null;
        },
      },
      agent: {
        id: 'queue-refresh-agent',
        name: 'Priya Admin',
      },
      behavior: {
        queueLimit: 2,
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));
    expect(
      await screen.findByText(/Showing tickets 1-2 of 4/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next tickets' }));
    expect(
      await screen.findByText(/Showing tickets 3-4 of 4/i)
    ).toBeInTheDocument();

    tickets.unshift(
      createQueueTestTicket({
        reference: 'SUP-1069',
        priority: 'urgent',
        updatedAt: '2026-04-30T21:00:00Z',
      })
    );

    await user.click(getLatestButton('Refresh ticket queue'));

    expect(
      await screen.findByText(/Showing tickets 1-2 of 5/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-1069')).toBeInTheDocument();
    expect(requestedOffsets).toEqual([0, 2, 0]);
  });

  it('shows loading while an admin ticket queue database read is pending', async () => {
    const user = setupSupportUser();
    const ticket = createQueueTestTicket({
      reference: 'SUP-1060',
      priority: 'normal',
      updatedAt: '2026-04-30T20:00:00Z',
    });
    const queueRead = createDeferred<readonly SupportTicket[]>();
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: () => queueRead.promise,
        getTicket: reference => {
          return reference === ticket.reference ? ticket : null;
        },
      },
      agent: {
        id: 'queue-loading-agent',
        name: 'Priya Admin',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));

    expect(
      await screen.findByRole('status', { name: 'Loading' })
    ).toBeInTheDocument();

    queueRead.resolve([ticket]);

    expect(
      await screen.findByRole('button', { name: ticket.reference })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole('status', { name: 'Loading' })
      ).not.toBeInTheDocument();
    });
  });

  it('keeps external loading visible after a support read finishes', async () => {
    const user = setupSupportUser();
    const ticket = createQueueTestTicket({
      reference: 'SUP-1080',
      priority: 'normal',
      updatedAt: '2026-04-30T20:00:00Z',
    });
    const queueRead = createDeferred<readonly SupportTicket[]>();
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: () => queueRead.promise,
        getTicket: reference => {
          return reference === ticket.reference ? ticket : null;
        },
      },
      agent: {
        id: 'queue-loading-owner-agent',
        name: 'Priya Admin',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));

    expect(
      await screen.findByRole('status', { name: 'Loading' })
    ).toBeInTheDocument();

    act(() => {
      useChatStore.getState().setLoading(true);
    });
    act(() => {
      queueRead.resolve([ticket]);
    });

    expect(
      await screen.findByRole('button', { name: ticket.reference })
    ).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();

    act(() => {
      useChatStore.getState().clearLoading();
    });
    await waitFor(() => {
      expect(
        screen.queryByRole('status', { name: 'Loading' })
      ).not.toBeInTheDocument();
    });
  });

  it('paginates admin assigned work beyond the configured limit', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-2000',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
        assignedTo: 'Priya Admin',
      }),
      createQueueTestTicket({
        reference: 'SUP-2001',
        priority: 'normal',
        updatedAt: '2026-04-30T19:00:00Z',
        assignedTo: 'Priya Admin',
      }),
      createQueueTestTicket({
        reference: 'SUP-2002',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
        assignedTo: 'Priya Admin',
      }),
    ];
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: filter => {
          return filter?.assignedTo
            ? tickets.filter(ticket => ticket.assignedTo === filter.assignedTo)
            : tickets;
        },
        getTicket: reference => {
          return tickets.find(ticket => ticket.reference === reference) ?? null;
        },
      },
      agent: {
        id: 'assigned-pagination-agent',
        name: 'Priya Admin',
      },
      behavior: {
        assignedWorkLimit: 1,
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'My assigned work' }));

    expect(
      await screen.findByText(/Showing tickets 1-1 of 3/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'SUP-2000' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'SUP-2001' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next tickets' }));

    expect(
      await screen.findByText(/Showing tickets 2-2 of 3/i)
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-2001')).toBeInTheDocument();
    expect(getLatestButton('Previous tickets')).toBeInTheDocument();
  });

  it('filters admin ticket queue and assigned work with custom options', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-5000',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-5001',
        priority: 'urgent',
        updatedAt: '2026-04-30T19:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-5002',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
        assignedTo: 'Priya Admin',
      }),
      createQueueTestTicket({
        reference: 'SUP-5003',
        priority: 'urgent',
        updatedAt: '2026-04-30T17:00:00Z',
        assignedTo: 'Priya Admin',
      }),
    ];
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: filter => {
          return filter?.assignedTo
            ? tickets.filter(ticket => ticket.assignedTo === filter.assignedTo)
            : tickets;
        },
        getTicket: reference => {
          return tickets.find(ticket => ticket.reference === reference) ?? null;
        },
      },
      agent: {
        id: 'ticket-filter-agent',
        name: 'Priya Admin',
      },
      filterOptions: {
        ticketQueue: [
          {
            id: 'all',
            label: 'All tickets',
          },
          {
            id: 'urgent',
            label: 'Urgent tickets',
            predicate: ticket => ticket.priority === 'urgent',
          },
        ],
        assignedWork: [
          {
            id: 'assigned-all',
            label: 'All assigned',
          },
          {
            id: 'assigned-urgent',
            label: 'Urgent assigned',
            predicate: ticket => ticket.priority === 'urgent',
          },
        ],
      },
      formatters: {
        ticketQueue: ({ activeFilterLabel, totalTickets, visibleTickets }) => {
          return `## ${activeFilterLabel ?? 'Ticket queue'} (${totalTickets})\n\n${visibleTickets?.map(ticket => ticket.reference).join(', ')}`;
        },
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));
    expect(
      await screen.findByRole('heading', { name: /All tickets \(4\)/i })
    ).toBeInTheDocument();
    const initialAllTicketsCount = getHeadingCount(/All tickets \(4\)/i);

    await abortFilter(user, 'All tickets');

    await expectHeadingCountToIncrease(
      /All tickets \(4\)/i,
      initialAllTicketsCount
    );
    expect(getLatestButton('Filter: All tickets')).toBeInTheDocument();

    await chooseFilter(user, 'All tickets', 'urgent');

    expect(
      await screen.findByRole('heading', { name: /Urgent tickets \(2\)/i })
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-5001')).toBeInTheDocument();
    expect(getLatestButton('SUP-5003')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'SUP-5000' })
    ).not.toBeInTheDocument();

    await user.click(getLatestButton('Back to admin options'));
    await user.click(getLatestButton('My assigned work'));
    expect(
      await screen.findByRole('heading', { name: /All assigned \(2\)/i })
    ).toBeInTheDocument();
    const initialAllAssignedCount = getHeadingCount(/All assigned \(2\)/i);

    await abortFilter(user, 'All assigned');

    await expectHeadingCountToIncrease(
      /All assigned \(2\)/i,
      initialAllAssignedCount
    );
    expect(getLatestButton('Filter: All assigned')).toBeInTheDocument();

    await chooseFilter(user, 'All assigned', 'assigned-urgent');

    expect(
      await screen.findByRole('heading', { name: /Urgent assigned \(1\)/i })
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-5003')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'SUP-5002' })
    ).not.toBeInTheDocument();
  });

  it('filters admin backend-paged ticket queues beyond the first backend page', async () => {
    const user = setupSupportUser();
    const tickets = [
      createQueueTestTicket({
        reference: 'SUP-5100',
        priority: 'normal',
        updatedAt: '2026-04-30T20:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-5101',
        priority: 'low',
        updatedAt: '2026-04-30T19:00:00Z',
      }),
      createQueueTestTicket({
        reference: 'SUP-5102',
        priority: 'normal',
        updatedAt: '2026-04-30T18:00:00Z',
        assignedTo: 'Priya Admin',
      }),
      createQueueTestTicket({
        reference: 'SUP-5103',
        priority: 'urgent',
        updatedAt: '2026-04-30T17:00:00Z',
        assignedTo: 'Priya Admin',
      }),
    ];
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: (filter, request) => {
          const offset = request?.offset ?? 0;
          const limit = request?.limit ?? 2;
          const filteredTickets = filter?.assignedTo
            ? tickets.filter(ticket => ticket.assignedTo === filter.assignedTo)
            : tickets;
          const nextOffset = offset + limit;

          return {
            tickets: filteredTickets.slice(offset, nextOffset),
            hasMore: nextOffset < filteredTickets.length,
            nextOffset:
              nextOffset < filteredTickets.length ? nextOffset : undefined,
          };
        },
        getTicket: reference => {
          return tickets.find(ticket => ticket.reference === reference) ?? null;
        },
      },
      agent: {
        id: 'ticket-backend-filter-agent',
        name: 'Priya Admin',
      },
      behavior: {
        assignedWorkLimit: 1,
        queueLimit: 2,
      },
      filterOptions: {
        ticketQueue: [
          {
            id: 'all',
            label: 'All tickets',
          },
          {
            id: 'urgent',
            label: 'Urgent tickets',
            predicate: ticket => ticket.priority === 'urgent',
          },
        ],
        assignedWork: [
          {
            id: 'assigned-all',
            label: 'All assigned',
          },
          {
            id: 'assigned-urgent',
            label: 'Urgent assigned',
            predicate: ticket => ticket.priority === 'urgent',
          },
        ],
      },
      formatters: {
        ticketQueue: ({ activeFilterLabel, totalTickets, visibleTickets }) => {
          return `## ${activeFilterLabel ?? 'Ticket queue'} (${totalTickets})\n\n${visibleTickets?.map(ticket => ticket.reference).join(', ')}`;
        },
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));
    await chooseFilter(user, 'All tickets', 'urgent');

    expect(
      await screen.findByRole('heading', { name: /Urgent tickets \(1\)/i })
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-5103')).toBeInTheDocument();
    expect(
      screen.queryByText(/No tickets match Urgent tickets/i)
    ).not.toBeInTheDocument();

    await user.click(getLatestButton('Back to admin options'));
    await user.click(getLatestButton('My assigned work'));
    await chooseFilter(user, 'All assigned', 'assigned-urgent');

    expect(
      await screen.findByRole('heading', { name: /Urgent assigned \(1\)/i })
    ).toBeInTheDocument();
    expect(getLatestButton('SUP-5103')).toBeInTheDocument();
    expect(
      screen.queryByText(/No assigned tickets match Urgent assigned/i)
    ).not.toBeInTheDocument();
  });

  it('paginates admin live chat queues beyond the configured limit', async () => {
    const user = setupSupportUser();
    const sessions = [
      createQueueTestLiveChat({
        id: 'chat-1000',
        queuePosition: 1,
      }),
      createQueueTestLiveChat({
        id: 'chat-1001',
        queuePosition: 2,
      }),
      createQueueTestLiveChat({
        id: 'chat-1002',
        queuePosition: 3,
      }),
      createQueueTestLiveChat({
        id: 'chat-1003',
        queuePosition: 4,
      }),
      createQueueTestLiveChat({
        id: 'chat-1004',
        queuePosition: 5,
      }),
    ];
    const flow = createSupportAdminFlow({
      callbacks: {
        listLiveChatQueue: () => sessions,
        getLiveChat: sessionId => {
          return sessions.find(session => session.id === sessionId) ?? null;
        },
      },
      agent: {
        id: 'live-chat-pagination-agent',
        name: 'Priya Admin',
      },
      behavior: {
        liveChatQueueLimit: 2,
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(
      screen.getByRole('button', { name: 'View live chat queue' })
    );

    expect(
      await screen.findByText(/Showing live chats 1-2 of 5/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'chat-1000' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'chat-1001' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'chat-1002' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous live chats' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next live chats' }));

    expect(
      await screen.findByText(/Showing live chats 3-4 of 5/i)
    ).toBeInTheDocument();
    expect(getLatestButton('chat-1002')).toBeInTheDocument();
    expect(getLatestButton('chat-1003')).toBeInTheDocument();
    expect(getLatestButton('Previous live chats')).toBeInTheDocument();

    await user.click(getLatestButton('Next live chats'));

    expect(
      await screen.findByText(/Showing live chats 5-5 of 5/i)
    ).toBeInTheDocument();
    expect(getLatestButton('chat-1004')).toBeInTheDocument();

    await user.click(getLatestButton('Previous live chats'));

    expect(getLatestButton('chat-1002')).toBeInTheDocument();
    expect(getLatestButton('chat-1003')).toBeInTheDocument();
  });

  it('filters admin live chat queues with custom backend filters', async () => {
    const user = setupSupportUser();
    const sessions = [
      createQueueTestLiveChat({
        id: 'chat-2000',
        queuePosition: 1,
      }),
      createQueueTestLiveChat({
        id: 'chat-2001',
        queuePosition: 0,
        status: 'active',
      }),
      createQueueTestLiveChat({
        id: 'chat-2002',
        queuePosition: 2,
      }),
    ];
    const flow = createSupportAdminFlow({
      callbacks: {
        listLiveChatQueue: filter => {
          return filter?.statuses
            ? sessions.filter(session =>
                filter.statuses?.includes(session.status)
              )
            : sessions;
        },
        getLiveChat: sessionId => {
          return sessions.find(session => session.id === sessionId) ?? null;
        },
      },
      agent: {
        id: 'live-chat-filter-agent',
        name: 'Priya Admin',
      },
      filterOptions: {
        liveChatQueue: [
          {
            id: 'all',
            label: 'All chats',
          },
          {
            id: 'queued',
            label: 'Queued chats',
            filter: {
              statuses: ['queued'],
            },
          },
        ],
      },
      formatters: {
        liveChatQueue: ({
          activeFilterLabel,
          totalSessions,
          visibleSessions,
        }) => {
          return `## ${activeFilterLabel ?? 'Live chats'} (${totalSessions})\n\n${visibleSessions?.map(session => session.id).join(', ')}`;
        },
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(
      screen.getByRole('button', { name: 'View live chat queue' })
    );
    expect(
      await screen.findByRole('heading', { name: /All chats \(3\)/i })
    ).toBeInTheDocument();
    const initialAllChatsCount = getHeadingCount(/All chats \(3\)/i);

    await abortFilter(user, 'All chats');

    await expectHeadingCountToIncrease(
      /All chats \(3\)/i,
      initialAllChatsCount
    );
    expect(getLatestButton('Filter: All chats')).toBeInTheDocument();

    await chooseFilter(user, 'All chats', 'queued');

    expect(
      await screen.findByRole('heading', { name: /Queued chats \(2\)/i })
    ).toBeInTheDocument();
    expect(getLatestButton('chat-2000')).toBeInTheDocument();
    expect(getLatestButton('chat-2002')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'chat-2001' })
    ).not.toBeInTheDocument();
  });

  it('omits live-chat admin guidance when live chat is not configured', () => {
    const flow = createSupportAdminFlow({
      callbacks: {
        listTicketQueue: () => [],
        getTicket: () => null,
      },
      agent: {
        id: 'ticket-only-agent',
        name: 'Priya Admin',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    expect(
      screen.getByRole('heading', {
        name: /Support operations is ready/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View ticket queue' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Review a ticket' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'View live chat queue' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/live chat queue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/active live chats/i)).not.toBeInTheDocument();
  });

  it('passes admin capabilities and labels to opening formatters', () => {
    const flow = createSupportAdminFlow({
      callbacks: {
        listLiveChatQueue: () => [],
        getLiveChat: () => null,
      },
      agent: {
        id: 'handoff-agent',
        name: 'Priya Admin',
      },
      labels: {
        viewLiveChatQueue: 'Review handoffs',
      },
      formatters: {
        openingMessage: ({ labels, capabilities }) => {
          return capabilities.canOpenLiveChatQueue
            ? `## ${labels.viewLiveChatQueue} available`
            : '## No handoffs configured';
        },
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    expect(
      screen.getByRole('heading', { name: /Review handoffs available/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Review handoffs' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'View ticket queue' })
    ).not.toBeInTheDocument();
  });

  it('handles admin tickets and live chat through async adapter methods', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const asyncAdapter = createAsyncSupportFlowAdapter(adapter);
    const ticket = await asyncAdapter.createTicket({
      customer: {
        id: 'async-admin-customer',
        name: 'Async Customer',
      },
      summary: 'Async admin callbacks need a queued ticket.',
    });
    const session = await asyncAdapter.startLiveChat({
      summary: 'Async admin callbacks need a live chat.',
      requestedBy: 'customer',
      customer: {
        id: 'async-admin-customer',
        name: 'Async Customer',
      },
    });
    const flow = createSupportAdminFlow({
      adapter: asyncAdapter,
      agent: {
        id: 'async-admin-agent',
        name: 'Priya Admin',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));
    expect(
      await screen.findByRole('heading', { name: /Ticket queue/i })
    ).toBeInTheDocument();
    await user.click(getLatestButton(ticket.reference));
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(`Ticket ${ticket.reference}`, 'i'),
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Assign to me' }));
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(`${ticket.reference} is now assigned to Priya Admin`),
      })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Back to admin options' })
    );
    await user.click(screen.getByRole('button', { name: 'My assigned work' }));
    expect(
      (await screen.findAllByText(/SUP-1000 \(normal\):/i)).length
    ).toBeGreaterThan(0);
    await user.click(getLatestButton(ticket.reference));

    await user.click(screen.getByRole('button', { name: 'Set priority' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Chat input' }),
      'high'
    );
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(`${ticket.reference} is now high priority`, 'i'),
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reply to customer' }));
    await user.type(
      screen.getByPlaceholderText(
        'We reproduced the issue and are working on a fix.'
      ),
      'The async backend accepted the admin reply.'
    );
    await user.keyboard('{Enter}');
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(`Sent your reply on ${ticket.reference}`, 'i'),
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resolve ticket' }));
    await user.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(`${ticket.reference} has been resolved`, 'i'),
      })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Back to admin options' })
    );
    await user.click(
      screen.getByRole('button', { name: 'View live chat queue' })
    );
    expect(
      await screen.findByRole('heading', { name: /Live chat queue/i })
    ).toBeInTheDocument();
    await user.click(getLatestButton(session.id));
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(`Live chat ${session.id}`, 'i'),
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Join live chat' }));
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(`Joined live chat ${session.id}`, 'i'),
      })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Leave live chat' }));
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(`Left live chat ${session.id}`, 'i'),
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Join live chat' }));
    expect(
      (
        await screen.findAllByRole('heading', {
          name: new RegExp(`Joined live chat ${session.id}`, 'i'),
        })
      ).length
    ).toBeGreaterThan(0);
    await user.type(
      screen.getByPlaceholderText('Type a live chat reply...'),
      'The async backend accepted the admin chat reply.'
    );
    await user.keyboard('{Enter}');
    expect(
      (
        await screen.findAllByText(
          /The async backend accepted the admin chat reply\./i
        )
      ).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'End live chat' }));
    expect(
      await screen.findByRole('heading', {
        name: new RegExp(`Ended live chat ${session.id}`, 'i'),
      })
    ).toBeInTheDocument();
  }, 30_000);

  it('allows admin flows to customize labels, rendering, behavior, and button slots', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const ticket = await adapter.createTicket({
      customer: {
        id: 'admin-custom-customer',
        name: 'Sam Case',
      },
      summary: 'A custom admin workflow needs a queued ticket.',
    });
    const flow = createSupportAdminFlow({
      adapter,
      agent: {
        id: 'custom-agent',
        name: 'Priya Admin',
      },
      labels: {
        viewTicketQueue: 'Open cases',
      },
      behavior: {
        queueLimit: 1,
        priorityOrder: ['normal', 'urgent'],
      },
      formatters: {
        ticketQueue: ({ tickets, queueLimit }) => {
          return `## Custom queue (${queueLimit})\n\n${tickets[0]?.reference ?? 'none'}`;
        },
      },
      customizeButtons: ({ slot, defaultButtons }) => {
        if (slot !== 'ticket-queue') {
          return defaultButtons;
        }

        return [
          ...defaultButtons,
          {
            label: 'Custom triage',
            onClick: () => {},
          },
        ];
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'Open cases' }));
    expect(
      await screen.findByRole('heading', { name: /Custom queue \(1\)/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Custom triage' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: ticket.reference }));
    expect(
      await screen.findByRole('button', { name: 'Set priority' })
    ).toBeInTheDocument();
  });

  it('lets an admin unassign themselves from a ticket', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const ticket = await adapter.createTicket({
      customer: {
        id: 'unassign-customer',
        name: 'Sky Parker',
      },
      summary: 'A ticket is already assigned to the current admin.',
    });
    await adapter.updateTicket({
      reference: ticket.reference,
      status: 'open',
      assignedTo: 'Priya Admin',
    });
    const flow = createSupportAdminFlow({
      adapter,
      agent: {
        id: 'unassign-agent',
        name: 'Priya Admin',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));
    await user.click(screen.getByRole('button', { name: ticket.reference }));
    expect(
      await screen.findByRole('button', { name: 'Unassign from me' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Unassign from me' }));
    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is now unassigned/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Assign to me' })
    ).toBeInTheDocument();

    const updatedTicket = await adapter.getTicketByReference(ticket.reference);
    expect(updatedTicket?.assignedTo).toBeUndefined();
  });

  it('lets an admin set ticket priority from a dropdown', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const ticket = await adapter.createTicket({
      customer: {
        id: 'priority-customer',
        name: 'Drew Lane',
      },
      priority: 'urgent',
      summary: 'A ticket starts at urgent priority.',
    });
    const flow = createSupportAdminFlow({
      adapter,
      agent: {
        id: 'priority-agent',
        name: 'Priya Admin',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));
    await user.click(screen.getByRole('button', { name: ticket.reference }));
    expect(
      screen.queryByRole('button', { name: 'Priority already urgent' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Increase to/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Decrease to/i })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Set priority' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Chat input' }),
      'low'
    );
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is now low priority/i,
      })
    ).toBeInTheDocument();

    const updatedTicket = await adapter.getTicketByReference(ticket.reference);
    expect(updatedTicket?.priority).toBe('low');
  });

  it('redirects customers to an existing open live chat instead of starting another', async () => {
    const user = setupSupportUser();
    const customer = {
      id: 'customer-active-chat',
      name: 'Casey Lee',
      email: 'casey@example.com',
    };
    const adapter = createInMemorySupportFlowAdapter({
      liveChats: [
        {
          id: 'chat-0042',
          summary: 'Need help with a live production incident.',
          requestedBy: 'customer',
          queuePosition: 0,
          estimatedWaitMinutes: 0,
          status: 'active',
          createdAt: new Date('2026-04-30T12:00:00Z'),
          updatedAt: new Date('2026-04-30T12:00:00Z'),
          customer,
          agent: {
            id: 'agent-active-chat',
            name: 'Morgan Admin',
            email: 'morgan@example.com',
          },
          messages: [
            {
              id: 'live-chat-message-0042-1',
              author: 'customer',
              authorLabel: 'Casey Lee',
              body: 'Need help with a live production incident.',
              createdAt: new Date('2026-04-30T12:00:00Z'),
            },
          ],
        },
      ],
    });
    const flow = createSupportUserFlow({
      adapter,
      customer,
    });

    const firstRender = render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'Start live chat' }));

    expect(
      await screen.findByRole('heading', { name: /^Live chat$/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/chat-0042/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Need help with a live production incident\./i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Handoff summary/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chat transcript/i)).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(
        'We are blocked from deploying to production...'
      )
    ).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Type a live chat message...')
    ).toBeInTheDocument();

    const duplicateSession = await adapter.startLiveChat({
      summary: 'Trying to start another handoff.',
      requestedBy: 'customer',
      customer,
    });
    const openSessions = await adapter.listCustomerLiveChats(customer);

    expect(duplicateSession.id).toBe('chat-0042');
    expect(
      openSessions.filter(session => session.status !== 'ended')
    ).toHaveLength(1);

    firstRender.unmount();
    resetChatStores();
    render(<Chat initialMessages={[]} />);
    flow.start();

    expect(
      await screen.findByRole('heading', { name: /^Live chat$/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/chat-0042/i)).not.toBeInTheDocument();
  });

  it('lets an admin triage tickets created through the shared adapter', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const customer = {
      id: 'customer-2',
      name: 'Jamie Rivera',
      email: 'jamie@example.com',
    };
    const userFlow = createSupportUserFlow({
      adapter,
      customer,
    });
    const firstRender = render(
      <Chat initialMessages={userFlow.initialMessages} />
    );

    await user.click(screen.getByRole('button', { name: 'Start ticket' }));
    await user.type(
      screen.getByPlaceholderText(
        'Our team cannot invite new users after enabling SSO.'
      ),
      'Billing renewal charged the wrong workspace and I need a refund review.'
    );
    await user.keyboard('{Enter}');
    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is open for Jamie Rivera/i,
      })
    ).toBeInTheDocument();

    firstRender.unmount();
    resetChatStores();

    const adminFlow = createSupportAdminFlow({
      adapter,
      agent: {
        id: 'agent-1',
        name: 'Morgan Admin',
        email: 'morgan@example.com',
      },
    });

    render(<Chat initialMessages={adminFlow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));
    expect(
      (await screen.findAllByRole('heading', { name: /Ticket queue/i })).length
    ).toBeGreaterThan(0);
    expect(screen.getByText(/SUP-1000 \(normal\):/i)).toBeInTheDocument();
    expect(getLatestButton('SUP-1000')).toHaveStyle({
      backgroundColor: '#10b981',
    });
    expect(
      screen.getByRole('button', { name: 'Back to admin options' })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Back to admin options' })
    );
    expect(
      await screen.findByRole('button', { name: 'View ticket queue' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View live chat queue' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));
    expect(
      (await screen.findAllByRole('heading', { name: /Ticket queue/i })).length
    ).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'SUP-1000' }));

    expect(
      await screen.findByRole('heading', { name: /Ticket SUP-1000/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Back to admin options' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Customer:/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Billing renewal charged the wrong workspace and I need a refund review\./i
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: 'Offer live chat' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Back to ticket queue' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'View live chat queue' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Assign to agent' }));
    await user.type(
      screen.getByPlaceholderText('Avery Specialist or avery@example.com'),
      'Avery Specialist'
    );
    await user.keyboard('{Enter}');
    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is now assigned to Avery Specialist/i,
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Set priority' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Chat input' }),
      'high'
    );
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 is now high priority/i,
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reply to customer' }));
    await user.type(
      screen.getByPlaceholderText(
        'We reproduced the issue and are working on a fix.'
      ),
      'We reviewed the billing event and are issuing the refund now.'
    );
    await user.keyboard('{Enter}');
    expect(
      await screen.findByRole('heading', {
        name: /Sent your reply on SUP-1000/i,
      })
    ).toBeInTheDocument();
    expect(await screen.findByText(/Reply sent/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /We reviewed the billing event and are issuing the refund now\./i
      ).length
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('button', { name: 'View full activity' })
    );
    expect(
      await screen.findByRole('heading', {
        name: /Full activity for SUP-1000/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Billing renewal charged the wrong workspace and I need a refund review\./i
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        /We reviewed the billing event and are issuing the refund now\./i
      ).length
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('button', { name: 'Back to admin options' })
    );
    await user.click(screen.getByRole('button', { name: 'View ticket queue' }));
    const ticketButtons = screen.getAllByRole('button', {
      name: 'SUP-1000',
    });
    await user.click(ticketButtons[ticketButtons.length - 1]!);
    expect(
      (await screen.findAllByRole('heading', { name: /Ticket SUP-1000/i }))
        .length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Resolve ticket' }));
    await user.click(screen.getByRole('button', { name: 'Resolve' }));
    expect(
      await screen.findByRole('heading', {
        name: /SUP-1000 has been resolved/i,
      })
    ).toBeInTheDocument();

    await waitFor(async () => {
      const ticket = await adapter.getTicketByReference('SUP-1000');
      expect(ticket?.status).toBe('resolved');
      expect(ticket?.assignedTo).toBe('Avery Specialist');
      expect(ticket?.liveChatOffered).toBe(false);
      expect(
        ticket?.messages.some(message => {
          return message.author === 'agent';
        })
      ).toBe(true);
    });
  }, 20_000);

  it('lets an admin triage live chats created through the shared adapter', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const customer = {
      id: 'customer-2',
      name: 'Jamie Rivera',
      email: 'jamie@example.com',
    };

    await adapter.startLiveChat({
      summary: 'Billing renewal needs a live chat with support.',
      requestedBy: 'customer',
      customer,
    });

    const adminFlow = createSupportAdminFlow({
      adapter,
      agent: {
        id: 'agent-1',
        name: 'Morgan Admin',
        email: 'morgan@example.com',
      },
      liveChatPersistentButtons: () => [
        {
          label: 'Escalate chat',
          onClick: () => {},
        },
      ],
    });

    render(<Chat initialMessages={adminFlow.initialMessages} />);

    await user.click(
      screen.getByRole('button', { name: 'View live chat queue' })
    );
    expect(
      (await screen.findAllByRole('heading', { name: /Live chat queue/i }))
        .length
    ).toBeGreaterThan(0);
    expect(getLatestButton('chat-0001')).toHaveStyle({
      backgroundColor: '#10b981',
    });
    await user.click(getLatestButton('chat-0001'));
    expect(
      await screen.findByRole('heading', {
        name: /Live chat chat-0001/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Back to admin options' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Linked ticket:/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Join live chat' }));
    expect(
      await screen.findByRole('heading', {
        name: /Joined live chat chat-0001/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Leave live chat' })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Send chat message' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Chat persistent actions' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Escalate chat' })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Back to admin options' })
    );
    await user.click(
      screen.getByRole('button', { name: 'View live chat queue' })
    );
    expect(getLatestButton('chat-0001')).toHaveStyle({
      backgroundColor: '#ef4444',
    });
    await user.click(getLatestButton('chat-0001'));

    await user.click(screen.getByRole('button', { name: 'Leave live chat' }));
    expect(
      await screen.findByRole('heading', {
        name: /Left live chat chat-0001/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Escalate chat' })
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Back to admin options' })
    );
    await user.click(
      screen.getByRole('button', { name: 'View live chat queue' })
    );
    expect(getLatestButton('chat-0001')).toHaveStyle({
      backgroundColor: '#10b981',
    });
    await user.click(getLatestButton('chat-0001'));
    await user.click(screen.getByRole('button', { name: 'Join live chat' }));
    expect(
      (
        await screen.findAllByRole('heading', {
          name: /Joined live chat chat-0001/i,
        })
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', {
        name: 'Leave live chat',
      })
    ).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText('Type a live chat reply...'),
      'I am reviewing the billing event with you now.'
    );
    await user.keyboard('{Enter}');
    expect(
      (
        await screen.findAllByText(
          /I am reviewing the billing event with you now\./i
        )
      ).length
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'End live chat' }));
    expect(
      await screen.findByRole('heading', {
        name: /Ended live chat chat-0001/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Escalate chat' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refresh chat' }));
    expect(
      (
        await screen.findAllByRole('heading', {
          name: /Live chat chat-0001/i,
        })
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Status:/i).length).toBeGreaterThan(0);

    await waitFor(async () => {
      const liveChat = await adapter.getLiveChatById('chat-0001');
      expect(liveChat?.status).toBe('ended');
      expect(
        liveChat?.messages?.some(message => {
          return (
            message.author === 'agent' &&
            message.body === 'I am reviewing the billing event with you now.'
          );
        })
      ).toBe(true);
    });
  }, 20_000);

  it('restores admin guidance after an input flow is aborted', async () => {
    const user = setupSupportUser();
    const adapter = createInMemorySupportFlowAdapter();
    const flow = createSupportAdminFlow({
      adapter,
      agent: {
        id: 'agent-2',
        name: 'Morgan Admin',
        email: 'morgan@example.com',
      },
    });

    render(<Chat initialMessages={flow.initialMessages} />);

    await user.click(screen.getByRole('button', { name: 'Review a ticket' }));
    await clickLatestButtonWhenEnabled(user, 'Abort');

    expect(
      await screen.findByText(/Ticket review cancelled\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View ticket queue' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View live chat queue' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'My assigned work' })
    ).toBeInTheDocument();
  });
});
