import type { MessageButton } from 'react-actions-chat';
import type {
  SupportButtonCustomizer,
  SupportFlowAdapter,
  SupportFlowBase,
  SupportListFilterOption,
  SupportLiveChatSession,
  SupportRequestInputButtonOverrides,
  SupportTicket,
  SupportUserFlowCallbacks,
  SupportUserFlowValidationConfig,
  SupportUserIdentity,
} from '../supportFlowTypes';

/**
 * Defaultable label contract for the support customer flow.
 */
export interface SupportUserFlowLabels {
  /**
   * Label text for the start ticket action or state.
   */
  readonly startTicket: string;
  /**
   * Service used to start a live-chat session.
   */
  readonly startLiveChat: string;
  /**
   * Label text for the view tickets action or state.
   */
  readonly viewTickets: string;
  /**
   * Button used to navigate to the previous ticket page.
   */
  readonly previousTickets: string;
  /**
   * Next tickets value used by this contract.
   */
  readonly nextTickets: string;
  /**
   * Label text for the refresh status action or state.
   */
  readonly refreshStatus: string;
  /**
   * Button used to show the full ticket activity.
   */
  readonly viewFullActivity: string;
  /**
   * Label text for the add detail action or state.
   */
  readonly addDetail: string;
  /**
   * Label text for the back to support options action or state.
   */
  readonly backToSupportOptions: string;
  /**
   * Button used to refresh the live-chat view.
   */
  readonly refreshChat: string;
  /**
   * Service used to end a live-chat session.
   */
  readonly endLiveChat: string;
  /**
   * Label text for the live chat message placeholder action or state.
   */
  readonly liveChatMessagePlaceholder: string;
  /**
   * Label text for the live chat message description action or state.
   */
  readonly liveChatMessageDescription: string;
  /**
   * Label text for the live chat waiting placeholder action or state.
   */
  readonly liveChatWaitingPlaceholder: string;
  /**
   * Label text for the live chat waiting description action or state.
   */
  readonly liveChatWaitingDescription: string;
}

/**
 * Context passed to request-input overrides for the support user create ticket.
 */
export interface SupportUserCreateTicketInputContext {
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
}

/**
 * Context passed to request-input overrides for the support customer ticket.
 */
export interface SupportUserTicketInputContext {
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket: SupportTicket;
}

/**
 * Context passed to request-input overrides for the support user live chat.
 */
export interface SupportUserLiveChatInputContext {
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
}

/**
 * Request-input customization slots for the support customer flow.
 */
export interface SupportUserFlowRequestInputs {
  /**
   * Service used to create a support ticket.
   */
  readonly createTicket?:
    | SupportRequestInputButtonOverrides<SupportUserCreateTicketInputContext>
    | undefined;
  /**
   * Request-input overrides for the add ticket detail action.
   */
  readonly addTicketDetail?:
    | SupportRequestInputButtonOverrides<SupportUserTicketInputContext>
    | undefined;
  /**
   * Service used to start a live-chat session.
   */
  readonly startLiveChat?:
    | SupportRequestInputButtonOverrides<SupportUserLiveChatInputContext>
    | undefined;
}

/**
 * Shared formatter context for customer support messages.
 */
export interface SupportUserFormatterContext {
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
  /**
   * Brand or workspace name shown in generated flow messages.
   */
  readonly brandName: string;
  /**
   * Maximum number of recent activity entries included in formatted output.
   */
  readonly recentActivityLimit?: number | undefined;
  /**
   * Maximum number of customer tickets shown in the flow.
   */
  readonly ticketListLimit?: number | undefined;
}

/**
 * Formatter context for customer ticket detail messages.
 */
export interface SupportUserTicketFormatterContext extends SupportUserFormatterContext {
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket: SupportTicket;
}

/**
 * Formatter context for customer ticket list messages.
 */
export interface SupportUserTicketsFormatterContext extends SupportUserFormatterContext {
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
  readonly filterOptions?: readonly SupportUserTicketFilterOption[] | undefined;
}

/**
 * Formatter context for customer live chat messages.
 */
export interface SupportUserLiveChatFormatterContext extends SupportUserFormatterContext {
  /**
   * Live-chat session handled by this flow or helper.
   */
  readonly session: SupportLiveChatSession;
}

/**
 * Formatter overrides for messages produced by the support customer flow.
 */
export interface SupportUserFlowFormatters {
  /**
   * Handles opening message.
   *
   * @param context - Context available to the callback.
   */
  readonly openingMessage?:
    | ((context: SupportUserFormatterContext) => string)
    | undefined;
  /**
   * Handles ticket summary.
   *
   * @param context - Context available to the callback.
   */
  readonly ticketSummary?:
    | ((context: SupportUserTicketFormatterContext) => string)
    | undefined;
  /**
   * Handles ticket full activity.
   *
   * @param context - Context available to the callback.
   */
  readonly ticketFullActivity?:
    | ((context: SupportUserTicketFormatterContext) => string)
    | undefined;
  /**
   * Handles ticket list.
   *
   * @param context - Context available to the callback.
   */
  readonly ticketList?:
    | ((context: SupportUserTicketsFormatterContext) => string)
    | undefined;
  /**
   * Handles ticket created.
   *
   * @param context - Context available to the callback.
   */
  readonly ticketCreated?:
    | ((context: SupportUserTicketFormatterContext) => string)
    | undefined;
  /**
   * Handles ticket detail added.
   *
   * @param context - Context available to the callback.
   */
  readonly ticketDetailAdded?:
    | ((
        context: SupportUserTicketFormatterContext & {
          /**
           * Detail formatter or detail content used by the flow.
           */
          readonly detail: string;
        }
      ) => string)
    | undefined;
  /**
   * Handles live chat details.
   *
   * @param context - Context available to the callback.
   */
  readonly liveChatDetails?:
    | ((context: SupportUserLiveChatFormatterContext) => string)
    | undefined;
  /**
   * Handles live chat ended.
   *
   * @param context - Context available to the callback.
   */
  readonly liveChatEnded?:
    | ((context: SupportUserLiveChatFormatterContext) => string)
    | undefined;
}

