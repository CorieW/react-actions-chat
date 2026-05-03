import type {
  InputMessage,
  InputFileValidator,
  InputSelectOption,
  InputType,
  InputValidator,
  MessageButton,
  RequestInputRateLimit,
} from 'react-actions-chat';

/**
 * Value that may be returned synchronously or through a promise.
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Static support text or a context-aware resolver that returns support text.
 */
export type SupportTextResolver<TContext> =
  | string
  | ((context: TContext) => string);

/**
 * Lifecycle status values supported by support tickets.
 */
export type SupportTicketStatus =
  | 'new'
  | 'open'
  | 'pending-customer'
  | 'pending-internal'
  | 'resolved'
  | 'closed';

/**
 * Priority values supported by support tickets.
 */
export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Lifecycle status values supported by live chat sessions.
 */
export type SupportLiveChatStatus = 'queued' | 'active' | 'ended';

/**
 * Author values supported by live chat transcript messages.
 */
export type SupportLiveChatMessageAuthor = 'customer' | 'agent' | 'system';

/**
 * Customer identity used for ticket ownership and live chat matching.
 */
export interface SupportUserIdentity {
  /**
   * Stable identifier for this value.
   */
  readonly id?: string | undefined;
  /**
   * Display name for the identity.
   */
  readonly name?: string | undefined;
  /**
   * Email address for the identity.
   */
  readonly email?: string | undefined;
  /**
   * Company name associated with the support user.
   */
  readonly company?: string | undefined;
}

/**
 * Agent identity used for assignment, admin actions, and live chat ownership.
 */
export interface SupportAgentIdentity {
  /**
   * Stable identifier for this value.
   */
  readonly id?: string | undefined;
  /**
   * Display name for the identity.
   */
  readonly name?: string | undefined;
  /**
   * Email address for the identity.
   */
  readonly email?: string | undefined;
  /**
   * Support team associated with the agent.
   */
  readonly team?: string | undefined;
}

/**
 * Ticket activity entry shown in summaries and full activity views.
 */
export interface SupportTicketMessage {
  /**
   * Stable identifier for this value.
   */
  readonly id: string;
  /**
   * Role or identity that authored the support message.
   */
  readonly author: 'customer' | 'agent' | 'system';
  /**
   * Display label for the support message author.
   */
  readonly authorLabel?: string | undefined;
  /**
   * Message body content.
   */
  readonly body: string;
  /**
   * Timestamp when the support record was created.
   */
  readonly createdAt: Date;
}

/**
 * Live chat transcript entry shared by customer and admin flows.
 */
export interface SupportLiveChatMessage {
  /**
   * Stable identifier for this value.
   */
  readonly id: string;
  /**
   * Role or identity that authored the support message.
   */
  readonly author: SupportLiveChatMessageAuthor;
  /**
   * Display label for the support message author.
   */
  readonly authorLabel?: string | undefined;
  /**
   * Message body content.
   */
  readonly body: string;
  /**
   * Timestamp when the support record was created.
   */
  readonly createdAt: Date;
}

/**
 * Support ticket record shared between user, admin, and adapter flows.
 */
export interface SupportTicket {
  /**
   * Human-readable ticket reference.
   */
  readonly reference: string;
  /**
   * Short subject line for the support ticket.
   */
  readonly subject: string;
  /**
   * Short summary of the support record.
   */
  readonly summary: string;
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
  /**
   * Current status for the support record.
   */
  readonly status: SupportTicketStatus;
  /**
   * Priority assigned to the support ticket.
   */
  readonly priority: SupportTicketPriority;
  /**
   * Agent label currently assigned to the ticket.
   */
  readonly assignedTo?: string | undefined;
  /**
   * Whether live chat has already been offered for the ticket.
   */
  readonly liveChatOffered: boolean;
  /**
   * Timestamp when the support record was created.
   */
  readonly createdAt: Date;
  /**
   * Timestamp when the support record was last updated.
   */
  readonly updatedAt: Date;
  /**
   * Messages associated with the transcript or support record.
   */
  readonly messages: readonly SupportTicketMessage[];
  /**
   * Tags associated with the support ticket.
   */
  readonly tags?: readonly string[] | undefined;
}

