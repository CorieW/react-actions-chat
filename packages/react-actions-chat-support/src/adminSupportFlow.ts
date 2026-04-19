import {
  createButton,
  createMarkdownTextPart,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
  type InputMessage,
  type MessageButton,
  useChatStore,
} from 'react-actions-chat';
import type {
  SupportAgentIdentity,
  SupportFlowAdapter,
  SupportFlowBase,
  SupportTicket,
} from './supportFlowTypes';

export interface SupportAdminFlowConfig {
  readonly adapter: SupportFlowAdapter;
  readonly agent: SupportAgentIdentity;
  readonly brandName?: string | undefined;
  readonly initialMessage?: string | undefined;
}

export type SupportAdminFlow = SupportFlowBase;

const PRIORITY_ORDER = ['low', 'normal', 'high', 'urgent'] as const;

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
  limit = 4
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

function normalizeReference(reference: string): string {
  return reference.trim().toUpperCase();
}

function deriveAgentLabel(agent: SupportAgentIdentity): string {
  return agent.name ?? agent.email ?? 'Current agent';
}

function getNextPriority(
  currentPriority: SupportTicket['priority']
): SupportTicket['priority'] {
  const currentIndex = PRIORITY_ORDER.indexOf(currentPriority);
  if (currentIndex < 0) {
    return 'normal';
  }

  return (
    PRIORITY_ORDER[Math.min(currentIndex + 1, PRIORITY_ORDER.length - 1)] ??
    'urgent'
  );
}

function formatQueueSummary(tickets: readonly SupportTicket[]): string {
  return joinMarkdownLines([
    '## Open queue',
    '',
    ...tickets.slice(0, 5).map(ticket => {
      const assignedText = ticket.assignedTo
        ? `assigned to ${escapeMarkdown(ticket.assignedTo)}`
        : 'unassigned';
      return `- **${escapeMarkdown(ticket.reference)}:** ${escapeMarkdown(ticket.subject)} (${escapeMarkdown(formatStatusLabel(ticket.status))}, ${escapeMarkdown(ticket.priority)}, ${assignedText})`;
    }),
  ]);
}

