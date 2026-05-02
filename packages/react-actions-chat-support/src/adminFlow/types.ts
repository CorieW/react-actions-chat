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

export interface SupportAdminFlowLabels {
  readonly viewTicketQueue: string;
  readonly viewLiveChatQueue: string;
  readonly reviewTicket: string;
  readonly myAssignedWork: string;
  readonly previousTickets: string;
  readonly nextTickets: string;
  readonly previousLiveChats: string;
  readonly nextLiveChats: string;
  readonly backToAdminOptions: string;
  readonly backToLiveChatQueue: string;
  readonly refreshTicketQueue: string;
  readonly refreshLiveChats: string;
  readonly refreshChat: string;
  readonly endLiveChat: string;
  readonly joinLiveChat: string;
  readonly leaveLiveChat: string;
  readonly assignToMe: string;
  readonly assignedToMe: string;
  readonly assignToAgent: string;
  readonly setPriority: string;
  readonly setPriorityPrompt: (ticket: SupportTicket) => string;
  readonly setPriorityPlaceholder: string;
  readonly setPriorityDescription: string;
  readonly viewFullActivity: string;
  readonly replyToCustomer: string;
  readonly reopenTicket: string;
  readonly resolveTicket: string;
  readonly resolveConfirm: string;
  readonly resolveReject: string;
  readonly liveChatReplyPlaceholder: string;
  readonly liveChatReplyDescription: (
    session: SupportLiveChatSession
  ) => string;
}

export interface SupportAdminTicketInputContext {
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
  readonly ticket: SupportTicket;
}

export interface SupportAdminReviewTicketInputContext {
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
}

export interface SupportAdminFlowRequestInputs {
  readonly reviewTicket?:
    | SupportRequestInputButtonOverrides<SupportAdminReviewTicketInputContext>
    | undefined;
  readonly assignTicket?:
    | SupportRequestInputButtonOverrides<SupportAdminTicketInputContext>
    | undefined;
  readonly replyToCustomer?:
    | SupportRequestInputButtonOverrides<SupportAdminTicketInputContext>
    | undefined;
  readonly setPriority?:
    | SupportRequestInputButtonOverrides<SupportAdminTicketInputContext>
    | undefined;
}

export interface SupportAdminFlowConfirmations {
  readonly resolveTicket?:
    | SupportConfirmationButtonOverrides<SupportAdminTicketInputContext>
    | undefined;
}

export interface SupportAdminFlowCapabilities {
  readonly canListTicketQueue: boolean;
  readonly canListLiveChatQueue: boolean;
  readonly canGetTicket: boolean;
  readonly canUpdateTicket: boolean;
  readonly canAppendTicketMessage: boolean;
  readonly canGetLiveChat: boolean;
  readonly canUpdateLiveChat: boolean;
  readonly canAppendLiveChatMessage: boolean;
  readonly canOpenLiveChatQueue: boolean;
}

export interface SupportAdminFormatterContext {
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
  readonly brandName: string;
  readonly labels: SupportAdminFlowLabels;
  readonly capabilities: SupportAdminFlowCapabilities;
  readonly queueLimit: number;
  readonly liveChatQueueLimit: number;
  readonly assignedWorkLimit: number;
  readonly recentActivityLimit: number;
  readonly transcriptLimit: number;
}

export interface SupportAdminTicketFormatterContext extends SupportAdminFormatterContext {
  readonly ticket: SupportTicket;
}

export interface SupportAdminTicketsFormatterContext extends SupportAdminFormatterContext {
  readonly tickets: readonly SupportTicket[];
  readonly visibleTickets?: readonly SupportTicket[] | undefined;
  readonly currentPage?: number | undefined;
  readonly pageCount?: number | undefined;
  readonly pageSize?: number | undefined;
  readonly totalTickets?: number | undefined;
  readonly activeFilterId?: string | undefined;
  readonly activeFilterLabel?: string | undefined;
  readonly filterOptions?:
    | readonly SupportAdminTicketQueueFilterOption[]
    | undefined;
}

export interface SupportAdminLiveChatFormatterContext extends SupportAdminFormatterContext {
  readonly session: SupportLiveChatSession;
}