/**
 * Live chat session record shared between user, admin, and adapter flows.
 */
export interface SupportLiveChatSession {
  /**
   * Stable identifier for this value.
   */
  readonly id: string;
  /**
   * Short summary of the support record.
   */
  readonly summary: string;
  /**
   * Ticket reference associated with the live-chat session.
   */
  readonly ticketReference?: string | undefined;
  /**
   * Customer identity that requested the live-chat session.
   */
  readonly requestedBy: 'customer' | 'agent';
  /**
   * Position of the live-chat session in the queue.
   */
  readonly queuePosition: number;
  /**
   * Estimated wait time for the live-chat session in minutes.
   */
  readonly estimatedWaitMinutes: number;
  /**
   * Current status for the support record.
   */
  readonly status: SupportLiveChatStatus;
  /**
   * Timestamp when the support record was created.
   */
  readonly createdAt: Date;
  /**
   * Timestamp when the support record was last updated.
   */
  readonly updatedAt?: Date | undefined;
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer?: SupportUserIdentity | undefined;
  /**
   * Support agent identity used by this flow or helper.
   */
  readonly agent?: SupportAgentIdentity | undefined;
  /**
   * Messages associated with the transcript or support record.
   */
  readonly messages?: readonly SupportLiveChatMessage[] | undefined;
}

/**
 * Input used to create a new support ticket.
 */
export interface CreateSupportTicketInput {
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
  /**
   * Short subject line for the support ticket.
   */
  readonly subject?: string | undefined;
  /**
   * Short summary of the support record.
   */
  readonly summary: string;
  /**
   * Priority assigned to the support ticket.
   */
  readonly priority?: SupportTicketPriority | undefined;
  /**
   * Tags associated with the support ticket.
   */
  readonly tags?: readonly string[] | undefined;
}

/**
 * Patch payload used to update an existing support ticket.
 */
export interface UpdateSupportTicketInput {
  /**
   * Human-readable ticket reference.
   */
  readonly reference: string;
  /**
   * Current status for the support record.
   */
  readonly status?: SupportTicketStatus | undefined;
  /**
   * Priority assigned to the support ticket.
   */
  readonly priority?: SupportTicketPriority | undefined;
  /**
   * Agent label currently assigned to the ticket.
   */
  readonly assignedTo?: string | null | undefined;
  /**
   * Whether live chat has already been offered for the ticket.
   */
  readonly liveChatOffered?: boolean | undefined;
}

/**
 * Input used to append a message to an existing support ticket.
 */
export interface AppendSupportTicketMessageInput {
  /**
   * Human-readable ticket reference.
   */
  readonly reference: string;
  /**
   * Role or identity that authored the support message.
   */
  readonly author: SupportTicketMessage['author'];
  /**
   * Display label for the support message author.
   */
  readonly authorLabel?: string | undefined;
  /**
   * Message body content.
   */
  readonly body: string;
}

/**
 * Input used to open a support live chat session.
 */
export interface StartSupportLiveChatInput {
  /**
   * Short summary of the support record.
   */
  readonly summary: string;
  /**
   * Customer identity that requested the live-chat session.
   */
  readonly requestedBy: 'customer' | 'agent';
  /**
   * Ticket reference associated with the live-chat session.
   */
  readonly ticketReference?: string | undefined;
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer?: SupportUserIdentity | undefined;
  /**
   * Support agent identity used by this flow or helper.
   */
  readonly agent?: SupportAgentIdentity | undefined;
}

/**
 * Patch payload used to update an existing live chat session.
 */
export interface UpdateSupportLiveChatInput {
  /**
   * Identifier for the live-chat session.
   */
  readonly sessionId: string;
  /**
   * Current status for the support record.
   */
  readonly status?: SupportLiveChatStatus | undefined;
  /**
   * Position of the live-chat session in the queue.
   */
  readonly queuePosition?: number | undefined;
  /**
   * Estimated wait time for the live-chat session in minutes.
   */
  readonly estimatedWaitMinutes?: number | undefined;
  /**
   * Support agent identity used by this flow or helper.
   */
  readonly agent?: SupportAgentIdentity | null | undefined;
}

