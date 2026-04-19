import {
  createButton,
  createMarkdownTextPart,
  createRequestInputButtonDef,
  type InputMessage,
  type MessageButton,
  useChatStore,
} from 'react-actions-chat';
import type {
  SupportFlowAdapter,
  SupportFlowBase,
  SupportKnowledgeBaseArticle,
  SupportLiveChatSession,
  SupportTicket,
  SupportUserIdentity,
} from './supportFlowTypes';

export interface SupportUserFlowConfig {
  readonly adapter: SupportFlowAdapter;
  readonly customer: SupportUserIdentity;
  readonly brandName?: string | undefined;
  readonly initialMessage?: string | undefined;
}

export type SupportUserFlow = SupportFlowBase;

function formatTimestamp(timestamp: Date): string {
  return timestamp.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function escapeMarkdown(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/([`*_{}[\]()#+!|>])/g, '\\$1');
}

function formatStatusLabel(status: SupportTicket['status']): string {
  return status.replace('-', ' ');
}

function joinMarkdownLines(lines: ReadonlyArray<string | undefined>): string {
  return lines.filter((line): line is string => Boolean(line)).join('\n');
}

function formatMessageAuthor(
  ticket: SupportTicket,
  message: SupportTicket['messages'][number]
): string {
  if (message.author === 'customer') {
    return (
      message.authorLabel ??
      ticket.customer.name ??
      ticket.customer.email ??
      'Customer'
    );
  }

  if (message.author === 'agent') {
    return message.authorLabel ?? 'Support agent';
  }

  return message.authorLabel ?? 'System';
}

function formatRecentActivity(
  ticket: SupportTicket,
  limit = 3
): string | undefined {
  const recentMessages = ticket.messages.slice(-limit);

  if (!recentMessages.length) {
    return undefined;
  }

  return joinMarkdownLines([
    '### Recent activity',
    '',
    ...recentMessages.map(message => {
      return `- **${escapeMarkdown(formatMessageAuthor(ticket, message))}** (${escapeMarkdown(formatTimestamp(message.createdAt))}): ${escapeMarkdown(message.body)}`;
    }),
    ticket.messages.length > limit
      ? `_Showing the ${limit} most recent updates._`
      : undefined,
  ]);
}

function formatFullActivity(ticket: SupportTicket): string {
  return joinMarkdownLines([
    `## Full activity for ${escapeMarkdown(ticket.reference)}`,
    '',
    ...ticket.messages.map(message => {
      return `- **${escapeMarkdown(formatMessageAuthor(ticket, message))}** (${escapeMarkdown(formatTimestamp(message.createdAt))}): ${escapeMarkdown(message.body)}`;
    }),
  ]);
}

function formatTicketSummary(ticket: SupportTicket): string {
  const latestMessage = ticket.messages[ticket.messages.length - 1];
  return joinMarkdownLines([
    `## Ticket ${escapeMarkdown(ticket.reference)}`,
    '',
    `- **Status:** ${escapeMarkdown(formatStatusLabel(ticket.status))}`,
    `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
    `- **Subject:** ${escapeMarkdown(ticket.subject)}`,
    ticket.assignedTo
      ? `- **Assigned to:** ${escapeMarkdown(ticket.assignedTo)}`
      : '- **Assigned to:** No agent assigned yet',
    ticket.liveChatOffered
      ? '- **Live chat:** Available for this issue'
      : '- **Live chat:** Not offered on this ticket yet',
    `- **Last updated:** ${escapeMarkdown(formatTimestamp(ticket.updatedAt))}`,
    latestMessage
      ? `- **Latest update:** ${escapeMarkdown(latestMessage.body)}`
      : undefined,
    '',
    formatRecentActivity(ticket),
  ]);
}

function formatLiveChatSummary(session: SupportLiveChatSession): string {
  return joinMarkdownLines([
    `## Live chat request ${escapeMarkdown(session.id)} is queued`,
    '',
    `- **Estimated wait:** ${session.estimatedWaitMinutes} minutes`,
    `- **Queue position:** ${session.queuePosition}`,
    session.ticketReference
      ? `- **Linked ticket:** ${escapeMarkdown(session.ticketReference)}`
      : undefined,
    '',
    '### Handoff summary',
    '',
    escapeMarkdown(session.summary),
  ]);
}

function formatKnowledgeBaseResults(
  articles: readonly SupportKnowledgeBaseArticle[]
): string {
  return joinMarkdownLines([
    '## Best matching help-center articles',
    '',
    ...articles.slice(0, 3).map(article => {
      return `- **${escapeMarkdown(article.title)}:** ${escapeMarkdown(article.summary)}`;
    }),
  ]);
}

function deriveCustomerLabel(customer: SupportUserIdentity): string {
  return customer.name ?? customer.email ?? 'the customer';
}

function normalizeReference(reference: string): string {
  return reference.trim().toUpperCase();
}

export function createSupportUserFlow(
  config: SupportUserFlowConfig
): SupportUserFlow {
  const { adapter, customer, brandName = 'Support desk' } = config;

  const defaultOpeningMessage = joinMarkdownLines([
    `## ${escapeMarkdown(brandName)} is ready to help`,
    '',
    'Choose a next step:',
    '',
    '- Open a ticket for a tracked follow-up',
    '- Check the status of an existing ticket',
    '- Start live chat for an urgent handoff',
    '- Search the help center before you escalate',
  ]);

  const addSupportMessage = (
    markdown: string,
    buttons: readonly MessageButton[] = createPrimaryButtons()
  ): void => {
    useChatStore.getState().addMessage({
      type: 'other',
      parts: [createMarkdownTextPart(markdown)],
      buttons,
    });
  };

  const addAbortRecoveryMessage = (
    text: string,
    buttons: readonly MessageButton[] = createPrimaryButtons()
  ): void => {
    addSupportMessage(text, buttons);
  };

  const showTicket = async (reference: string): Promise<void> => {
    const ticket = await adapter.getTicketByReference(
      normalizeReference(reference)
    );

    if (!ticket) {
      addSupportMessage(
        `I could not find ticket ${normalizeReference(reference)} yet. Double-check the reference or open a new ticket.`,
        createPrimaryButtons()
      );
      return;
    }

    addSupportMessage(formatTicketSummary(ticket), createTicketButtons(ticket));
  };

  const showFullActivity = async (reference: string): Promise<void> => {
    const ticket = await adapter.getTicketByReference(
      normalizeReference(reference)
    );

    if (!ticket) {
      addSupportMessage(
        `I could not find ticket ${normalizeReference(reference)} yet. Double-check the reference or open a new ticket.`,
        createPrimaryButtons()
      );
      return;
    }

    addSupportMessage(formatFullActivity(ticket), createTicketButtons(ticket));
  };

  const createAddDetailButton = (ticket: SupportTicket): MessageButton => {
    return createButton(
      createRequestInputButtonDef({
        initialLabel: 'Add detail',
        inputPromptMessage: `Share the next detail you want added to ${ticket.reference}.`,
        placeholder: 'The error started after we rotated SSO certificates...',
        inputDescription:
          'Use this to add reproduction steps, screenshots, timing, or business impact.',
        minMessageLength: 10,
        minMessageLengthMessage:
          'Please add a little more detail so the support team can act on it.',
        onSuccess: async detail => {
          const updatedTicket = await adapter.appendTicketMessage({
            reference: ticket.reference,
            author: 'customer',
            authorLabel: deriveCustomerLabel(customer),
            body: detail,
          });

          addSupportMessage(
            joinMarkdownLines([
              `## Added your note to ${escapeMarkdown(updatedTicket.reference)}`,
              '',
              'The support team will see the new detail the next time they review the ticket.',
              '',
              '### New detail',
              '',
              escapeMarkdown(detail),
            ]),
            createTicketButtons(updatedTicket)
          );
        },
      }),
      {
        abortCallback: () => {
          addAbortRecoveryMessage(
            `No new detail was added to ${ticket.reference}. You can return to the ticket whenever you are ready.`,
            createTicketButtons(ticket)
          );
        },
      }
    );
  };

  const createLiveChatButton = (ticket?: SupportTicket): MessageButton => {
    return createButton(
      createRequestInputButtonDef({
        initialLabel: ticket ? 'Start live chat' : 'Live chat',
        inputPromptMessage: ticket
          ? `Summarize what you need from live chat for ${ticket.reference}.`
          : 'What do you need help with right now? I will queue a live chat handoff.',
        placeholder: 'We are blocked from deploying to production...',
        inputDescription:
          'Mention urgency, customer impact, and what you have already tried.',
        minMessageLength: 10,
        minMessageLengthMessage:
          'Please include a little more context so the handoff is useful.',
        onSuccess: async summary => {
          const session = await adapter.startLiveChat({
            summary,
            requestedBy: 'customer',
            customer,
            ...(ticket ? { ticketReference: ticket.reference } : {}),
          });

          addSupportMessage(
            formatLiveChatSummary(session),
            ticket ? createTicketButtons(ticket) : createPrimaryButtons()
          );
        },
      }),
      {
        abortCallback: () => {
          addAbortRecoveryMessage(
            ticket
              ? `Live chat request cancelled for ${ticket.reference}. You can keep working in the ticket or try again any time.`
              : 'Live chat request cancelled. You can open a ticket, search the help center, or try live chat again when you are ready.',
            ticket ? createTicketButtons(ticket) : createPrimaryButtons()
          );
        },
      }
    );
  };

  const createTicketButtons = (
    ticket: SupportTicket
  ): readonly MessageButton[] => {
    return [
      createButton({
        label: 'Refresh status',
        onClick: () => {
          void showTicket(ticket.reference);
        },
      }),
      createButton({
        label: 'View full activity',
        onClick: () => {
          void showFullActivity(ticket.reference);
        },
      }),
      createAddDetailButton(ticket),
      createLiveChatButton(ticket),
      createButton({
        label: 'View my tickets',
        onClick: () => {
          void showMyTickets();
        },
      }),
    ];
  };

  const showMyTickets = async (): Promise<void> => {
    const tickets = await adapter.listCustomerTickets(customer);

    if (!tickets.length) {
      addSupportMessage(
        'You do not have any tickets yet. Open one whenever you want a tracked follow-up.',
        createPrimaryButtons()
      );
      return;
    }

    const ticketLines = tickets
      .slice(0, 4)
      .map(ticket => {
        return `- **${escapeMarkdown(ticket.reference)}:** ${escapeMarkdown(ticket.subject)} (${escapeMarkdown(formatStatusLabel(ticket.status))}, ${escapeMarkdown(ticket.priority)})`;
      })
      .join('\n');

    addSupportMessage(
      joinMarkdownLines(['## Here are your latest tickets:', '', ticketLines]),
      [
        ...tickets.slice(0, 4).map(ticket => {
          return createButton({
            label: ticket.reference,
            onClick: () => {
              void showTicket(ticket.reference);
            },
          });
        }),
        createButton({
          label: 'Open a ticket',
          onClick: () => {
            createOpenTicketButton().onClick?.();
          },
        }),
      ]
    );
  };

  const showKnowledgeBaseResults = async (query: string): Promise<void> => {
    const articles = await adapter.searchKnowledgeBase(query);

    if (!articles.length) {
      addSupportMessage(
        `I did not find a direct help-center match for "${query}". You can still open a ticket or start live chat.`,
        createPrimaryButtons()
      );
      return;
    }

    addSupportMessage(formatKnowledgeBaseResults(articles), [
      ...articles.slice(0, 3).map(article => {
        return createButton({
          label: article.title,
          onClick: () => {
            addSupportMessage(
              joinMarkdownLines([
                `## ${escapeMarkdown(article.title)}`,
                '',
                article.body ?? article.summary,
              ]),
              createPrimaryButtons()
            );
          },
        });
      }),
      createButton({
        label: 'Open a ticket',
        onClick: () => {
          createOpenTicketButton().onClick?.();
        },
      }),
      createLiveChatButton(),
    ]);
  };

  const createOpenTicketButton = (): MessageButton => {
    return createButton(
      createRequestInputButtonDef({
        initialLabel: 'Open a ticket',
        inputPromptMessage:
          'Describe the issue and I will create a tracked support ticket.',
        placeholder: 'Our team cannot invite new users after enabling SSO.',
        inputDescription:
          'Include the symptom, impact, and any troubleshooting you have already tried.',
        minMessageLength: 12,
        minMessageLengthMessage:
          'Please share a little more detail so the ticket is actionable.',
        onSuccess: async summary => {
          const ticket = await adapter.createTicket({
            customer,
            summary,
          });

          addSupportMessage(
            joinMarkdownLines([
              `## ${escapeMarkdown(ticket.reference)} is open for ${escapeMarkdown(deriveCustomerLabel(customer))}`,
              '',
              `- **Subject:** ${escapeMarkdown(ticket.subject)}`,
              `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
              '',
              '### Request details',
              '',
              escapeMarkdown(ticket.summary),
              '',
              'Add more detail, review status, or start live chat from here.',
            ]),
            createTicketButtons(ticket)
          );
        },
      }),
      {
        abortCallback: () => {
          addAbortRecoveryMessage(
            'Ticket creation cancelled. You can open a new ticket whenever you are ready.',
            createPrimaryButtons()
          );
        },
      }
    );
  };

  const createCheckTicketButton = (): MessageButton => {
    return createButton(
      createRequestInputButtonDef({
        initialLabel: 'Check a ticket',
        inputPromptMessage:
          'Share the support ticket reference you want to review.',
        placeholder: 'SUP-1000',
        inputDescription:
          'Ticket references are usually formatted like SUP-1000.',
        validator: value => {
          return /^SUP-\d{4}$/i.test(value.trim())
            ? true
            : 'Use a ticket reference like SUP-1000.';
        },
        onSuccess: async reference => {
          await showTicket(reference);
        },
      }),
      {
        abortCallback: () => {
          addAbortRecoveryMessage(
            'Ticket lookup cancelled. You can try another reference or review your latest tickets instead.',
            createPrimaryButtons()
          );
        },
      }
    );
  };

  const createSearchHelpButton = (): MessageButton => {
    return createButton(
      createRequestInputButtonDef({
        initialLabel: 'Search help center',
        inputPromptMessage: 'What topic should I search for?',
        placeholder: 'billing invoice renewal',
        inputDescription:
          'Try a few keywords like billing, refund, live chat, or cancellation.',
        minMessageLength: 3,
        onSuccess: async query => {
          await showKnowledgeBaseResults(query);
        },
      }),
      {
        abortCallback: () => {
          addAbortRecoveryMessage(
            'Help-center search cancelled. You can search again, open a ticket, or start live chat whenever you need.',
            createPrimaryButtons()
          );
        },
      }
    );
  };

  function createPrimaryButtons(): readonly MessageButton[] {
    return [
      createOpenTicketButton(),
      createCheckTicketButton(),
      createButton({
        label: 'View my tickets',
        onClick: () => {
          void showMyTickets();
        },
      }),
      createLiveChatButton(),
      createSearchHelpButton(),
    ];
  }

  const initialMessages: readonly InputMessage[] = [
    {
      type: 'other',
      parts: [
        createMarkdownTextPart(config.initialMessage ?? defaultOpeningMessage),
      ],
      buttons: createPrimaryButtons(),
    },
  ];

  return {
    initialMessages,
    primaryButtons: createPrimaryButtons(),
    start: () => {
      addSupportMessage(
        config.initialMessage ?? defaultOpeningMessage,
        createPrimaryButtons()
      );
    },
  };
}
