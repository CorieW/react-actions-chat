import type {
  Message as ChatMessage,
  MessageButton,
  MessagePart,
  RequestInputButtonDefinition,
  RequestInputButtonRuntimeConfig,
} from 'react-actions-chat';

/**
 * Value returned synchronously or through a promise.
 */
export type MaybePromise<TValue> = TValue | Promise<TValue>;

/**
 * Context passed to query recommendation resolvers.
 */
export interface QueryRecommendedActionsContext {
  /**
   * Search query or user request text.
   */
  readonly query: string;
  /**
   * Messages associated with the transcript or support record.
   */
  readonly messages: readonly ChatMessage[];
}

/**
 * A recommended follow-up action shown as a chat button.
 */
export type QueryRecommendedAction = MessageButton;

/**
 * Structured result returned by a query recommendation resolver.
 */
export interface QueryRecommendedActionsResult {
  /**
   * Optional response message shown above the recommended action buttons.
   */
  readonly responseMessage?: string | undefined;

  /**
   * Action buttons recommended for the user's query.
   */
  readonly recommendedActions?: readonly QueryRecommendedAction[] | undefined;
}

/**
 * Normalized result variants accepted from recommendation resolvers.
 */
export type QueryRecommendedActionsResolverResult =
  | QueryRecommendedActionsResult
  | readonly QueryRecommendedAction[]
  | null
  | undefined;

/**
 * Resolves recommended chat actions for a submitted query.
 *
 * @param query - Submitted query text.
 * @param context - Context object available to this resolver.
 */
export type QueryRecommendedActionsResolver = (
  query: string,
  context: QueryRecommendedActionsContext
) => MaybePromise<QueryRecommendedActionsResolverResult>;

/**
 * Builds a flow message from the submitted query.
 *
 * @param query - Submitted query text.
 */
export type FlowMessageResolver = (query: string) => string;

/**
 * Builds an error message from the submitted query and failure.
 *
 * @param query - Submitted query text.
 * @param error - Error thrown while resolving the request.
 */
export type FlowErrorMessageResolver = (
  query: string,
  error: unknown
) => string;

/**
 * Builds loading text from the submitted query.
 *
 * @param query - Submitted query text.
 */
export type FlowLoadingMessageResolver = (query: string) => string;

/**
 * Queued recommendation request waiting for the active lookup to finish.
 */
export interface QueuedRecommendationResolver {
  /**
   * Search query or user request text.
   */
  readonly query: string;
  /**
   * Resolves the queued recommendation request.
   */
  readonly resolve: () => void;
  /**
   * Rejects a queued recommendation request.
   *
   * @param error - Error that caused the failure.
   */
  readonly reject: (error: unknown) => void;
}

/**
 * Message content prepared while a recommendation lookup is resolving.
 */
export interface QueryRecommendedActionsMessageDraft {
  /**
   * Message type used when rendering recommendation responses.
   */
  readonly type: 'other';
  /**
   * Structured message parts rendered for the message.
   */
  readonly parts: readonly MessagePart[];
  /**
   * Buttons rendered for recommended follow-up actions.
   */
  readonly buttons?: readonly QueryRecommendedAction[] | undefined;
}

/**
 * Configuration for the query-based recommended actions flow.
 */
export interface QueryRecommendedActionsFlowConfig
  extends
    Pick<
      RequestInputButtonDefinition,
      | 'abortLabel'
      | 'className'
      | 'cooldownMessage'
      | 'cooldownMs'
      | 'id'
      | 'inputDescription'
      | 'inputTimeoutMessage'
      | 'inputTimeoutMs'
      | 'inputType'
      | 'minMessageLength'
      | 'minMessageLengthMessage'
      | 'placeholder'
      | 'rateLimit'
      | 'showAbort'
      | 'shouldWaitForTurn'
      | 'style'
      | 'suppressValidationFailureMessage'
      | 'validator'
      | 'variant'
    >,
    Pick<RequestInputButtonRuntimeConfig, 'abortCallback' | 'onInvalidInput'> {
  /**
   * Label for the button that starts the flow.
   */
  readonly initialLabel?: string | undefined;

  /**
   * Prompt shown when asking the user for a query.
   */
  readonly queryPromptMessage?: string | undefined;

  /**
   * Optional query normalization step before the resolver runs.
   * Defaults to trimming the submitted query.
   *
   * @param query - Submitted query text.
   */
  readonly normalizeQuery?: ((query: string) => string) | undefined;

  /**
   * Resolves a list of recommended actions for the submitted query.
   */
  readonly getRecommendedActions: QueryRecommendedActionsResolver;

  /**
   * Optional message builder used when recommendations are found and the
   * resolver does not provide a response message directly.
   */
  readonly buildRecommendationsMessage?: FlowMessageResolver | undefined;

  /**
   * Optional message shown when no recommendations are returned.
   */
  readonly emptyStateMessage?: string | FlowMessageResolver | undefined;

  /**
   * Optional message shown when recommendation lookup fails.
   */
  readonly errorMessage?: string | FlowErrorMessageResolver | undefined;

  /**
   * Optional loading indicator text shown while recommendations are being
   * resolved. Defaults to a generic lookup message.
   */
  readonly loadingMessage?: string | FlowLoadingMessageResolver | undefined;

  /**
   * Optional minimum time to keep the loading indicator visible, in
   * milliseconds. Defaults to 0.
   */
  readonly minimumLoadingDurationMs?: number | undefined;

  /**
   * When true, a new query immediately supersedes the current in-flight lookup.
   * Older results are ignored if they finish later.
   */
  readonly cancelInFlightOnNewInput?: boolean | undefined;

  /**
   * When true, additional queries wait their turn instead of running in
   * parallel while a lookup is already in flight.
   */
  readonly queueWhileWaiting?: boolean | undefined;

  /**
   * Optional error callback for custom logging or recovery behavior.
   *
   * @param query - Submitted query text.
   * @param error - Error that caused the failure.
   * @param context - Context available to the callback.
   */
  readonly onError?:
    | undefined
    | ((
        query: string,
        error: unknown,
        context: QueryRecommendedActionsContext
      ) => void);
}

/**
 * Public API returned by the query-based recommended actions flow.
 */
export interface QueryRecommendedActionsFlow {
  /**
   * Button that can be attached to a message.
   */
  readonly button: MessageButton;

  /**
   * Starts the flow programmatically.
   */
  readonly start: () => void;

  /**
   * Resolves recommendations directly from an app-provided query.
   *
   * @param query - Submitted query text.
   */
  readonly recommend: (query: string) => Promise<void>;
}