/**
 * Input used to append a message to an existing live chat session.
 */
export interface AppendSupportLiveChatMessageInput {
  /**
   * Identifier for the live-chat session.
   */
  readonly sessionId: string;
  /**
   * Role or identity that authored the support message.
   */
  readonly author: SupportLiveChatMessageAuthor;
  /**
   * Display label for the support message author.
   */
  readonly authorLabel?: string | undefined;
  /**
   * Message body content.
   */
  readonly body: string;
}

/**
 * Filter shape used when listing support tickets for admin queues.
 */
export interface SupportQueueFilter {
  /**
   * Statuses included by the filter.
   */
  readonly statuses?: readonly SupportTicketStatus[] | undefined;
  /**
   * Agent label currently assigned to the ticket.
   */
  readonly assignedTo?: string | undefined;
  /**
   * Additional filter fields passed through to the support adapter.
   */
  readonly [key: string]: unknown;
}

/**
 * Filter shape used when listing live chat sessions for admin queues.
 */
export interface SupportLiveChatQueueFilter {
  /**
   * Statuses included by the filter.
   */
  readonly statuses?: readonly SupportLiveChatStatus[] | undefined;
  /**
   * Customer identity that requested the live-chat session.
   */
  readonly requestedBy?: 'customer' | 'agent' | undefined;
  /**
   * Additional filter fields passed through to the support adapter.
   */
  readonly [key: string]: unknown;
}

/**
 * Adapter contract backing both customer and admin support flows.
 */
export interface SupportFlowAdapter {
  /**
   * Creates a support ticket.
   *
   * @param input - Input payload for the operation.
   */
  readonly createTicket:
    | ((input: CreateSupportTicketInput) => Promise<SupportTicket>)
    | ((input: CreateSupportTicketInput) => SupportTicket);
  /**
   * Returns a support ticket by reference.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly getTicketByReference:
    | ((reference: string) => Promise<SupportTicket | null>)
    | ((reference: string) => SupportTicket | null);
  /**
   * Lists tickets for a customer.
   *
   * @param customer - Customer identity used for the lookup.
   */
  readonly listCustomerTickets:
    | ((customer: SupportUserIdentity) => Promise<readonly SupportTicket[]>)
    | ((customer: SupportUserIdentity) => readonly SupportTicket[]);
  /**
   * Lists tickets for an admin queue.
   *
   * @param filter - Filter to apply to the list.
   */
  readonly listQueue:
    | ((filter?: SupportQueueFilter) => Promise<readonly SupportTicket[]>)
    | ((filter?: SupportQueueFilter) => readonly SupportTicket[]);
  /**
   * Lists live chat sessions for an admin queue.
   *
   * @param filter - Filter to apply to the list.
   */
  readonly listLiveChatQueue:
    | ((
        filter?: SupportLiveChatQueueFilter
      ) => Promise<readonly SupportLiveChatSession[]>)
    | ((
        filter?: SupportLiveChatQueueFilter
      ) => readonly SupportLiveChatSession[]);
  /**
   * Returns a live chat session by ID.
   *
   * @param sessionId - Live chat session ID to look up.
   */
  readonly getLiveChatById:
    | ((sessionId: string) => Promise<SupportLiveChatSession | null>)
    | ((sessionId: string) => SupportLiveChatSession | null);
  /**
   * Lists live chats for a customer.
   *
   * @param customer - Customer identity used for the lookup.
   */
  readonly listCustomerLiveChats:
    | ((
        customer: SupportUserIdentity
      ) => Promise<readonly SupportLiveChatSession[]>)
    | ((customer: SupportUserIdentity) => readonly SupportLiveChatSession[]);
  /**
   * Updates a support ticket.
   *
   * @param input - Input payload for the operation.
   */
  readonly updateTicket:
    | ((input: UpdateSupportTicketInput) => Promise<SupportTicket>)
    | ((input: UpdateSupportTicketInput) => SupportTicket);
  /**
   * Appends a message to a support ticket.
   *
   * @param input - Input payload for the operation.
   */
  readonly appendTicketMessage:
    | ((input: AppendSupportTicketMessageInput) => Promise<SupportTicket>)
    | ((input: AppendSupportTicketMessageInput) => SupportTicket);
  /**
   * Starts a support live chat.
   *
   * @param input - Input payload for the operation.
   */
  readonly startLiveChat:
    | ((input: StartSupportLiveChatInput) => Promise<SupportLiveChatSession>)
    | ((input: StartSupportLiveChatInput) => SupportLiveChatSession);
  /**
   * Updates a live chat session.
   *
   * @param input - Input payload for the operation.
   */
  readonly updateLiveChat:
    | ((input: UpdateSupportLiveChatInput) => Promise<SupportLiveChatSession>)
    | ((input: UpdateSupportLiveChatInput) => SupportLiveChatSession);
  /**
   * Appends a message to a live chat session.
   *
   * @param input - Input payload for the operation.
   */
  readonly appendLiveChatMessage:
    | ((
        input: AppendSupportLiveChatMessageInput
      ) => Promise<SupportLiveChatSession>)
    | ((input: AppendSupportLiveChatMessageInput) => SupportLiveChatSession);
}