function formatTicketDetails(ticket: SupportTicket): string {
  const latestMessage = ticket.messages[ticket.messages.length - 1];
  return joinMarkdownLines([
    `## Ticket ${escapeMarkdown(ticket.reference)}`,
    '',
    `- **Status:** ${escapeMarkdown(formatStatusLabel(ticket.status))}`,
    `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
    `- **Customer:** ${escapeMarkdown(ticket.customer.name ?? ticket.customer.email ?? 'Unknown customer')}`,
    `- **Subject:** ${escapeMarkdown(ticket.subject)}`,
    ticket.assignedTo
      ? `- **Assigned to:** ${escapeMarkdown(ticket.assignedTo)}`
      : '- **Assigned to:** No agent assigned yet',
    ticket.liveChatOffered
      ? '- **Live chat:** Already offered for this issue'
      : '- **Live chat:** Not offered yet',
    `- **Updated:** ${escapeMarkdown(formatTimestamp(ticket.updatedAt))}`,
    latestMessage
      ? `- **Latest message:** ${escapeMarkdown(latestMessage.authorLabel ?? latestMessage.author)} said "${escapeMarkdown(latestMessage.body)}"`
      : undefined,
    '',
    formatRecentActivity(ticket),
  ]);
}

export function createSupportAdminFlow(
  config: SupportAdminFlowConfig
): SupportAdminFlow {
  const { adapter, agent, brandName = 'Support operations' } = config;
  const agentLabel = deriveAgentLabel(agent);
  const defaultOpeningMessage = joinMarkdownLines([
    `## ${escapeMarkdown(brandName)} is ready`,
    '',
    'You can work the queue from here:',
    '',
    '- Review the shared support backlog',
    '- Assign ownership to yourself',
    '- Reply to customers and offer live chat',
    '- Resolve or reopen tickets in place',
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
        `Ticket ${normalizeReference(reference)} was not found in the support queue.`,
        createPrimaryButtons()
      );
      return;
    }

    addSupportMessage(formatTicketDetails(ticket), createTicketButtons(ticket));
  };

  const showFullActivity = async (reference: string): Promise<void> => {
    const ticket = await adapter.getTicketByReference(
      normalizeReference(reference)
    );

    if (!ticket) {
      addSupportMessage(
        `Ticket ${normalizeReference(reference)} was not found in the support queue.`,
        createPrimaryButtons()
      );
      return;
    }

    addSupportMessage(formatFullActivity(ticket), createTicketButtons(ticket));
  };

  const showQueue = async (): Promise<void> => {
    const tickets = await adapter.listQueue();

    if (!tickets.length) {
      addSupportMessage(
        'The open queue is empty right now.',
        createPrimaryButtons()
      );
      return;
    }

    addSupportMessage(formatQueueSummary(tickets), [
      ...tickets.slice(0, 5).map(ticket => {
        return createButton({
          label: ticket.reference,
          onClick: () => {
            void showTicket(ticket.reference);
          },
        });
      }),
      createButton({
        label: 'Refresh queue',
        onClick: () => {
          void showQueue();
        },
      }),
    ]);
  };

  const createAssignButton = (ticket: SupportTicket): MessageButton => {
    return createButton({
      label:
        ticket.assignedTo === agentLabel ? 'Assigned to me' : 'Assign to me',
      onClick: () => {
        void (async () => {
          const updatedTicket = await adapter.updateTicket({
            reference: ticket.reference,
            assignedTo: agentLabel,
            status: ticket.status === 'new' ? 'open' : ticket.status,
          });

          addSupportMessage(
            joinMarkdownLines([
              `## ${escapeMarkdown(updatedTicket.reference)} is now assigned to ${escapeMarkdown(agentLabel)}`,
              '',
              `- **Status:** ${escapeMarkdown(formatStatusLabel(updatedTicket.status))}`,
              `- **Priority:** ${escapeMarkdown(updatedTicket.priority)}`,
            ]),
            createTicketButtons(updatedTicket)
          );
        })();
      },
    });
  };

  const createRaisePriorityButton = (ticket: SupportTicket): MessageButton => {
    const nextPriority = getNextPriority(ticket.priority);

    return createButton({
      label:
        nextPriority === ticket.priority
          ? 'Priority already urgent'
          : `Raise to ${nextPriority}`,
      onClick: () => {
        void (async () => {
          const updatedTicket = await adapter.updateTicket({
            reference: ticket.reference,
            priority: nextPriority,
          });

          addSupportMessage(
            joinMarkdownLines([
              `## ${escapeMarkdown(updatedTicket.reference)} is now ${escapeMarkdown(updatedTicket.priority)} priority`,
              '',
              `- **Assigned to:** ${escapeMarkdown(updatedTicket.assignedTo ?? 'No agent assigned yet')}`,
              `- **Status:** ${escapeMarkdown(formatStatusLabel(updatedTicket.status))}`,
            ]),
            createTicketButtons(updatedTicket)
          );
        })();
      },
    });
  };

  const createReplyButton = (ticket: SupportTicket): MessageButton => {
    return createButton(
      createRequestInputButtonDef({
        initialLabel: 'Reply to customer',
        inputPromptMessage: `Send an update to the customer on ${ticket.reference}.`,
        placeholder: 'We reproduced the issue and are working on a fix.',
        inputDescription:
          'This adds a public-facing support response and moves the ticket to pending customer.',
        minMessageLength: 8,
        onSuccess: async body => {
          await adapter.appendTicketMessage({
            reference: ticket.reference,
            author: 'agent',
            authorLabel: agentLabel,
            body,
          });
          const updatedTicket = await adapter.updateTicket({
            reference: ticket.reference,
            status: 'pending-customer',
            assignedTo: agentLabel,
          });

          addSupportMessage(
            joinMarkdownLines([
              `## Sent your reply on ${escapeMarkdown(updatedTicket.reference)}`,
              '',
              `- **Assigned to:** ${escapeMarkdown(agentLabel)}`,
              '- **Next status:** pending customer',
              '',
              '### Reply sent',
              '',
              escapeMarkdown(body),
            ]),
            createTicketButtons(updatedTicket)
          );
        },
      }),
      {
        abortCallback: () => {
          addAbortRecoveryMessage(
            `Reply cancelled for ${ticket.reference}. You can update the customer later or keep triaging the ticket.`,
            createTicketButtons(ticket)
          );
        },
      }
    );
  };

  const createLiveChatOfferButton = (ticket: SupportTicket): MessageButton => {
    return createButton({
      label: 'Offer live chat',
      onClick: () => {
        void (async () => {
          const session = await adapter.startLiveChat({
            summary: `Live chat offered for ${ticket.subject}`,
            requestedBy: 'agent',
            ticketReference: ticket.reference,
            customer: ticket.customer,
            agent,
          });
          const updatedTicket = await adapter.updateTicket({
            reference: ticket.reference,
            liveChatOffered: true,
            assignedTo: agentLabel,
          });

          addSupportMessage(
            joinMarkdownLines([
              `## Queued ${escapeMarkdown(session.id)} for ${escapeMarkdown(updatedTicket.reference)}`,
              '',
              `- **Estimated wait:** ${session.estimatedWaitMinutes} minutes`,
              `- **Assigned to:** ${escapeMarkdown(agentLabel)}`,
              '',
              '### Live chat context',
              '',
              escapeMarkdown(session.summary),
            ]),
            createTicketButtons(updatedTicket)
          );
        })();
      },
    });
  };

  const createResolveButton = (ticket: SupportTicket): MessageButton => {
    const isResolved =
      ticket.status === 'resolved' || ticket.status === 'closed';

    if (isResolved) {
      return createButton({
        label: 'Re-open ticket',
        onClick: () => {
          void (async () => {
            const updatedTicket = await adapter.updateTicket({
              reference: ticket.reference,
              status: 'open',
              assignedTo: agentLabel,
            });

            addSupportMessage(
              joinMarkdownLines([
                `## ${escapeMarkdown(updatedTicket.reference)} is open again`,
                '',
                `- **Assigned to:** ${escapeMarkdown(agentLabel)}`,
                `- **Priority:** ${escapeMarkdown(updatedTicket.priority)}`,
              ]),
              createTicketButtons(updatedTicket)
            );
          })();
        },
      });
    }

    return createButton(
      createRequestConfirmationButtonDef({
        initialLabel: 'Resolve ticket',
        confirmationMessage: `Resolve ${ticket.reference} and mark the work complete?`,
        confirmLabel: 'Resolve',
        rejectLabel: 'Keep open',
        onSuccess: () => {
          void (async () => {
            const updatedTicket = await adapter.updateTicket({
              reference: ticket.reference,
              status: 'resolved',
              assignedTo: agentLabel,
            });

            addSupportMessage(
              joinMarkdownLines([
                `## ${escapeMarkdown(updatedTicket.reference)} has been resolved`,
                '',
                `- **Assigned to:** ${escapeMarkdown(agentLabel)}`,
                `- **Priority:** ${escapeMarkdown(updatedTicket.priority)}`,
              ]),
              createTicketButtons(updatedTicket)
            );
          })();
        },
      })
    );
  };

  const createTicketButtons = (
    ticket: SupportTicket
  ): readonly MessageButton[] => {
    return [
      createAssignButton(ticket),
      createRaisePriorityButton(ticket),
      createButton({
        label: 'View full activity',
        onClick: () => {
          void showFullActivity(ticket.reference);
        },
      }),
      createReplyButton(ticket),
      createLiveChatOfferButton(ticket),
      createResolveButton(ticket),
      createButton({
        label: 'Back to queue',
        onClick: () => {
          void showQueue();
        },
      }),
    ];
  };

  const createReviewTicketButton = (): MessageButton => {
    return createButton(
      createRequestInputButtonDef({
        initialLabel: 'Review a ticket',
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
            'Ticket review cancelled. You can inspect the queue, try another reference, or jump back into your assigned work.',
            createPrimaryButtons()
          );
        },
      }
    );
  };

  function createPrimaryButtons(): readonly MessageButton[] {
    return [
      createButton({
        label: 'View queue',
        onClick: () => {
          void showQueue();
        },
      }),
      createReviewTicketButton(),
      createButton({
        label: 'My assigned work',
        onClick: () => {
          void (async () => {
            const tickets = await adapter.listQueue({ assignedTo: agentLabel });

            if (!tickets.length) {
              addSupportMessage(
                joinMarkdownLines([
                  `## ${escapeMarkdown(agentLabel)} does not have any assigned tickets right now`,
                  '',
                  'View the full queue to pick up the next request.',
                ]),
                createPrimaryButtons()
              );
              return;
            }

            addSupportMessage(formatQueueSummary(tickets), [
              ...tickets.slice(0, 5).map(ticket => {
                return createButton({
                  label: ticket.reference,
                  onClick: () => {
                    void showTicket(ticket.reference);
                  },
                });
              }),
              createButton({
                label: 'View full queue',
                onClick: () => {
                  void showQueue();
                },
              }),
            ]);
          })();
        },
      }),
    ];
  }

  const openingMessage = config.initialMessage ?? defaultOpeningMessage;

  const initialMessages: readonly InputMessage[] = [
    {
      type: 'other',
      parts: [createMarkdownTextPart(openingMessage)],
      buttons: createPrimaryButtons(),
    },
  ];

  return {
    initialMessages,
    primaryButtons: createPrimaryButtons(),
    start: () => {
      addSupportMessage(openingMessage, createPrimaryButtons());
    },
  };
}
