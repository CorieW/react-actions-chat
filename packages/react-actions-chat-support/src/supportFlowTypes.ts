import type {
  InputMessage,
  InputFileValidator,
  InputSelectOption,
  InputType,
  InputValidator,
  MessageButton,
  RequestInputRateLimit,
} from 'react-actions-chat';

export type MaybePromise<T> = T | Promise<T>;

export type SupportTextResolver<TContext> =
  | string
  | ((context: TContext) => string);

export type SupportTicketStatus =
  | 'new'
  | 'open'
  | 'pending-customer'
  | 'pending-internal'
  | 'resolved'
  | 'closed';

export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type SupportLiveChatStatus = 'queued' | 'active' | 'ended';

export type SupportLiveChatMessageAuthor = 'customer' | 'agent' | 'system';

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

export interface SupportLiveChatMessage {
  readonly id: string;
  readonly author: SupportLiveChatMessageAuthor;
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

export interface SupportLiveChatSession {
  readonly id: string;
  readonly summary: string;
  readonly ticketReference?: string | undefined;
  readonly requestedBy: 'customer' | 'agent';
  readonly queuePosition: number;
  readonly estimatedWaitMinutes: number;
  readonly status: SupportLiveChatStatus;
  readonly createdAt: Date;
  readonly updatedAt?: Date | undefined;
  readonly customer?: SupportUserIdentity | undefined;
  readonly agent?: SupportAgentIdentity | undefined;
  readonly messages?: readonly SupportLiveChatMessage[] | undefined;
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

export interface UpdateSupportLiveChatInput {
  readonly sessionId: string;
  readonly status?: SupportLiveChatStatus | undefined;
  readonly queuePosition?: number | undefined;
  readonly estimatedWaitMinutes?: number | undefined;
  readonly agent?: SupportAgentIdentity | null | undefined;
}

export interface AppendSupportLiveChatMessageInput {
  readonly sessionId: string;
  readonly author: SupportLiveChatMessageAuthor;
  readonly authorLabel?: string | undefined;
  readonly body: string;
}

export interface SupportQueueFilter {
  readonly statuses?: readonly SupportTicketStatus[] | undefined;
  readonly assignedTo?: string | undefined;
}

export interface SupportLiveChatQueueFilter {
  readonly statuses?: readonly SupportLiveChatStatus[] | undefined;
  readonly requestedBy?: 'customer' | 'agent' | undefined;
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
  readonly listLiveChatQueue:
    | ((
        filter?: SupportLiveChatQueueFilter
      ) => Promise<readonly SupportLiveChatSession[]>)
    | ((
        filter?: SupportLiveChatQueueFilter
      ) => readonly SupportLiveChatSession[]);
  readonly getLiveChatById:
    | ((sessionId: string) => Promise<SupportLiveChatSession | null>)
    | ((sessionId: string) => SupportLiveChatSession | null);
  readonly listCustomerLiveChats:
    | ((
        customer: SupportUserIdentity
      ) => Promise<readonly SupportLiveChatSession[]>)
    | ((customer: SupportUserIdentity) => readonly SupportLiveChatSession[]);
  readonly updateTicket:
    | ((input: UpdateSupportTicketInput) => Promise<SupportTicket>)
    | ((input: UpdateSupportTicketInput) => SupportTicket);
  readonly appendTicketMessage:
    | ((input: AppendSupportTicketMessageInput) => Promise<SupportTicket>)
    | ((input: AppendSupportTicketMessageInput) => SupportTicket);
  readonly startLiveChat:
    | ((input: StartSupportLiveChatInput) => Promise<SupportLiveChatSession>)
    | ((input: StartSupportLiveChatInput) => SupportLiveChatSession);
  readonly updateLiveChat:
    | ((input: UpdateSupportLiveChatInput) => Promise<SupportLiveChatSession>)
    | ((input: UpdateSupportLiveChatInput) => SupportLiveChatSession);
  readonly appendLiveChatMessage:
    | ((
        input: AppendSupportLiveChatMessageInput
      ) => Promise<SupportLiveChatSession>)
    | ((input: AppendSupportLiveChatMessageInput) => SupportLiveChatSession);
}

export interface SupportInputValidationSettings {
  readonly minMessageLength?: number | undefined;
  readonly minMessageLengthMessage?: string | undefined;
  readonly maxMessageLength?: number | undefined;
  readonly maxMessageLengthMessage?: string | undefined;
  readonly validator?: InputValidator | undefined;
}

export interface SupportUserFlowValidationConfig {
  readonly ticketSummary?: SupportInputValidationSettings | undefined;
  readonly ticketDetail?: SupportInputValidationSettings | undefined;
  readonly liveChatInitialMessage?: SupportInputValidationSettings | undefined;
  readonly liveChatMessage?: SupportInputValidationSettings | undefined;
}

export interface SupportAdminFlowValidationConfig {
  readonly ticketAssignment?: SupportInputValidationSettings | undefined;
  readonly ticketReply?: SupportInputValidationSettings | undefined;
  readonly liveChatMessage?: SupportInputValidationSettings | undefined;
}

export interface SupportUserFlowCallbacks {
  readonly createTicket?:
    | ((input: CreateSupportTicketInput) => MaybePromise<SupportTicket>)
    | undefined;
  readonly getTicket?:
    | ((reference: string) => MaybePromise<SupportTicket | null>)
    | undefined;
  readonly listTickets?:
    | ((
        customer: SupportUserIdentity
      ) => MaybePromise<readonly SupportTicket[]>)
    | undefined;
  readonly appendTicketMessage?:
    | ((input: AppendSupportTicketMessageInput) => MaybePromise<SupportTicket>)
    | undefined;
  readonly startLiveChat?:
    | ((
        input: StartSupportLiveChatInput
      ) => MaybePromise<SupportLiveChatSession>)
    | undefined;
  readonly getOpenLiveChat?:
    | ((
        customer: SupportUserIdentity
      ) => MaybePromise<SupportLiveChatSession | null>)
    | undefined;
  readonly getLiveChat?:
    | ((sessionId: string) => MaybePromise<SupportLiveChatSession | null>)
    | undefined;
  readonly updateLiveChat?:
    | ((
        input: UpdateSupportLiveChatInput
      ) => MaybePromise<SupportLiveChatSession>)
    | undefined;
  readonly appendLiveChatMessage?:
    | ((
        input: AppendSupportLiveChatMessageInput
      ) => MaybePromise<SupportLiveChatSession>)
    | undefined;
}

export interface SupportAdminFlowCallbacks {
  readonly listTicketQueue?:
    | ((filter?: SupportQueueFilter) => MaybePromise<readonly SupportTicket[]>)
    | undefined;
  readonly listLiveChatQueue?:
    | ((
        filter?: SupportLiveChatQueueFilter
      ) => MaybePromise<readonly SupportLiveChatSession[]>)
    | undefined;
  readonly getTicket?:
    | ((reference: string) => MaybePromise<SupportTicket | null>)
    | undefined;
  readonly updateTicket?:
    | ((input: UpdateSupportTicketInput) => MaybePromise<SupportTicket>)
    | undefined;
  readonly appendTicketMessage?:
    | ((input: AppendSupportTicketMessageInput) => MaybePromise<SupportTicket>)
    | undefined;
  readonly getLiveChat?:
    | ((sessionId: string) => MaybePromise<SupportLiveChatSession | null>)
    | undefined;
  readonly updateLiveChat?:
    | ((
        input: UpdateSupportLiveChatInput
      ) => MaybePromise<SupportLiveChatSession>)
    | undefined;
  readonly appendLiveChatMessage?:
    | ((
        input: AppendSupportLiveChatMessageInput
      ) => MaybePromise<SupportLiveChatSession>)
    | undefined;
}

export interface SupportFlowBase {
  readonly initialMessages: readonly InputMessage[];
  readonly primaryButtons: readonly MessageButton[];
  readonly start: () => void;
}

export interface SupportButtonCustomizationContext {
  readonly slot: string;
  readonly defaultButtons: readonly MessageButton[];
}

export type SupportButtonCustomizer<
  TContext extends SupportButtonCustomizationContext,
> = (context: TContext) => readonly MessageButton[];

export interface SupportRequestInputButtonOverrides<TContext> {
  readonly initialLabel?: SupportTextResolver<TContext> | undefined;
  readonly inputPromptMessage?: SupportTextResolver<TContext> | undefined;
  readonly placeholder?: SupportTextResolver<TContext> | undefined;
  readonly inputDescription?: SupportTextResolver<TContext> | undefined;
  readonly inputType?: InputType | undefined;
  readonly inputOptions?: readonly InputSelectOption[] | undefined;
  readonly allowFileUpload?: boolean | undefined;
  readonly fileValidator?: InputFileValidator | undefined;
  readonly validator?: InputValidator | undefined;
  readonly minMessageLength?: number | undefined;
  readonly minMessageLengthMessage?: SupportTextResolver<TContext> | undefined;
  readonly abortLabel?: SupportTextResolver<TContext> | undefined;
  readonly showAbort?: boolean | undefined;
  readonly shouldWaitForTurn?: boolean | undefined;
  readonly cooldownMs?: number | undefined;
  readonly cooldownMessage?: SupportTextResolver<TContext> | undefined;
  readonly inputTimeoutMs?: number | undefined;
  readonly inputTimeoutMessage?: SupportTextResolver<TContext> | undefined;
  readonly suppressValidationFailureMessage?: boolean | undefined;
  readonly variant?: MessageButton['variant'] | undefined;
  readonly className?: string | undefined;
  readonly style?: MessageButton['style'] | undefined;
  readonly rateLimit?: RequestInputRateLimit | undefined;
}

export interface SupportConfirmationButtonOverrides<TContext> {
  readonly initialLabel?: SupportTextResolver<TContext> | undefined;
  readonly confirmationMessage?: SupportTextResolver<TContext> | undefined;
  readonly confirmLabel?: SupportTextResolver<TContext> | undefined;
  readonly rejectLabel?: SupportTextResolver<TContext> | undefined;
  readonly variant?: MessageButton['variant'] | undefined;
  readonly className?: string | undefined;
  readonly style?: MessageButton['style'] | undefined;
}

export interface InMemorySupportTicketReferenceContext {
  readonly input: CreateSupportTicketInput;
  readonly tickets: readonly SupportTicket[];
  readonly nextTicketNumber: number;
}

export interface InMemorySupportTicketSubjectContext {
  readonly input: CreateSupportTicketInput;
}

export interface InMemorySupportTicketMessageIdContext {
  readonly ticketReference: string;
  readonly input: CreateSupportTicketInput | AppendSupportTicketMessageInput;
  readonly nextMessageNumber: number;
}

export interface InMemorySupportLiveChatIdContext {
  readonly input: StartSupportLiveChatInput;
  readonly liveChats: readonly SupportLiveChatSession[];
  readonly nextLiveChatNumber: number;
}

export interface InMemorySupportLiveChatMessageIdContext {
  readonly sessionId: string;
  readonly input: StartSupportLiveChatInput | AppendSupportLiveChatMessageInput;
  readonly nextMessageNumber: number;
}

export interface InMemorySupportLiveChatQueueContext {
  readonly input: StartSupportLiveChatInput;
  readonly liveChats: readonly SupportLiveChatSession[];
  readonly queuedLiveChatCount: number;
}

export interface InMemorySupportLiveChatWaitContext extends InMemorySupportLiveChatQueueContext {
  readonly queuePosition: number;
}

export interface InMemorySupportFlowAdapterOptions {
  readonly tickets?: readonly SupportTicket[] | undefined;
  readonly liveChats?: readonly SupportLiveChatSession[] | undefined;
  readonly nextTicketNumber?: number | undefined;
  readonly nextTicketMessageNumber?: number | undefined;
  readonly nextLiveChatNumber?: number | undefined;
  readonly nextLiveChatMessageNumber?: number | undefined;
  readonly now?: (() => Date) | undefined;
  readonly createTicketReference?:
    | ((context: InMemorySupportTicketReferenceContext) => string)
    | undefined;
  readonly createTicketSubject?:
    | ((context: InMemorySupportTicketSubjectContext) => string)
    | undefined;
  readonly createTicketMessageId?:
    | ((context: InMemorySupportTicketMessageIdContext) => string)
    | undefined;
  readonly createLiveChatId?:
    | ((context: InMemorySupportLiveChatIdContext) => string)
    | undefined;
  readonly createLiveChatMessageId?:
    | ((context: InMemorySupportLiveChatMessageIdContext) => string)
    | undefined;
  readonly defaultTicketStatus?: SupportTicketStatus | undefined;
  readonly defaultTicketPriority?: SupportTicketPriority | undefined;
  readonly defaultQueueStatuses?: readonly SupportTicketStatus[] | undefined;
  readonly defaultLiveChatQueueStatuses?:
    | readonly SupportLiveChatStatus[]
    | undefined;
  readonly getLiveChatQueuePosition?:
    | ((context: InMemorySupportLiveChatQueueContext) => number)
    | undefined;
  readonly getEstimatedWaitMinutes?:
    | ((context: InMemorySupportLiveChatWaitContext) => number)
    | undefined;
  readonly matchCustomer?:
    | ((
        candidate: SupportUserIdentity,
        customer: SupportUserIdentity
      ) => boolean)
    | undefined;
  readonly sortTickets?:
    | ((left: SupportTicket, right: SupportTicket) => number)
    | undefined;
  readonly sortLiveChats?:
    | ((left: SupportLiveChatSession, right: SupportLiveChatSession) => number)
    | undefined;
}
