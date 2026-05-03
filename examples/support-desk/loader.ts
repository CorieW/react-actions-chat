import type {
  SupportAgentIdentity,
  SupportLiveChatSession,
  SupportTicket,
  SupportUserIdentity,
} from 'react-actions-chat-support';
import sampleData from './sampleData.json';

/**
 * JSON shape for a demo ticket before date strings are converted.
 */
interface SupportDeskTicketSeed {
  /**
   * Human-readable support ticket reference.
   */
  readonly reference: string;
  /**
   * Short ticket subject shown in ticket summaries.
   */
  readonly subject: string;
  /**
   * Initial ticket message body used by the fake database seed.
   */
  readonly summary: string;
  /**
   * Lifecycle status assigned to the sample ticket.
   */
  readonly status: SupportTicket['status'];
  /**
   * Priority assigned to the sample ticket.
   */
  readonly priority: SupportTicket['priority'];
  /**
   * ISO timestamp used as the ticket's latest activity time.
   */
  readonly updatedAt: string;
  /**
   * Agent display label assigned to the sample ticket.
   */
  readonly assignedTo?: string;
}

/**
 * JSON shape for a demo live chat before date strings are converted.
 */
interface SupportDeskLiveChatSeed {
  /**
   * Stable live-chat session identifier.
   */
  readonly id: string;
  /**
   * Short live-chat summary shown in the admin queue.
   */
  readonly summary: string;
  /**
   * Role that requested the live-chat session.
   */
  readonly requestedBy: SupportLiveChatSession['requestedBy'];
  /**
   * Position shown for the sample chat in the queue.
   */
  readonly queuePosition: number;
  /**
   * Estimated wait time shown for the sample chat.
   */
  readonly estimatedWaitMinutes: number;
  /**
   * Lifecycle status assigned to the sample chat.
   */
  readonly status: SupportLiveChatSession['status'];
  /**
   * ISO timestamp used as the chat creation time.
   */
  readonly createdAt: string;
  /**
   * ISO timestamp used as the chat's latest activity time.
   */
  readonly updatedAt: string;
  /**
   * Customer identity attached to the queued sample chat.
   */
  readonly customer: SupportUserIdentity;
}

/**
 * Full JSON shape for the support-desk sample data fixture.
 */
interface SupportDeskSampleDataSeed {
  /**
   * Customer identity used by the customer support flow.
   */
  readonly customerIdentity: SupportUserIdentity;
  /**
   * Agent identity used by the admin support flow.
   */
  readonly agentIdentity: SupportAgentIdentity;
  /**
   * Tickets loaded into the fake database.
   */
  readonly tickets: readonly SupportDeskTicketSeed[];
  /**
   * Live chats loaded into the fake database.
   */
  readonly liveChats: readonly SupportDeskLiveChatSeed[];
}

/**
 * Parsed support-desk sample data ready for the support adapter.
 */
export interface SupportDeskSampleData {
  /**
   * Customer identity used by the customer support flow.
   */
  readonly customerIdentity: SupportUserIdentity;
  /**
   * Agent identity used by the admin support flow.
   */
  readonly agentIdentity: SupportAgentIdentity;
  /**
   * Tickets loaded into the fake database.
   */
  readonly tickets: readonly SupportTicket[];
  /**
   * Live chats loaded into the fake database.
   */
  readonly liveChats: readonly SupportLiveChatSession[];
}

const SAMPLE_DATA = sampleData as SupportDeskSampleDataSeed;

/**
 * Clones a support user identity from JSON data.
 *
 * @param identity - JSON identity to pass into support flow records.
 */
function cloneUserIdentity(identity: SupportUserIdentity): SupportUserIdentity {
  return { ...identity };
}

/**
 * Converts one ticket fixture into a support ticket record.
 *
 * @param input - Ticket fixture loaded from JSON.
 * @param customer - Customer identity attached to sample tickets.
 */
function createDemoTicket(
  input: SupportDeskTicketSeed,
  customer: SupportUserIdentity
): SupportTicket {
  const updatedAt = new Date(input.updatedAt);

  return {
    reference: input.reference,
    subject: input.subject,
    summary: input.summary,
    customer: cloneUserIdentity(customer),
    status: input.status,
    priority: input.priority,
    liveChatOffered: false,
    createdAt: new Date(updatedAt.getTime() - 90 * 60 * 1000),
    updatedAt,
    messages: [
      {
        id: `${input.reference.toLowerCase()}-message-1`,
        author: 'customer',
        authorLabel: customer.name ?? customer.email,
        body: input.summary,
        createdAt: updatedAt,
      },
    ],
    ...(input.assignedTo ? { assignedTo: input.assignedTo } : {}),
  };
}

/**
 * Converts one live-chat fixture into a support live-chat record.
 *
 * @param input - Live-chat fixture loaded from JSON.
 */
function createDemoLiveChat(
  input: SupportDeskLiveChatSeed
): SupportLiveChatSession {
  const customer = cloneUserIdentity(input.customer);

  return {
    id: input.id,
    summary: input.summary,
    requestedBy: input.requestedBy,
    queuePosition: input.queuePosition,
    estimatedWaitMinutes: input.estimatedWaitMinutes,
    status: input.status,
    createdAt: new Date(input.createdAt),
    updatedAt: new Date(input.updatedAt),
    customer,
    messages: [
      {
        id: `${input.id}-message-1`,
        author: 'customer',
        authorLabel: customer.name ?? customer.email,
        body: input.summary,
        createdAt: new Date(input.createdAt),
      },
    ],
  };
}

/**
 * Loads the support-desk sample data from the JSON fixture.
 */
export function loadSupportDeskSampleData(): SupportDeskSampleData {
  return {
    customerIdentity: cloneUserIdentity(SAMPLE_DATA.customerIdentity),
    agentIdentity: { ...SAMPLE_DATA.agentIdentity },
    tickets: SAMPLE_DATA.tickets.map(ticket => {
      return createDemoTicket(ticket, SAMPLE_DATA.customerIdentity);
    }),
    liveChats: SAMPLE_DATA.liveChats.map(createDemoLiveChat),
  };
}