/**
 * Length and custom validation rules for support request-input flows.
 */
export interface SupportInputValidationSettings {
  /**
   * Minimum number of characters required for submission.
   */
  readonly minMessageLength?: number | undefined;
  /**
   * Validation message shown when the submission is too short.
   */
  readonly minMessageLengthMessage?: string | undefined;
  /**
   * Maximum number of characters allowed for a support input message.
   */
  readonly maxMessageLength?: number | undefined;
  /**
   * Validation message shown when the support input is too long.
   */
  readonly maxMessageLengthMessage?: string | undefined;
  /**
   * Validator applied to text submissions.
   */
  readonly validator?: InputValidator | undefined;
}

/**
 * Validation rules grouped by customer support flow input slot.
 */
export interface SupportUserFlowValidationConfig {
  /**
   * Validation settings for the initial ticket summary.
   */
  readonly ticketSummary?: SupportInputValidationSettings | undefined;
  /**
   * Validation settings for additional ticket details.
   */
  readonly ticketDetail?: SupportInputValidationSettings | undefined;
  /**
   * Validation settings for the initial live-chat message.
   */
  readonly liveChatInitialMessage?: SupportInputValidationSettings | undefined;
  /**
   * Live-chat message handled by this operation.
   */
  readonly liveChatMessage?: SupportInputValidationSettings | undefined;
}

/**
 * Validation rules grouped by admin support flow input slot.
 */
export interface SupportAdminFlowValidationConfig {
  /**
   * Validation settings for ticket-assignment input.
   */
  readonly ticketAssignment?: SupportInputValidationSettings | undefined;
  /**
   * Validation settings for ticket-reply input.
   */
  readonly ticketReply?: SupportInputValidationSettings | undefined;
  /**
   * Live-chat message handled by this operation.
   */
  readonly liveChatMessage?: SupportInputValidationSettings | undefined;
}

/**
 * Callback-based support backend contract for the customer flow.
 */
