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

export interface SupportUserFlowLabels {
  readonly startTicket: string;
  readonly startLiveChat: string;
  readonly viewTickets: string;
  readonly previousTickets: string;
  readonly nextTickets: string;
  readonly refreshStatus: string;
  readonly viewFullActivity: string;
  readonly addDetail: string;
  readonly backToSupportOptions: string;
  readonly refreshChat: string;
  readonly endLiveChat: string;
  readonly liveChatMessagePlaceholder: string;
  readonly liveChatMessageDescription: string;
  readonly liveChatWaitingPlaceholder: string;
  readonly liveChatWaitingDescription: string;
}

export interface SupportUserCreateTicketInputContext {
  readonly customer: SupportUserIdentity;
}

export interface SupportUserTicketInputContext {
  readonly customer: SupportUserIdentity;
  readonly ticket: SupportTicket;
}

export interface SupportUserLiveChatInputContext {
  readonly customer: SupportUserIdentity;
}

export interface SupportUserFlowRequestInputs {
  readonly createTicket?:
    | SupportRequestInputButtonOverrides<SupportUserCreateTicketInputContext>
    | undefined;
  readonly addTicketDetail?:
    | SupportRequestInputButtonOverrides<SupportUserTicketInputContext>
    | undefined;
  readonly startLiveChat?:
    | SupportRequestInputButtonOverrides<SupportUserLiveChatInputContext>
    | undefined;
}

export interface SupportUserFormatterContext {
  readonly customer: SupportUserIdentity;
  readonly brandName: string;
  readonly recentActivityLimit: number;
  readonly ticketListLimit: number;
}

export interface SupportUserTicketFormatterContext extends SupportUserFormatterContext {
  readonly ticket: SupportTicket;
}

export interface SupportUserTicketsFormatterContext extends SupportUserFormatterContext {
  readonly tickets: readonly SupportTicket[];
  readonly visibleTickets?: readonly SupportTicket[] | undefined;
  readonly currentPage?: number | undefined;
  readonly pageCount?: number | undefined;
  readonly pageSize?: number | undefined;
  readonly totalTickets?: number | undefined;
  readonly activeFilterId?: string | undefined;
  readonly activeFilterLabel?: string | undefined;
  readonly filterOptions?: readonly SupportUserTicketFilterOption[] | undefined;
}

export interface SupportUserLiveChatFormatterContext extends SupportUserFormatterContext {
  readonly session: SupportLiveChatSession;
}

export interface SupportUserFlowFormatters {
  readonly openingMessage?:
    | ((context: SupportUserFormatterContext) => string)
    | undefined;
  readonly ticketSummary?:
    | ((context: SupportUserTicketFormatterContext) => string)
    | undefined;
  readonly ticketFullActivity?:
    | ((context: SupportUserTicketFormatterContext) => string)
    | undefined;
  readonly ticketList?:
    | ((context: SupportUserTicketsFormatterContext) => string)
    | undefined;
  readonly ticketCreated?:
    | ((context: SupportUserTicketFormatterContext) => string)
    | undefined;
  readonly ticketDetailAdded?:
    | ((
        context: SupportUserTicketFormatterContext & {
          readonly detail: string;
        }
      ) => string)
    | undefined;
  readonly liveChatDetails?:
    | ((context: SupportUserLiveChatFormatterContext) => string)
    | undefined;
  readonly liveChatEnded?:
    | ((context: SupportUserLiveChatFormatterContext) => string)
    | undefined;
}

export interface SupportUserFlowBehavior {
  readonly recentActivityLimit?: number | undefined;
  readonly ticketListLimit?: number | undefined;
  readonly isOpenLiveChat?:
    | ((session: SupportLiveChatSession) => boolean)
    | undefined;
  readonly canSendLiveChatMessage?:
    | ((session: SupportLiveChatSession) => boolean)
    | undefined;
}

export interface SupportUserTicketFilterContext {
  readonly customer: SupportUserIdentity;
}

export interface SupportUserTicketFilterOption extends SupportListFilterOption {
  readonly predicate?:
    | ((
        ticket: SupportTicket,
        context: SupportUserTicketFilterContext
      ) => boolean)
    | undefined;
}

export interface SupportUserFlowFilterOptions {
  readonly tickets?: readonly SupportUserTicketFilterOption[] | undefined;
}

export type SupportUserFlowButtonSlot =
  | 'primary'
  | 'ticket'
  | 'ticket-list'
  | 'live-chat-active'
  | 'live-chat-waiting'
  | 'live-chat-ended'
  | 'live-chat-persistent';

export interface SupportUserFlowButtonContext {
  readonly slot: SupportUserFlowButtonSlot;
  readonly defaultButtons: readonly MessageButton[];
  readonly customer: SupportUserIdentity;
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
  readonly session?: SupportLiveChatSession | undefined;
}

export type SupportUserFlowButtonCustomizer =
  SupportButtonCustomizer<SupportUserFlowButtonContext>;

export interface SupportUserFlowConfig {
  readonly adapter?: SupportFlowAdapter | undefined;
  readonly callbacks?: SupportUserFlowCallbacks | undefined;
  readonly customer: SupportUserIdentity;
  readonly brandName?: string | undefined;
  readonly initialMessage?: string | undefined;
  readonly validation?: SupportUserFlowValidationConfig | undefined;
  readonly labels?: Partial<SupportUserFlowLabels> | undefined;
  readonly requestInputs?: SupportUserFlowRequestInputs | undefined;
  readonly formatters?: SupportUserFlowFormatters | undefined;
  readonly filterOptions?: SupportUserFlowFilterOptions | undefined;
  readonly behavior?: SupportUserFlowBehavior | undefined;
  readonly customizeButtons?: SupportUserFlowButtonCustomizer | undefined;
  readonly liveChatPersistentButtons?:
    | SupportUserLiveChatPersistentButtonFactory
    | undefined;
}

export type SupportUserFlow = SupportFlowBase;

export interface SupportUserLiveChatPersistentButtonContext {
  readonly session: SupportLiveChatSession;
  readonly customer: SupportUserIdentity;
  readonly endLiveChat: () => void;
  readonly refresh: () => void;
}

export type SupportUserLiveChatPersistentButtonFactory = (
  context: SupportUserLiveChatPersistentButtonContext
) => readonly MessageButton[];

export interface InitialTicketListState {
  readonly tickets: readonly SupportTicket[];
  readonly isPending: boolean;
}
