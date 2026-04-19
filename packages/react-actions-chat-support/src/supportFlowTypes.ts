import type { InputMessage, MessageButton } from 'react-actions-chat';

export type SupportTicketStatus =
  | 'new'
  | 'open'
  | 'pending-customer'
  | 'pending-internal'
  | 'resolved'
  | 'closed';

export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SupportUserIdentity {
  readonly id?: string | undefined;
  readonly name?: string | undefined;
  readonly email?: string | undefined;
  readonly company?: string | undefined;
}

export interface SupportAgentIdentity {
  readonly id?: string | undefined;
  readonly name?: string | undefined;
  readonly email?: string | undefined;
  readonly team?: string | undefined;
}

export interface SupportTicketMessage {
  readonly id: string;
  readonly author: 'customer' | 'agent' | 'system';
  readonly authorLabel?: string | undefined;
  readonly body: string;
  readonly createdAt: Date;
}

export interface SupportTicket {
  readonly reference: string;
  readonly subject: string;
  readonly summary: string;
  readonly customer: SupportUserIdentity;
  readonly status: SupportTicketStatus;
  readonly priority: SupportTicketPriority;
  readonly assignedTo?: string | undefined;
  readonly liveChatOffered: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly messages: readonly SupportTicketMessage[];
  readonly tags?: readonly string[] | undefined;
}

export interface SupportKnowledgeBaseArticle {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly body?: string | undefined;
  readonly url?: string | undefined;
  readonly keywords?: readonly string[] | undefined;
}

export interface SupportLiveChatSession {
  readonly id: string;
  readonly summary: string;
  readonly ticketReference?: string | undefined;
  readonly requestedBy: 'customer' | 'agent';
  readonly queuePosition: number;
  readonly estimatedWaitMinutes: number;
  readonly status: 'queued' | 'active' | 'ended';
  readonly createdAt: Date;
  readonly customer?: SupportUserIdentity | undefined;
  readonly agent?: SupportAgentIdentity | undefined;
}

export interface CreateSupportTicketInput {
  readonly customer: SupportUserIdentity;
  readonly subject?: string | undefined;
  readonly summary: string;
  readonly priority?: SupportTicketPriority | undefined;
  readonly tags?: readonly string[] | undefined;
}

export interface UpdateSupportTicketInput {
  readonly reference: string;
  readonly status?: SupportTicketStatus | undefined;
  readonly priority?: SupportTicketPriority | undefined;
  readonly assignedTo?: string | null | undefined;
  readonly liveChatOffered?: boolean | undefined;
}

export interface AppendSupportTicketMessageInput {
  readonly reference: string;
  readonly author: SupportTicketMessage['author'];
  readonly authorLabel?: string | undefined;
  readonly body: string;
}

export interface StartSupportLiveChatInput {
  readonly summary: string;
  readonly requestedBy: 'customer' | 'agent';
  readonly ticketReference?: string | undefined;
  readonly customer?: SupportUserIdentity | undefined;
  readonly agent?: SupportAgentIdentity | undefined;
}

export interface SupportQueueFilter {
  readonly statuses?: readonly SupportTicketStatus[] | undefined;
  readonly assignedTo?: string | undefined;
}

export interface SupportFlowAdapter {
  readonly createTicket:
    | ((input: CreateSupportTicketInput) => Promise<SupportTicket>)
    | ((input: CreateSupportTicketInput) => SupportTicket);
  readonly getTicketByReference:
    | ((reference: string) => Promise<SupportTicket | null>)
    | ((reference: string) => SupportTicket | null);
  readonly listCustomerTickets:
    | ((customer: SupportUserIdentity) => Promise<readonly SupportTicket[]>)
    | ((customer: SupportUserIdentity) => readonly SupportTicket[]);
  readonly listQueue:
    | ((filter?: SupportQueueFilter) => Promise<readonly SupportTicket[]>)
    | ((filter?: SupportQueueFilter) => readonly SupportTicket[]);
  readonly updateTicket:
    | ((input: UpdateSupportTicketInput) => Promise<SupportTicket>)
    | ((input: UpdateSupportTicketInput) => SupportTicket);
  readonly appendTicketMessage:
    | ((input: AppendSupportTicketMessageInput) => Promise<SupportTicket>)
    | ((input: AppendSupportTicketMessageInput) => SupportTicket);
  readonly searchKnowledgeBase:
    | ((query: string) => Promise<readonly SupportKnowledgeBaseArticle[]>)
    | ((query: string) => readonly SupportKnowledgeBaseArticle[]);
  readonly startLiveChat:
    | ((input: StartSupportLiveChatInput) => Promise<SupportLiveChatSession>)
    | ((input: StartSupportLiveChatInput) => SupportLiveChatSession);
}

export interface SupportFlowBase {
  readonly initialMessages: readonly InputMessage[];
  readonly primaryButtons: readonly MessageButton[];
  readonly start: () => void;
}

export interface InMemorySupportFlowAdapterOptions {
  readonly tickets?: readonly SupportTicket[] | undefined;
  readonly knowledgeBaseArticles?:
    | readonly SupportKnowledgeBaseArticle[]
    | undefined;
  readonly liveChats?: readonly SupportLiveChatSession[] | undefined;
  readonly nextTicketNumber?: number | undefined;
}