export interface SupportUserFlowCallbacks {
  /**
   * Creates a support ticket.
   *
   * @param input - Input payload for the operation.
   */
  readonly createTicket?:
    | ((input: CreateSupportTicketInput) => MaybePromise<SupportTicket>)
    | undefined;
  /**
   * Returns a support ticket by reference.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly getTicket?:
    | ((reference: string) => MaybePromise<SupportTicket | null>)
    | undefined;
  /**
   * Handles list tickets.
   *
   * @param customer - Customer identity used for the lookup.
   */
  readonly listTickets?:
    | ((
        customer: SupportUserIdentity
      ) => MaybePromise<readonly SupportTicket[]>)
    | undefined;
  /**
   * Appends a message to a support ticket.
   *
   * @param input - Input payload for the operation.
   */
  readonly appendTicketMessage?:
    | ((input: AppendSupportTicketMessageInput) => MaybePromise<SupportTicket>)
    | undefined;
  /**
   * Starts a support live chat.
   *
   * @param input - Input payload for the operation.
   */
  readonly startLiveChat?:
    | ((
        input: StartSupportLiveChatInput
      ) => MaybePromise<SupportLiveChatSession>)
    | undefined;
  /**
   * Returns the customer's current open live chat.
   *
   * @param customer - Customer identity used for the lookup.
   */
  readonly getOpenLiveChat?:
    | ((
        customer: SupportUserIdentity
      ) => MaybePromise<SupportLiveChatSession | null>)
    | undefined;
  /**
   * Returns a live chat session by ID.
   *
   * @param sessionId - Live chat session ID to look up.
   */
  readonly getLiveChat?:
    | ((sessionId: string) => MaybePromise<SupportLiveChatSession | null>)
    | undefined;
  /**
   * Updates a live chat session.
   *
   * @param input - Input payload for the operation.
   */
  readonly updateLiveChat?:
    | ((
        input: UpdateSupportLiveChatInput
      ) => MaybePromise<SupportLiveChatSession>)
    | undefined;
  /**
   * Appends a message to a live chat session.
   *
   * @param input - Input payload for the operation.
   */
  readonly appendLiveChatMessage?:
    | ((
        input: AppendSupportLiveChatMessageInput
      ) => MaybePromise<SupportLiveChatSession>)
    | undefined;
}

/**
 * Callback-based support backend contract for the admin flow.
 */
export interface SupportAdminFlowCallbacks {
  /**
   * Lists tickets for an admin queue.
   *
   * @param filter - Filter to apply to the list.
   */
  readonly listTicketQueue?:
    | ((filter?: SupportQueueFilter) => MaybePromise<readonly SupportTicket[]>)
    | undefined;
  /**
   * Lists live chat sessions for an admin queue.
   *
   * @param filter - Filter to apply to the list.
   */
  readonly listLiveChatQueue?:
    | ((
        filter?: SupportLiveChatQueueFilter
      ) => MaybePromise<readonly SupportLiveChatSession[]>)
    | undefined;
  /**
   * Returns a support ticket by reference.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly getTicket?:
    | ((reference: string) => MaybePromise<SupportTicket | null>)
    | undefined;
  /**
   * Updates a support ticket.
   *
   * @param input - Input payload for the operation.
   */
  readonly updateTicket?:
    | ((input: UpdateSupportTicketInput) => MaybePromise<SupportTicket>)
    | undefined;
  /**
   * Appends a message to a support ticket.
   *
   * @param input - Input payload for the operation.
   */
  readonly appendTicketMessage?:
    | ((input: AppendSupportTicketMessageInput) => MaybePromise<SupportTicket>)
    | undefined;
  /**
   * Returns a live chat session by ID.
   *
   * @param sessionId - Live chat session ID to look up.
   */
  readonly getLiveChat?:
    | ((sessionId: string) => MaybePromise<SupportLiveChatSession | null>)
    | undefined;
  /**
   * Updates a live chat session.
   *
   * @param input - Input payload for the operation.
   */
  readonly updateLiveChat?:
    | ((
        input: UpdateSupportLiveChatInput
      ) => MaybePromise<SupportLiveChatSession>)
    | undefined;
  /**
   * Appends a message to a live chat session.
   *
   * @param input - Input payload for the operation.
   */
  readonly appendLiveChatMessage?:
    | ((
        input: AppendSupportLiveChatMessageInput
      ) => MaybePromise<SupportLiveChatSession>)
    | undefined;
}

/**
 * Common runtime API returned by support flow factories.
 */
export interface SupportFlowBase {
  /**
   * Messages used to seed the chat transcript.
   */
  readonly initialMessages: readonly InputMessage[];
  /**
   * Primary buttons returned by the support flow factory.
   */
  readonly primaryButtons: readonly MessageButton[];
  /**
   * Starts the support flow.
   */
  readonly start: () => void;
}

/**
 * Shared context passed to support button customization hooks.
 */