export interface SupportAdminLiveChatsFormatterContext extends SupportAdminFormatterContext {
  readonly sessions: readonly SupportLiveChatSession[];
  readonly visibleSessions?: readonly SupportLiveChatSession[] | undefined;
  readonly currentPage?: number | undefined;
  readonly pageCount?: number | undefined;
  readonly pageSize?: number | undefined;
  readonly totalSessions?: number | undefined;
  readonly activeFilterId?: string | undefined;
  readonly activeFilterLabel?: string | undefined;
  readonly filterOptions?:
    | readonly SupportAdminLiveChatQueueFilterOption[]
    | undefined;
}

export interface SupportAdminFlowFormatters {
  readonly openingMessage?:
    | ((context: SupportAdminFormatterContext) => string)
    | undefined;
  readonly ticketDetails?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  readonly ticketFullActivity?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  readonly ticketQueue?:
    | ((context: SupportAdminTicketsFormatterContext) => string)
    | undefined;
  readonly liveChatQueue?:
    | ((context: SupportAdminLiveChatsFormatterContext) => string)
    | undefined;
  readonly liveChatDetails?:
    | ((context: SupportAdminLiveChatFormatterContext) => string)
    | undefined;
  readonly liveChatEnded?:
    | ((context: SupportAdminLiveChatFormatterContext) => string)
    | undefined;
  readonly liveChatJoined?:
    | ((context: SupportAdminLiveChatFormatterContext) => string)
    | undefined;
  readonly liveChatLeft?:
    | ((context: SupportAdminLiveChatFormatterContext) => string)
    | undefined;
  readonly ticketAssigned?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  readonly ticketPriorityChanged?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  readonly ticketReplySent?:
    | ((
        context: SupportAdminTicketFormatterContext & {
          readonly body: string;
        }
      ) => string)
    | undefined;
  readonly ticketReopened?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  readonly ticketResolved?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
}

export interface SupportAdminStatusTransitions {
  readonly assignedTicketStatus?: SupportTicketStatus | undefined;
  readonly repliedTicketStatus?: SupportTicketStatus | undefined;
  readonly reopenedTicketStatus?: SupportTicketStatus | undefined;
  readonly resolvedTicketStatus?: SupportTicketStatus | undefined;
}

export interface SupportAdminFlowBehavior {
  readonly queueLimit?: number | undefined;
  readonly liveChatQueueLimit?: number | undefined;
  readonly assignedWorkLimit?: number | undefined;
  readonly recentActivityLimit?: number | undefined;
  readonly transcriptLimit?: number | undefined;
  readonly priorityOrder?: readonly SupportTicketPriority[] | undefined;
  readonly statusTransitions?: SupportAdminStatusTransitions | undefined;
  readonly isTicketResolved?: ((ticket: SupportTicket) => boolean) | undefined;
  readonly getTicketQueueButtonVariant?:
    | ((ticket: SupportTicket) => MessageButton['variant'])
    | undefined;
  readonly getLiveChatQueueButtonVariant?:
    | ((session: SupportLiveChatSession) => MessageButton['variant'])
    | undefined;
  readonly getAssignedWorkFilter?:
    | ((context: {
        readonly agent: SupportAgentIdentity;
        readonly agentLabel: string;
      }) => SupportQueueFilter)
    | undefined;
  readonly getRequeuedLiveChatPosition?:
    | ((context: {
        readonly session: SupportLiveChatSession;
        readonly queuedSessions: readonly SupportLiveChatSession[];
      }) => number)
    | undefined;
  readonly getRequeuedLiveChatEstimatedWaitMinutes?:
    | ((context: {
        readonly session: SupportLiveChatSession;
        readonly queuedSessions: readonly SupportLiveChatSession[];
        readonly queuePosition: number;
      }) => number)
    | undefined;
}

export type SupportAdminTicketQueueFilterSlot =
  | 'ticket-queue'
  | 'assigned-work';

export interface SupportAdminTicketQueueFilterContext {
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
  readonly slot: SupportAdminTicketQueueFilterSlot;
  readonly baseFilter?: SupportQueueFilter | undefined;
}