/**
 * Behavior overrides for the support customer flow.
 */
export interface SupportUserFlowBehavior {
  /**
   * Maximum number of recent activity entries included in formatted output.
   */
  readonly recentActivityLimit?: number | undefined;
  /**
   * Maximum number of customer tickets shown in the flow.
   */
  readonly ticketListLimit?: number | undefined;
  /**
   * Returns whether a live chat is still open.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly isOpenLiveChat?:
    | ((session: SupportLiveChatSession) => boolean)
    | undefined;
  /**
   * Returns whether the customer can send a live chat message.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly canSendLiveChatMessage?:
    | ((session: SupportLiveChatSession) => boolean)
    | undefined;
}

/**
 * Context passed to filter resolvers for the support customer ticket.
 */
export interface SupportUserTicketFilterContext {
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
}

/**
 * Filter option supported by the support customer ticket.
 */
export interface SupportUserTicketFilterOption extends SupportListFilterOption {
  /**
   * Handles predicate.
   *
   * @param ticket - Support ticket to inspect or render.
   * @param context - Context available to the callback.
   */
  readonly predicate?:
    | ((
        ticket: SupportTicket,
        context: SupportUserTicketFilterContext
      ) => boolean)
    | undefined;
}

/**
 * Filter-option groups supported by the support customer flow.
 */
export interface SupportUserFlowFilterOptions {
  /**
   * Support tickets in the current list or queue.
   */
  readonly tickets?: readonly SupportUserTicketFilterOption[] | undefined;
}

/**
 * Button customization slot names emitted by the support customer flow.
 */
export type SupportUserFlowButtonSlot =
  | 'primary'
  | 'ticket'
  | 'ticket-list'
  | 'live-chat-active'
  | 'live-chat-waiting'
  | 'live-chat-ended'
  | 'live-chat-persistent';

/**
 * Context passed to button customizers for the support customer flow.
 */
export interface SupportUserFlowButtonContext {
  /**
   * Button slot where the override is applied.
   */
  readonly slot: SupportUserFlowButtonSlot;
  /**
   * Default buttons available before customization is applied.
   */
  readonly defaultButtons: readonly MessageButton[];
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
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
   * Live-chat session handled by this flow or helper.
   */
  readonly session?: SupportLiveChatSession | undefined;
}

/**
 * Hook signature for customizing customer support buttons.
 */
export type SupportUserFlowButtonCustomizer =
  SupportButtonCustomizer<SupportUserFlowButtonContext>;

/**
 * Configuration for creating the support customer flow.
 */
export interface SupportUserFlowConfig {
  /**
   * Support adapter used to fetch and persist support state.
   */
  readonly adapter?: SupportFlowAdapter | undefined;
  /**
   * Callback-backed service implementations provided by the consumer.
   */
  readonly callbacks?: SupportUserFlowCallbacks | undefined;
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
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
  readonly validation?: SupportUserFlowValidationConfig | undefined;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels?: Partial<SupportUserFlowLabels> | undefined;
  /**
   * Request-input override settings used by the flow.
   */
  readonly requestInputs?: SupportUserFlowRequestInputs | undefined;
  /**
   * Formatter overrides used by this flow or helper.
   */
  readonly formatters?: SupportUserFlowFormatters | undefined;
  /**
   * Filter options available for the current list.
   */
  readonly filterOptions?: SupportUserFlowFilterOptions | undefined;
  /**
   * Input behavior settings applied by the flow.
   */
  readonly behavior?: SupportUserFlowBehavior | undefined;
  /**
   * Hook used to customize customer flow buttons before rendering.
   */
  readonly customizeButtons?: SupportUserFlowButtonCustomizer | undefined;
  /**
   * Persistent live-chat buttons rendered by the flow.
   */
  readonly liveChatPersistentButtons?:
    | SupportUserLiveChatPersistentButtonFactory
    | undefined;
}

/**
 * Runtime API returned by the customer support flow factory.
 */
export type SupportUserFlow = SupportFlowBase;

/**
 * Context passed to customer live chat persistent button factories.
 */
export interface SupportUserLiveChatPersistentButtonContext {
  /**
   * Live-chat session handled by this flow or helper.
   */
  readonly session: SupportLiveChatSession;
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
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
 * Factory signature for customer live chat persistent buttons.
 *
 * @param context - Context object available to this resolver.
 */
export type SupportUserLiveChatPersistentButtonFactory = (
  context: SupportUserLiveChatPersistentButtonContext
) => readonly MessageButton[];

/**
 * Initial customer ticket list state, including whether async loading is pending.
 */
export interface InitialTicketListState {
  /**
   * Support tickets in the current list or queue.
   */
  readonly tickets: readonly SupportTicket[];
  /**
   * Whether pending is true.
   */
  readonly isPending: boolean;
}