export interface SupportButtonCustomizationContext {
  /**
   * Button slot where the override is applied.
   */
  readonly slot: string;
  /**
   * Default buttons available before customization is applied.
   */
  readonly defaultButtons: readonly MessageButton[];
}

/**
 * Hook signature for replacing or reordering default support buttons.
 *
 * @param context - Context object available to this resolver.
 */
export type SupportButtonCustomizer<
  TContext extends SupportButtonCustomizationContext,
> = (context: TContext) => readonly MessageButton[];

/**
 * Filter option supported by the support list.
 */
export interface SupportListFilterOption {
  /**
   * Stable identifier for this value.
   */
  readonly id: string;
  /**
   * Visible label shown for this option or button.
   */
  readonly label: string;
  /**
   * Whether default is true.
   */
  readonly isDefault?: boolean | undefined;
  /**
   * Visual variant used when rendering the button.
   */
  readonly variant?: MessageButton['variant'] | undefined;
  /**
   * Button variant used when this filter is active.
   */
  readonly activeVariant?: MessageButton['variant'] | undefined;
  /**
   * Additional class name applied to the rendered element.
   */
  readonly className?: string | undefined;
  /**
   * Inline styles applied to the rendered element.
   */
  readonly style?: MessageButton['style'] | undefined;
}

/**
 * Copy, validation, behavior, and styling overrides for support request-input buttons.
 */
export interface SupportRequestInputButtonOverrides<TContext> {
  /**
   * Label shown for the initial action.
   */
  readonly initialLabel?: SupportTextResolver<TContext> | undefined;
  /**
   * Prompt message shown before collecting request input.
   */
  readonly inputPromptMessage?: SupportTextResolver<TContext> | undefined;
  /**
   * Placeholder text shown by the input.
   */
  readonly placeholder?: SupportTextResolver<TContext> | undefined;
  /**
   * Description shown alongside the request input.
   */
  readonly inputDescription?: SupportTextResolver<TContext> | undefined;
  /**
   * Input mode used when collecting user input.
   */
  readonly inputType?: InputType | undefined;
  /**
   * Select options shown by the request input.
   */
  readonly inputOptions?: readonly InputSelectOption[] | undefined;
  /**
   * Whether file uploads are allowed for the input.
   */
  readonly allowFileUpload?: boolean | undefined;
  /**
   * Validator applied to uploaded files.
   */
  readonly fileValidator?: InputFileValidator | undefined;
  /**
   * Validator applied to text submissions.
   */
  readonly validator?: InputValidator | undefined;
  /**
   * Minimum number of characters required for submission.
   */
  readonly minMessageLength?: number | undefined;
  /**
   * Validation message shown when the submission is too short.
   */
  readonly minMessageLengthMessage?: SupportTextResolver<TContext> | undefined;
  /**
   * Label shown for the abort action.
   */
  readonly abortLabel?: SupportTextResolver<TContext> | undefined;
  /**
   * Whether the abort action is shown while collecting input.
   */
  readonly showAbort?: boolean | undefined;
  /**
   * Whether submissions wait for the current assistant turn to finish.
   */
  readonly shouldWaitForTurn?: boolean | undefined;
  /**
   * Cooldown duration in milliseconds before another submission is allowed.
   */
  readonly cooldownMs?: number | undefined;
  /**
   * Message shown while the input is in cooldown.
   */
  readonly cooldownMessage?: SupportTextResolver<TContext> | undefined;
  /**
   * Timeout in milliseconds before the request input expires.
   */
  readonly inputTimeoutMs?: number | undefined;
  /**
   * Message shown when the input times out.
   */
  readonly inputTimeoutMessage?: SupportTextResolver<TContext> | undefined;
  /**
   * Whether validation failure messages are suppressed.
   */
  readonly suppressValidationFailureMessage?: boolean | undefined;
  /**
   * Visual variant used when rendering the button.
   */
  readonly variant?: MessageButton['variant'] | undefined;
  /**
   * Additional class name applied to the rendered element.
   */
  readonly className?: string | undefined;
  /**
   * Inline styles applied to the rendered element.
   */
  readonly style?: MessageButton['style'] | undefined;
  /**
   * Rate-limit settings applied to request-input submissions.
   */
  readonly rateLimit?: RequestInputRateLimit | undefined;
}