export interface SupportAdminTicketQueueFilterOption extends SupportListFilterOption {
  readonly filter?:
    | SupportQueueFilter
    | ((
        context: SupportAdminTicketQueueFilterContext
      ) => SupportQueueFilter | undefined)
    | undefined;
  readonly predicate?:
    | ((
        ticket: SupportTicket,
        context: SupportAdminTicketQueueFilterContext
      ) => boolean)
    | undefined;
}

export interface SupportAdminLiveChatQueueFilterContext {
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
}

export interface SupportAdminLiveChatQueueFilterOption extends SupportListFilterOption {
  readonly filter?:
    | SupportLiveChatQueueFilter
    | ((
        context: SupportAdminLiveChatQueueFilterContext
      ) => SupportLiveChatQueueFilter | undefined)
    | undefined;
  readonly predicate?:
    | ((
        session: SupportLiveChatSession,
        context: SupportAdminLiveChatQueueFilterContext
      ) => boolean)
    | undefined;
}

export interface SupportAdminFlowFilterOptions {
  readonly ticketQueue?:
    | readonly SupportAdminTicketQueueFilterOption[]
    | undefined;
  readonly assignedWork?:
    | readonly SupportAdminTicketQueueFilterOption[]
    | undefined;
  readonly liveChatQueue?:
    | readonly SupportAdminLiveChatQueueFilterOption[]
    | undefined;
}

export type SupportAdminFlowButtonSlot =
  | 'primary'
  | 'ticket'
  | 'ticket-queue'
  | 'assigned-work'
  | 'live-chat'
  | 'live-chat-queue'
  | 'live-chat-persistent';

export interface SupportAdminFlowButtonContext {
  readonly slot: SupportAdminFlowButtonSlot;
  readonly defaultButtons: readonly MessageButton[];
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
  readonly tickets?: readonly SupportTicket[] | undefined;
  readonly visibleTickets?: readonly SupportTicket[] | undefined;
  readonly currentPage?: number | undefined;
  readonly pageCount?: number | undefined;
  readonly pageSize?: number | undefined;
  readonly totalTickets?: number | undefined;
  readonly activeFilterId?: string | undefined;
  readonly activeFilterLabel?: string | undefined;
  readonly filterOptions?: readonly SupportListFilterOption[] | undefined;
  readonly ticket?: SupportTicket | undefined;
  readonly sessions?: readonly SupportLiveChatSession[] | undefined;
  readonly visibleSessions?: readonly SupportLiveChatSession[] | undefined;
  readonly totalSessions?: number | undefined;
  readonly session?: SupportLiveChatSession | undefined;
}

export type SupportAdminFlowButtonCustomizer =
  SupportButtonCustomizer<SupportAdminFlowButtonContext>;

export interface SupportAdminFlowConfig {
  readonly adapter?: SupportFlowAdapter | undefined;
  readonly callbacks?: SupportAdminFlowCallbacks | undefined;
  readonly agent: SupportAgentIdentity;
  readonly brandName?: string | undefined;
  readonly initialMessage?: string | undefined;
  readonly validation?: SupportAdminFlowValidationConfig | undefined;
  readonly labels?: Partial<SupportAdminFlowLabels> | undefined;
  readonly requestInputs?: SupportAdminFlowRequestInputs | undefined;
  readonly confirmations?: SupportAdminFlowConfirmations | undefined;
  readonly formatters?: SupportAdminFlowFormatters | undefined;
  readonly filterOptions?: SupportAdminFlowFilterOptions | undefined;
  readonly behavior?: SupportAdminFlowBehavior | undefined;
  readonly customizeButtons?: SupportAdminFlowButtonCustomizer | undefined;
  readonly liveChatPersistentButtons?:
    | SupportAdminLiveChatPersistentButtonFactory
    | undefined;
}

export type SupportAdminFlow = SupportFlowBase;

export interface SupportAdminLiveChatPersistentButtonContext {
  readonly session: SupportLiveChatSession;
  readonly agent: SupportAgentIdentity;
  readonly endLiveChat: () => void;
  readonly refresh: () => void;
}

export type SupportAdminLiveChatPersistentButtonFactory = (
  context: SupportAdminLiveChatPersistentButtonContext
) => readonly MessageButton[];
