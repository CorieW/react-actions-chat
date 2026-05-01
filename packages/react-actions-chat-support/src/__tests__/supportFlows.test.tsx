import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
  type SupportTicket,
} from 'react-actions-chat-support';

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

function getLatestButton(label: string): HTMLElement {
  const buttons = screen.getAllByRole('button', { name: label });
  return buttons[buttons.length - 1]!;
}

function createQueueTestTicket({
  reference,
  priority,
  updatedAt,
  assignedTo,
}: {
  readonly reference: string;
  readonly priority: SupportTicket['priority'];
  readonly updatedAt: string;
  readonly assignedTo?: string | undefined;
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
    status: 'open',
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

describe('support flows package', () => {
  beforeEach(() => {
    resetChatStores();
  });

  it('handles the customer support flow for tickets and live chat', async () => {
    const user = userEvent.setup();
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
      screen.queryByRole('button', { name: 'View tickets' })
    ).not.toBeInTheDocument();
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
  }, 15_000);

  it('restores customer guidance after an input flow is aborted', async () => {
    const user = userEvent.setup();
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
    await user.click(screen.getByRole('button', { name: 'Abort' }));

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

  it('allows library users to customize support input validation', async () => {
    const user = userEvent.setup();
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

  it('allows customer flows to customize prompts, rendering, and button slots', async () => {
    const user = userEvent.setup();
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

    expect(queue.map(ticket => ticket.reference)).toEqual([
      'SUP-1001',
      'SUP-1002',
      'SUP-1000',
      'SUP-1003',
    ]);
  });

  it('allows admin flows to customize labels, rendering, behavior, and button slots', async () => {
    const user = userEvent.setup();
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
    const user = userEvent.setup();
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
    const user = userEvent.setup();
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
    const user = userEvent.setup();
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
    const user = userEvent.setup();
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
  }, 12_000);

  it('lets an admin triage live chats created through the shared adapter', async () => {
    const user = userEvent.setup();
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
  }, 12_000);

  it('restores admin guidance after an input flow is aborted', async () => {
    const user = userEvent.setup();
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
    await user.click(screen.getByRole('button', { name: 'Abort' }));

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