/**
 * Copy and styling overrides for support confirmation buttons.
 */
export interface SupportConfirmationButtonOverrides<TContext> {
  /**
   * Label shown for the initial action.
   */
  readonly initialLabel?: SupportTextResolver<TContext> | undefined;
  /**
   * Message shown before asking the user to confirm the action.
   */
  readonly confirmationMessage?: SupportTextResolver<TContext> | undefined;
  /**
   * Label shown for the confirm action.
   */
  readonly confirmLabel?: SupportTextResolver<TContext> | undefined;
  /**
   * Label shown for the reject action.
   */
  readonly rejectLabel?: SupportTextResolver<TContext> | undefined;
  /**
   * Visual variant used when rendering the button.
   */
  readonly variant?: MessageButton['variant'] | undefined;
  /**
   * Additional class name applied to the rendered element.
   */
  readonly className?: string | undefined;
  /**
   * Inline styles applied to the rendered element.
   */
  readonly style?: MessageButton['style'] | undefined;
}

/**
 * Context passed when generating an in-memory support ticket reference.
 */
export interface InMemorySupportTicketReferenceContext {
  /**
   * Input configuration or value handled by this contract.
   */
  readonly input: CreateSupportTicketInput;
  /**
   * Support tickets in the current list or queue.
   */
  readonly tickets: readonly SupportTicket[];
  /**
   * Next numeric suffix used when creating ticket references.
   */
  readonly nextTicketNumber: number;
}

/**
 * Context passed when deriving an in-memory support ticket subject.
 */
export interface InMemorySupportTicketSubjectContext {
  /**
   * Input configuration or value handled by this contract.
   */
  readonly input: CreateSupportTicketInput;
}

/**
 * Context passed when generating an in-memory support ticket message ID.
 */
export interface InMemorySupportTicketMessageIdContext {
  /**
   * Ticket reference associated with the live-chat session.
   */
  readonly ticketReference: string;
  /**
   * Input configuration or value handled by this contract.
   */
  readonly input: CreateSupportTicketInput | AppendSupportTicketMessageInput;
  /**
   * Next numeric suffix used when creating message identifiers.
   */
  readonly nextMessageNumber: number;
}

/**
 * Context passed when generating an in-memory live chat session ID.
 */
export interface InMemorySupportLiveChatIdContext {
  /**
   * Input configuration or value handled by this contract.
   */
  readonly input: StartSupportLiveChatInput;
  /**
   * Live-chat sessions stored by the adapter.
   */
  readonly liveChats: readonly SupportLiveChatSession[];
  /**
   * Next numeric suffix used when creating live-chat identifiers.
   */
  readonly nextLiveChatNumber: number;
}

/**
 * Context passed when generating an in-memory live chat message ID.
 */
export interface InMemorySupportLiveChatMessageIdContext {
  /**
   * Identifier for the live-chat session.
   */
  readonly sessionId: string;
  /**
   * Input configuration or value handled by this contract.
   */
  readonly input: StartSupportLiveChatInput | AppendSupportLiveChatMessageInput;
  /**
   * Next numeric suffix used when creating message identifiers.
   */
  readonly nextMessageNumber: number;
}

/**
 * Context passed when deriving an in-memory live chat queue position.
 */
export interface InMemorySupportLiveChatQueueContext {
  /**
   * Input configuration or value handled by this contract.
   */
  readonly input: StartSupportLiveChatInput;
  /**
   * Live-chat sessions stored by the adapter.
   */
  readonly liveChats: readonly SupportLiveChatSession[];
  /**
   * Number of live-chat sessions currently waiting in the queue.
   */
  readonly queuedLiveChatCount: number;
}

/**
 * Context passed when deriving an in-memory live chat wait estimate.
 */
export interface InMemorySupportLiveChatWaitContext extends InMemorySupportLiveChatQueueContext {
  /**
   * Position of the live-chat session in the queue.
   */
  readonly queuePosition: number;
}

/**
 * Configuration for in-memory adapter seed data, IDs, defaults, and sorting.
 */
