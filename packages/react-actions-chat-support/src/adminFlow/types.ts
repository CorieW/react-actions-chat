import type { MessageButton } from 'react-actions-chat';
import type {
  SupportAdminFlowCallbacks,
  SupportAdminFlowValidationConfig,
  SupportAgentIdentity,
  SupportButtonCustomizer,
  SupportConfirmationButtonOverrides,
  SupportFlowAdapter,
  SupportFlowBase,
  SupportListFilterOption,
  SupportLiveChatSession,
  SupportLiveChatQueueFilter,
  SupportQueueFilter,
  SupportRequestInputButtonOverrides,
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../supportFlowTypes';

/**
 * Defaultable label contract for the support admin flow.
 */
export interface SupportAdminFlowLabels {
  /**
   * Label text for the view ticket queue action or state.
   */
  readonly viewTicketQueue: string;
  /**
   * Label text for the view live chat queue action or state.
   */
  readonly viewLiveChatQueue: string;
  /**
   * Button definition or override for reviewing a ticket.
   */
  readonly reviewTicket: string;
  /**
   * Label text for the my assigned work action or state.
   */
  readonly myAssignedWork: string;
  /**
   * Button used to navigate to the previous ticket page.
   */
  readonly previousTickets: string;
  /**
   * Next tickets value used by this contract.
   */
  readonly nextTickets: string;
  /**
   * Label text for the previous live chats action or state.
   */
  readonly previousLiveChats: string;
  /**
   * Next live chats value used by this contract.
   */
  readonly nextLiveChats: string;
  /**
   * Label text for the back to admin options action or state.
   */
  readonly backToAdminOptions: string;
  /**
   * Label text for the back to live chat queue action or state.
   */
  readonly backToLiveChatQueue: string;
  /**
   * Label text for the refresh ticket queue action or state.
   */
  readonly refreshTicketQueue: string;
  /**
   * Label text for the refresh live chats action or state.
   */
  readonly refreshLiveChats: string;
  /**
   * Button used to refresh the live-chat view.
   */
  readonly refreshChat: string;
  /**
   * Service used to end a live-chat session.
   */
  readonly endLiveChat: string;
  /**
   * Label text for the join live chat action or state.
   */
  readonly joinLiveChat: string;
  /**
   * Label text for the leave live chat action or state.
   */
  readonly leaveLiveChat: string;
  /**
   * Label text for the assign to me action or state.
   */
  readonly assignToMe: string;
  /**
   * Label text for the assigned to me action or state.
   */
  readonly assignedToMe: string;
  /**
   * Label text for the assign to agent action or state.
   */
  readonly assignToAgent: string;
  /**
   * Label text for the set priority action or state.
   */
  readonly setPriority: string;
  /**
   * Sets priority prompt.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly setPriorityPrompt: (ticket: SupportTicket) => string;
  /**
   * Label text for the set priority placeholder action or state.
   */
  readonly setPriorityPlaceholder: string;
  /**
   * Label text for the set priority description action or state.
   */
  readonly setPriorityDescription: string;
  /**
   * Button used to show the full ticket activity.
   */
  readonly viewFullActivity: string;
  /**
   * Label text for the reply to customer action or state.
   */
  readonly replyToCustomer: string;
  /**
   * Label text for the reopen ticket action or state.
   */
  readonly reopenTicket: string;
  /**
   * Button definition or override for resolving a ticket.
   */
  readonly resolveTicket: string;
  /**
   * Label text for the resolve confirm action or state.
   */
  readonly resolveConfirm: string;
  /**
   * Label text for the resolve reject action or state.
   */
  readonly resolveReject: string;
  /**
   * Label text for the live chat reply placeholder action or state.
   */
  readonly liveChatReplyPlaceholder: string;
  /**
   * Handles live chat reply description.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly liveChatReplyDescription: (
    session: SupportLiveChatSession
  ) => string;
}

/**
 * Context passed to request-input overrides for the support admin ticket.
 */
export interface SupportAdminTicketInputContext {
  /**
   * Support agent identity used by this flow or helper.
   */
  readonly agent: SupportAgentIdentity;
  /**
   * Display label for the support agent in generated messages.
   */
  readonly agentLabel: string;
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket: SupportTicket;
}

/**
 * Context passed to request-input overrides for the support admin review ticket.
 */
export interface SupportAdminReviewTicketInputContext {
  /**
   * Support agent identity used by this flow or helper.
   */
  readonly agent: SupportAgentIdentity;
  /**
   * Display label for the support agent in generated messages.
   */
  readonly agentLabel: string;
}

/**
 * Request-input customization slots for the support admin flow.
 */
export interface SupportAdminFlowRequestInputs {
  /**
   * Button definition or override for reviewing a ticket.
   */
  readonly reviewTicket?:
    | SupportRequestInputButtonOverrides<SupportAdminReviewTicketInputContext>
    | undefined;
  /**
   * Request-input overrides for the assign ticket action.
   */
  readonly assignTicket?:
    | SupportRequestInputButtonOverrides<SupportAdminTicketInputContext>
    | undefined;
  /**
   * Request-input overrides for the reply to customer action.
   */
  readonly replyToCustomer?:
    | SupportRequestInputButtonOverrides<SupportAdminTicketInputContext>
    | undefined;
  /**
   * Request-input overrides for the set priority action.
   */
  readonly setPriority?:
    | SupportRequestInputButtonOverrides<SupportAdminTicketInputContext>
    | undefined;
}

/**
 * Confirmation-button customization slots for the support admin flow.
 */
export interface SupportAdminFlowConfirmations {
  /**
   * Button definition or override for resolving a ticket.
   */
  readonly resolveTicket?:
    | SupportConfirmationButtonOverrides<SupportAdminTicketInputContext>
    | undefined;
}

/**
 * Capability flags derived for the support admin flow.
 */
export interface SupportAdminFlowCapabilities {
  /**
   * Whether ticket queue listing is available.
   */
  readonly canListTicketQueue: boolean;
  /**
   * Whether live-chat queue listing is available.
   */
  readonly canListLiveChatQueue: boolean;
  /**
   * Whether individual ticket lookup is available.
   */
  readonly canGetTicket: boolean;
  /**
   * Whether ticket updates are available.
   */
  readonly canUpdateTicket: boolean;
  /**
   * Whether ticket message append actions are available.
   */
  readonly canAppendTicketMessage: boolean;
  /**
   * Whether individual live-chat lookup is available.
   */
  readonly canGetLiveChat: boolean;
  /**
   * Whether live-chat updates are available.
   */
  readonly canUpdateLiveChat: boolean;
  /**
   * Whether live-chat message append actions are available.
   */
  readonly canAppendLiveChatMessage: boolean;
  /**
   * Whether opening the live-chat queue is available.
   */
  readonly canOpenLiveChatQueue: boolean;
}

/**
 * Shared formatter context for admin support messages.
 */
export interface SupportAdminFormatterContext {
  /**
   * Support agent identity used by this flow or helper.
   */
  readonly agent: SupportAgentIdentity;
  /**
   * Display label for the support agent in generated messages.
   */
  readonly agentLabel: string;
  /**
   * Brand or workspace name shown in generated flow messages.
   */
  readonly brandName: string;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Resolved backend capabilities available to the flow.
   */
  readonly capabilities: SupportAdminFlowCapabilities;
  /**
   * Maximum number of queued records shown by the admin flow.
   */
  readonly queueLimit?: number | undefined;
  /**
   * Maximum number of live-chat sessions shown in the queue.
   */
  readonly liveChatQueueLimit?: number | undefined;
  /**
   * Maximum number of assigned tickets shown in the admin flow.
   */
  readonly assignedWorkLimit?: number | undefined;
  /**
   * Maximum number of recent activity entries included in formatted output.
   */
  readonly recentActivityLimit?: number | undefined;
  /**
   * Maximum number of transcript messages included in formatted output.
   */
  readonly transcriptLimit?: number | undefined;
}

/**
 * Formatter context for admin ticket detail messages.
 */
export interface SupportAdminTicketFormatterContext extends SupportAdminFormatterContext {
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket: SupportTicket;
}

/**
 * Formatter context for admin ticket queue messages.
 */
export interface SupportAdminTicketsFormatterContext extends SupportAdminFormatterContext {
  /**
   * Support tickets in the current list or queue.
   */
  readonly tickets: readonly SupportTicket[];
  /**
   * Support tickets visible on the current page.
   */
  readonly visibleTickets?: readonly SupportTicket[] | undefined;
  /**
   * One-based page number currently being rendered.
   */
  readonly currentPage?: number | undefined;
  /**
   * Total number of pages available.
   */
  readonly pageCount?: number | undefined;
  /**
   * Number of items shown per page.
   */
  readonly pageSize?: number | undefined;
  /**
   * Total number of support tickets before pagination.
   */
  readonly totalTickets?: number | undefined;
  /**
   * Whether another ticket page is available after the current page.
   */
  readonly hasMoreTickets?: boolean | undefined;
  /**
   * Whether totalTickets is the exact total rather than a lower bound.
   */
  readonly isTotalTicketsExact?: boolean | undefined;
  /**
   * Identifier for the currently selected filter option.
   */
  readonly activeFilterId?: string | undefined;
  /**
   * Display label for the currently selected filter option.
   */
  readonly activeFilterLabel?: string | undefined;
  /**
   * Filter options available for the current list.
   */
  readonly filterOptions?:
    | readonly SupportAdminTicketQueueFilterOption[]
    | undefined;
}

/**
 * Formatter context for admin live chat detail messages.
 */
export interface SupportAdminLiveChatFormatterContext extends SupportAdminFormatterContext {
  /**
   * Live-chat session handled by this flow or helper.
   */
  readonly session: SupportLiveChatSession;
}

/**
 * Formatter context for admin live chat queue messages.
 */
export interface SupportAdminLiveChatsFormatterContext extends SupportAdminFormatterContext {
  /**
   * Live-chat sessions in the current list or queue.
   */
  readonly sessions: readonly SupportLiveChatSession[];
  /**
   * Live-chat sessions visible on the current page.
   */
  readonly visibleSessions?: readonly SupportLiveChatSession[] | undefined;
  /**
   * One-based page number currently being rendered.
   */
  readonly currentPage?: number | undefined;
  /**
   * Total number of pages available.
   */
  readonly pageCount?: number | undefined;
  /**
   * Number of items shown per page.
   */
  readonly pageSize?: number | undefined;
  /**
   * Total number of live-chat sessions before pagination.
   */
  readonly totalSessions?: number | undefined;
  /**
   * Identifier for the currently selected filter option.
   */
  readonly activeFilterId?: string | undefined;
  /**
   * Display label for the currently selected filter option.
   */
  readonly activeFilterLabel?: string | undefined;
  /**
   * Filter options available for the current list.
   */
  readonly filterOptions?:
    | readonly SupportAdminLiveChatQueueFilterOption[]
    | undefined;
}

/**
 * Formatter overrides for messages produced by the support admin flow.
 */
export interface SupportAdminFlowFormatters {
  /**
   * Handles opening message.
   *
   * @param context - Context available to the callback.
   */
  readonly openingMessage?:
    | ((context: SupportAdminFormatterContext) => string)
    | undefined;
  /**
   * Handles ticket details.
   *
   * @param context - Context available to the callback.
   */
  readonly ticketDetails?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  /**
   * Handles ticket full activity.
   *
   * @param context - Context available to the callback.
   */
  readonly ticketFullActivity?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  /**
   * Handles ticket queue.
   *
   * @param context - Context available to the callback.
   */
  readonly ticketQueue?:
    | ((context: SupportAdminTicketsFormatterContext) => string)
    | undefined;
  /**
   * Handles live chat queue.
   *
   * @param context - Context available to the callback.
   */
  readonly liveChatQueue?:
    | ((context: SupportAdminLiveChatsFormatterContext) => string)
    | undefined;
  /**
   * Handles live chat details.
   *
   * @param context - Context available to the callback.
   */
  readonly liveChatDetails?:
    | ((context: SupportAdminLiveChatFormatterContext) => string)
    | undefined;
  /**
   * Handles live chat ended.
   *
   * @param context - Context available to the callback.
   */
  readonly liveChatEnded?:
    | ((context: SupportAdminLiveChatFormatterContext) => string)
    | undefined;
  /**
   * Handles live chat joined.
   *
   * @param context - Context available to the callback.
   */
  readonly liveChatJoined?:
    | ((context: SupportAdminLiveChatFormatterContext) => string)
    | undefined;
  /**
   * Handles live chat left.
   *
   * @param context - Context available to the callback.
   */
  readonly liveChatLeft?:
    | ((context: SupportAdminLiveChatFormatterContext) => string)
    | undefined;
  /**
   * Handles ticket assigned.
   *
   * @param context - Context available to the callback.
   */
  readonly ticketAssigned?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  /**
   * Handles ticket priority changed.
   *
   * @param context - Context available to the callback.
   */
  readonly ticketPriorityChanged?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  /**
   * Handles ticket reply sent.
   *
   * @param context - Context available to the callback.
   */
  readonly ticketReplySent?:
    | ((
        context: SupportAdminTicketFormatterContext & {
          /**
           * Message body content.
           */
          readonly body: string;
        }
      ) => string)
    | undefined;
  /**
   * Handles ticket reopened.
   *
   * @param context - Context available to the callback.
   */
  readonly ticketReopened?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  /**
   * Handles ticket resolved.
   *
   * @param context - Context available to the callback.
   */
  readonly ticketResolved?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
}

/**
 * Status values applied after admin ticket actions.
 */
export interface SupportAdminStatusTransitions {
  /**
   * Ticket status applied after the assigned ticket status admin action.
   */
  readonly assignedTicketStatus?: SupportTicketStatus | undefined;
  /**
   * Ticket status applied after the replied ticket status admin action.
   */
  readonly repliedTicketStatus?: SupportTicketStatus | undefined;
  /**
   * Ticket status applied after the reopened ticket status admin action.
   */
  readonly reopenedTicketStatus?: SupportTicketStatus | undefined;
  /**
   * Ticket status applied after the resolved ticket status admin action.
   */
  readonly resolvedTicketStatus?: SupportTicketStatus | undefined;
}

/**
 * Behavior overrides for the support admin flow.
 */
export interface SupportAdminFlowBehavior {
  /**
   * Maximum number of queued records shown by the admin flow.
   */
  readonly queueLimit?: number | undefined;
  /**
   * Maximum number of live-chat sessions shown in the queue.
   */
  readonly liveChatQueueLimit?: number | undefined;
  /**
   * Maximum number of assigned tickets shown in the admin flow.
   */
  readonly assignedWorkLimit?: number | undefined;
  /**
   * Maximum number of recent activity entries included in formatted output.
   */
  readonly recentActivityLimit?: number | undefined;
  /**
   * Maximum number of transcript messages included in formatted output.
   */
  readonly transcriptLimit?: number | undefined;
  /**
   * Priority ordering used for queue sorting and select options.
   */
  readonly priorityOrder?: readonly SupportTicketPriority[] | undefined;
  /**
   * Ticket status transitions applied by admin actions.
   */
  readonly statusTransitions?: SupportAdminStatusTransitions | undefined;
  /**
   * Returns whether a ticket is considered resolved.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly isTicketResolved?: ((ticket: SupportTicket) => boolean) | undefined;
  /**
   * Returns the button variant for a ticket in the queue.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly getTicketQueueButtonVariant?:
    | ((ticket: SupportTicket) => MessageButton['variant'])
    | undefined;
  /**
   * Returns live chat queue button variant.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly getLiveChatQueueButtonVariant?:
    | ((session: SupportLiveChatSession) => MessageButton['variant'])
    | undefined;
  /**
   * Returns assigned work filter.
   *
   * @param context - Context available to the callback.
   */
  readonly getAssignedWorkFilter?:
    | ((context: {
        /**
         * Support agent identity used by this flow or helper.
         */
        readonly agent: SupportAgentIdentity;
        /**
         * Display label for the support agent in generated messages.
         */
        readonly agentLabel: string;
      }) => SupportQueueFilter)
    | undefined;
  /**
   * Returns the queue position after a live chat is requeued.
   *
   * @param context - Context available to the callback.
   */
  readonly getRequeuedLiveChatPosition?:
    | ((context: {
        /**
         * Live-chat session handled by this flow or helper.
         */
        readonly session: SupportLiveChatSession;
        /**
         * Live-chat sessions waiting in the queue.
         */
        readonly queuedSessions: readonly SupportLiveChatSession[];
      }) => number)
    | undefined;
  /**
   * Returns the estimated wait after a live chat is requeued.
   *
   * @param context - Context available to the callback.
   */
  readonly getRequeuedLiveChatEstimatedWaitMinutes?:
    | ((context: {
        /**
         * Live-chat session handled by this flow or helper.
         */
        readonly session: SupportLiveChatSession;
        /**
         * Live-chat sessions waiting in the queue.
         */
        readonly queuedSessions: readonly SupportLiveChatSession[];
        /**
         * Position of the live-chat session in the queue.
         */
        readonly queuePosition: number;
      }) => number)
    | undefined;
}

/**
 * Queue surfaces that can expose admin ticket filters.
 */
export type SupportAdminTicketQueueFilterSlot =
  | 'ticket-queue'
  | 'assigned-work';

/**
 * Context passed to filter resolvers for the support admin ticket queue.
 */
export interface SupportAdminTicketQueueFilterContext {
  /**
   * Support agent identity used by this flow or helper.
   */
  readonly agent: SupportAgentIdentity;
  /**
   * Display label for the support agent in generated messages.
   */
  readonly agentLabel: string;
  /**
   * Button slot where the override is applied.
   */
  readonly slot: SupportAdminTicketQueueFilterSlot;
  /**
   * Base filter applied before user-selected filters are resolved.
   */
  readonly baseFilter?: SupportQueueFilter | undefined;
}

/**
 * Filter option supported by the support admin ticket queue.
 */
export interface SupportAdminTicketQueueFilterOption extends SupportListFilterOption {
  /**
   * Handles filter.
   *
   * @param context - Context available to the callback.
   */
  readonly filter?:
    | SupportQueueFilter
    | ((
        context: SupportAdminTicketQueueFilterContext
      ) => SupportQueueFilter | undefined)
    | undefined;
  /**
   * Handles predicate.
   *
   * @param ticket - Support ticket to inspect or render.
   * @param context - Context available to the callback.
   */
  readonly predicate?:
    | ((
        ticket: SupportTicket,
        context: SupportAdminTicketQueueFilterContext
      ) => boolean)
    | undefined;
}

/**
 * Context passed to filter resolvers for the support admin live chat queue.
 */
export interface SupportAdminLiveChatQueueFilterContext {
  /**
   * Support agent identity used by this flow or helper.
   */
  readonly agent: SupportAgentIdentity;
  /**
   * Display label for the support agent in generated messages.
   */
  readonly agentLabel: string;
}

/**
 * Filter option supported by the support admin live chat queue.
 */
export interface SupportAdminLiveChatQueueFilterOption extends SupportListFilterOption {
  /**
   * Handles filter.
   *
   * @param context - Context available to the callback.
   */
  readonly filter?:
    | SupportLiveChatQueueFilter
    | ((
        context: SupportAdminLiveChatQueueFilterContext
      ) => SupportLiveChatQueueFilter | undefined)
    | undefined;
  /**
   * Handles predicate.
   *
   * @param session - Live chat session to inspect or render.
   * @param context - Context available to the callback.
   */
  readonly predicate?:
    | ((
        session: SupportLiveChatSession,
        context: SupportAdminLiveChatQueueFilterContext
      ) => boolean)
    | undefined;
}

/**
 * Filter-option groups supported by the support admin flow.
 */
export interface SupportAdminFlowFilterOptions {
  /**
   * Filter option settings for the ticket queue view.
   */
  readonly ticketQueue?:
    | readonly SupportAdminTicketQueueFilterOption[]
    | undefined;
  /**
   * Filter option settings for the assigned work view.
   */
  readonly assignedWork?:
    | readonly SupportAdminTicketQueueFilterOption[]
    | undefined;
  /**
   * Filter option settings for the live chat queue view.
   */
  readonly liveChatQueue?:
    | readonly SupportAdminLiveChatQueueFilterOption[]
    | undefined;
}

/**
 * Button customization slot names emitted by the support admin flow.
 */
export type SupportAdminFlowButtonSlot =
  | 'primary'
  | 'ticket'
  | 'ticket-queue'
  | 'assigned-work'
  | 'live-chat'
  | 'live-chat-queue'
  | 'live-chat-persistent';

/**
 * Context passed to button customizers for the support admin flow.
 */
export interface SupportAdminFlowButtonContext {
  /**
   * Button slot where the override is applied.
   */
  readonly slot: SupportAdminFlowButtonSlot;
  /**
   * Default buttons available before customization is applied.
   */
  readonly defaultButtons: readonly MessageButton[];
  /**
   * Support agent identity used by this flow or helper.
   */
  readonly agent: SupportAgentIdentity;
  /**
   * Display label for the support agent in generated messages.
   */
  readonly agentLabel: string;
  /**
   * Support tickets in the current list or queue.
   */
  readonly tickets?: readonly SupportTicket[] | undefined;
  /**
   * Support tickets visible on the current page.
   */
  readonly visibleTickets?: readonly SupportTicket[] | undefined;
  /**
   * One-based page number currently being rendered.
   */
  readonly currentPage?: number | undefined;
  /**
   * Total number of pages available.
   */
  readonly pageCount?: number | undefined;
  /**
   * Number of items shown per page.
   */
  readonly pageSize?: number | undefined;
  /**
   * Total number of support tickets before pagination.
   */
  readonly totalTickets?: number | undefined;
  /**
   * Whether another ticket page is available after the current page.
   */
  readonly hasMoreTickets?: boolean | undefined;
  /**
   * Whether totalTickets is the exact total rather than a lower bound.
   */
  readonly isTotalTicketsExact?: boolean | undefined;
  /**
   * Identifier for the currently selected filter option.
   */
  readonly activeFilterId?: string | undefined;
  /**
   * Display label for the currently selected filter option.
   */
  readonly activeFilterLabel?: string | undefined;
  /**
   * Filter options available for the current list.
   */
  readonly filterOptions?: readonly SupportListFilterOption[] | undefined;
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket?: SupportTicket | undefined;
  /**
   * Live-chat sessions in the current list or queue.
   */
  readonly sessions?: readonly SupportLiveChatSession[] | undefined;
  /**
   * Live-chat sessions visible on the current page.
   */
  readonly visibleSessions?: readonly SupportLiveChatSession[] | undefined;
  /**
   * Total number of live-chat sessions before pagination.
   */
  readonly totalSessions?: number | undefined;
  /**
   * Live-chat session handled by this flow or helper.
   */
  readonly session?: SupportLiveChatSession | undefined;
}

/**
 * Hook signature for customizing admin support buttons.
 */
export type SupportAdminFlowButtonCustomizer =
  SupportButtonCustomizer<SupportAdminFlowButtonContext>;

/**
 * Configuration for creating the support admin flow.
 */
export interface SupportAdminFlowConfig {
  /**
   * Support adapter used to fetch and persist support state.
   */
  readonly adapter?: SupportFlowAdapter | undefined;
  /**
   * Callback-backed service implementations provided by the consumer.
   */
  readonly callbacks?: SupportAdminFlowCallbacks | undefined;
  /**
   * Support agent identity used by this flow or helper.
   */
  readonly agent: SupportAgentIdentity;
  /**
   * Brand or workspace name shown in generated flow messages.
   */
  readonly brandName?: string | undefined;
  /**
   * Initial message shown when the flow starts.
   */
  readonly initialMessage?: string | undefined;
  /**
   * Validation settings applied while collecting input.
   */
  readonly validation?: SupportAdminFlowValidationConfig | undefined;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels?: Partial<SupportAdminFlowLabels> | undefined;
  /**
   * Request-input override settings used by the flow.
   */
  readonly requestInputs?: SupportAdminFlowRequestInputs | undefined;
  /**
   * Confirmation-button override settings used by the flow.
   */
  readonly confirmations?: SupportAdminFlowConfirmations | undefined;
  /**
   * Formatter overrides used by this flow or helper.
   */
  readonly formatters?: SupportAdminFlowFormatters | undefined;
  /**
   * Filter options available for the current list.
   */
  readonly filterOptions?: SupportAdminFlowFilterOptions | undefined;
  /**
   * Input behavior settings applied by the flow.
   */
  readonly behavior?: SupportAdminFlowBehavior | undefined;
  /**
   * Hook used to customize admin flow buttons before rendering.
   */
  readonly customizeButtons?: SupportAdminFlowButtonCustomizer | undefined;
  /**
   * Persistent live-chat buttons rendered by the flow.
   */
  readonly liveChatPersistentButtons?:
    | SupportAdminLiveChatPersistentButtonFactory
    | undefined;
}

/**
 * Runtime API returned by the admin support flow factory.
 */
export type SupportAdminFlow = SupportFlowBase;

/**
 * Context passed to admin live chat persistent button factories.
 */
export interface SupportAdminLiveChatPersistentButtonContext {
  /**
   * Live-chat session handled by this flow or helper.
   */
  readonly session: SupportLiveChatSession;
  /**
   * Support agent identity used by this flow or helper.
   */
  readonly agent: SupportAgentIdentity;
  /**
   * Service used to end a live-chat session.
   */
  readonly endLiveChat: () => void;
  /**
   * Refresh button or refresh action used by the flow.
   */
  readonly refresh: () => void;
}

/**
 * Factory signature for admin live chat persistent buttons.
 *
 * @param context - Context object available to this resolver.
 */
export type SupportAdminLiveChatPersistentButtonFactory = (
  context: SupportAdminLiveChatPersistentButtonContext
) => readonly MessageButton[];