export interface InMemorySupportFlowAdapterOptions {
  /**
   * Support tickets in the current list or queue.
   */
  readonly tickets?: readonly SupportTicket[] | undefined;
  /**
   * Live-chat sessions stored by the adapter.
   */
  readonly liveChats?: readonly SupportLiveChatSession[] | undefined;
  /**
   * Next numeric suffix used when creating ticket references.
   */
  readonly nextTicketNumber?: number | undefined;
  /**
   * Next ticket message number value used by this contract.
   */
  readonly nextTicketMessageNumber?: number | undefined;
  /**
   * Next numeric suffix used when creating live-chat identifiers.
   */
  readonly nextLiveChatNumber?: number | undefined;
  /**
   * Next live chat message number value used by this contract.
   */
  readonly nextLiveChatMessageNumber?: number | undefined;
  /**
   * Clock used to timestamp in-memory adapter records.
   */
  readonly now?: (() => Date) | undefined;
  /**
   * Creates an in-memory ticket reference.
   *
   * @param context - Context available to the callback.
   */
  readonly createTicketReference?:
    | ((context: InMemorySupportTicketReferenceContext) => string)
    | undefined;
  /**
   * Creates an in-memory ticket subject.
   *
   * @param context - Context available to the callback.
   */
  readonly createTicketSubject?:
    | ((context: InMemorySupportTicketSubjectContext) => string)
    | undefined;
  /**
   * Creates an in-memory ticket message ID.
   *
   * @param context - Context available to the callback.
   */
  readonly createTicketMessageId?:
    | ((context: InMemorySupportTicketMessageIdContext) => string)
    | undefined;
  /**
   * Creates an in-memory live chat session ID.
   *
   * @param context - Context available to the callback.
   */
  readonly createLiveChatId?:
    | ((context: InMemorySupportLiveChatIdContext) => string)
    | undefined;
  /**
   * Creates an in-memory live chat message ID.
   *
   * @param context - Context available to the callback.
   */
  readonly createLiveChatMessageId?:
    | ((context: InMemorySupportLiveChatMessageIdContext) => string)
    | undefined;
  /**
   * Default status assigned to newly created tickets.
   */
  readonly defaultTicketStatus?: SupportTicketStatus | undefined;
  /**
   * Default priority assigned to newly created tickets.
   */
  readonly defaultTicketPriority?: SupportTicketPriority | undefined;
  /**
   * Default ticket statuses included in queue listings.
   */
  readonly defaultQueueStatuses?: readonly SupportTicketStatus[] | undefined;
  /**
   * Default live-chat statuses included in queue listings.
   */
  readonly defaultLiveChatQueueStatuses?:
    | readonly SupportLiveChatStatus[]
    | undefined;
  /**
   * Returns the queue position for an in-memory live chat.
   *
   * @param context - Context available to the callback.
   */
  readonly getLiveChatQueuePosition?:
    | ((context: InMemorySupportLiveChatQueueContext) => number)
    | undefined;
  /**
   * Returns the estimated wait for an in-memory live chat.
   *
   * @param context - Context available to the callback.
   */
  readonly getEstimatedWaitMinutes?:
    | ((context: InMemorySupportLiveChatWaitContext) => number)
    | undefined;
  /**
   * Returns whether two customer identities match.
   *
   * @param candidate - Identity value to compare against the configured identity.
   * @param customer - Customer identity used for the lookup.
   */
  readonly matchCustomer?:
    | ((
        candidate: SupportUserIdentity,
        customer: SupportUserIdentity
      ) => boolean)
    | undefined;
  /**
   * Sorts support tickets.
   *
   * @param left - Left value in the comparison.
   * @param right - Right value in the comparison.
   */
  readonly sortTickets?:
    | ((left: SupportTicket, right: SupportTicket) => number)
    | undefined;
  /**
   * Sorts live chat sessions.
   *
   * @param left - Left value in the comparison.
   * @param right - Right value in the comparison.
   */
  readonly sortLiveChats?:
    | ((left: SupportLiveChatSession, right: SupportLiveChatSession) => number)
    | undefined;
}
