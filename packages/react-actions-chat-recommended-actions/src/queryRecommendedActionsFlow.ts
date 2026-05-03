import {
  createButton,
  createRequestInputButtonDef,
  createTextPart,
  getMessageRawText,
  type RequestInputButtonDefinition,
  type RequestInputButtonRuntimeConfig,
  useChatStore,
} from 'react-actions-chat';
import type {
  Message as ChatMessage,
  MessageButton,
  MessagePart,
} from 'react-actions-chat';

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
 * Internal normalized result variants accepted from recommendation resolvers.
 */
type QueryRecommendedActionsResolverResult =
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
) =>
  | QueryRecommendedActionsResolverResult
  | Promise<QueryRecommendedActionsResolverResult>;

/**
 * Builds a flow message from the submitted query.
 *
 * @param query - Submitted query text.
 */
type FlowMessageResolver = (query: string) => string;
/**
 * Builds an error message from the submitted query and failure.
 *
 * @param query - Submitted query text.
 * @param error - Error thrown while resolving the request.
 */
type FlowErrorMessageResolver = (query: string, error: unknown) => string;
/**
 * Builds loading text from the submitted query.
 *
 * @param query - Submitted query text.
 */
type FlowLoadingMessageResolver = (query: string) => string;
/**
 * Queued recommendation request waiting for the active lookup to finish.
 */
type QueuedRecommendationResolver = {
  /**
   * Search query or user request text.
   */
  readonly query: string;
  /**
   * Resolves recommended actions for a query context.
   */
  readonly resolve: () => void;
  /**
   * Rejects a queued recommendation request.
   *
   * @param error - Error that caused the failure.
   */
  readonly reject: (error: unknown) => void;
};

/**
 * Waits for a fixed number of milliseconds.
 *
 * @param durationMs - Duration to wait, in milliseconds.
 */
function wait(durationMs: number): Promise<void> {
  return new Promise(resolve => {
    globalThis.setTimeout(resolve, durationMs);
  });
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

/**
 * Returns whether a resolver result is a direct action array.
 *
 * @param result - Resolver or provider result to normalize.
 */
function isRecommendedActionArray(
  result: QueryRecommendedActionsResolverResult
): result is readonly QueryRecommendedAction[] {
  return Array.isArray(result);
}

/**
 * Creates the recommendation context for a submitted query.
 *
 * @param query - Submitted query text.
 */
function createContext(query: string): QueryRecommendedActionsContext {
  return {
    query,
    messages: useChatStore.getState().getMessages(),
  };
}

/**
 * Normalizes every supported recommendation resolver result shape.
 *
 * @param result - Resolver or provider result to normalize.
 */
function normalizeResolverResult(
  result: QueryRecommendedActionsResolverResult
): QueryRecommendedActionsResult {
  if (!result) {
    return {
      recommendedActions: [],
    };
  }

  if (isRecommendedActionArray(result)) {
    return {
      recommendedActions: result,
    };
  }

  return {
    responseMessage: result.responseMessage,
    recommendedActions: result.recommendedActions ?? [],
  };
}

/**
 * Resolves static or query-derived flow message text.
 *
 * @param query - Submitted query text.
 * @param message - Message to inspect, format, or clone.
 * @param fallback - Fallback text used when no resolver value is provided.
 */
function resolveMessage(
  query: string,
  message: string | FlowMessageResolver | undefined,
  fallback: string
): string {
  if (typeof message === 'function') {
    return message(query);
  }

  return message ?? fallback;
}

/**
 * Resolves loading text for a recommendation lookup.
 *
 * @param query - Submitted query text.
 * @param message - Message to inspect, format, or clone.
 */
function resolveLoadingMessage(
  query: string,
  message: string | FlowLoadingMessageResolver | undefined
): string {
  if (typeof message === 'function') {
    return message(query);
  }

  return message ?? `Finding recommended actions for "${query}"...`;
}

/**
 * Resolves error text for a failed recommendation lookup.
 *
 * @param query - Submitted query text.
 * @param error - Error thrown while resolving the request.
 * @param message - Message to inspect, format, or clone.
 */
function resolveErrorMessage(
  query: string,
  error: unknown,
  message: string | FlowErrorMessageResolver | undefined
): string {
  if (typeof message === 'function') {
    return message(query, error);
  }

  return (
    message ??
    `I hit a problem while looking up recommendations for "${query}". Please try again.`
  );
}

/**
 * Creates a reusable flow that asks the user for a query, resolves
 * recommended actions, and displays the resulting buttons in the chat.
 *
 * @param config - Query prompt, resolver, loading, and error-handling settings.
 */
export function createQueryRecommendedActionsFlow(
  config: QueryRecommendedActionsFlowConfig
): QueryRecommendedActionsFlow {
  const {
    abortCallback,
    abortLabel,
    buildRecommendationsMessage,
    cancelInFlightOnNewInput = false,
    className,
    cooldownMessage,
    cooldownMs,
    emptyStateMessage,
    errorMessage,
    getRecommendedActions,
    id,
    initialLabel = 'Find help',
    inputDescription,
    inputTimeoutMessage,
    inputTimeoutMs,
    inputType = 'search',
    minMessageLength,
    minMessageLengthMessage,
    normalizeQuery = query => query.trim(),
    onError,
    onInvalidInput,
    loadingMessage,
    minimumLoadingDurationMs = 0,
    placeholder = 'Search for help topics...',
    queryPromptMessage = 'What would you like help with?',
    queueWhileWaiting = false,
    rateLimit,
    showAbort = true,
    shouldWaitForTurn,
    style,
    suppressValidationFailureMessage = false,
    validator,
    variant,
  } = config;
  const queuedRecommendations: QueuedRecommendationResolver[] = [];
  let activeCoordinatedOperationId: number | undefined;
  let activeCoordinatedLoadingMessageId: number | undefined;
  let nextCoordinatedOperationId = 0;

  const shouldCoordinateRequests =
    cancelInFlightOnNewInput || queueWhileWaiting;

  const removeMessageById = (messageId: number | undefined): void => {
    if (messageId === undefined) {
      return;
    }

    const { getMessages, setMessages } = useChatStore.getState();
    setMessages(getMessages().filter(message => message.id !== messageId));
  };

  const clearQueuedRecommendations = (): void => {
    const droppedRecommendations = queuedRecommendations.splice(0);
    droppedRecommendations.forEach(recommendation => {
      recommendation.resolve();
    });
  };

  const runFlow = async (
    submittedQuery: string,
    coordinatedOperationId?: number
  ): Promise<void> => {
    const query = normalizeQuery(submittedQuery);
    const { addMessage, getMessages, getPreviousMessage, setMessages } =
      useChatStore.getState();
    const loadingStartedAt = Date.now();
    const loadingLabel = resolveLoadingMessage(query, loadingMessage);
    let pendingMessage:
      | {
          /**
           * Discriminant or input type for this value.
           */
          readonly type: 'other';
          /**
           * Structured message parts rendered for the message.
           */
          readonly parts: readonly MessagePart[];
          /**
           * Buttons rendered, stored, or customized by this contract.
           */
          readonly buttons?: readonly QueryRecommendedAction[] | undefined;
        }
      | undefined;
    let loadingMessageId = coordinatedOperationId
      ? activeCoordinatedLoadingMessageId
      : undefined;

    const isStaleCoordinatedRun = (): boolean => {
      return (
        coordinatedOperationId !== undefined &&
        activeCoordinatedOperationId !== coordinatedOperationId
      );
    };

    try {
      addMessage({
        type: 'other',
        parts: [],
        isLoading: true,
        loadingLabel: loadingLabel,
      });
      loadingMessageId = getPreviousMessage()?.id;
      if (coordinatedOperationId !== undefined) {
        activeCoordinatedLoadingMessageId = loadingMessageId;
      }

      const resolverResult = await getRecommendedActions(
        query,
        createContext(query)
      );
      if (isStaleCoordinatedRun()) {
        return;
      }

      const normalizedResult = normalizeResolverResult(resolverResult);
      const recommendedActions = normalizedResult.recommendedActions ?? [];

      if (recommendedActions.length === 0) {
        pendingMessage = {
          type: 'other',
          parts: [
            createTextPart(
              resolveMessage(
                query,
                normalizedResult.responseMessage ?? emptyStateMessage,
                `I couldn't find any recommended actions for "${query}" yet.`
              )
            ),
          ],
        };
      } else {
        pendingMessage = {
          type: 'other',
          parts: [
            createTextPart(
              resolveMessage(
                query,
                normalizedResult.responseMessage ?? buildRecommendationsMessage,
                `Here are the recommended next steps for "${query}".`
              )
            ),
          ],
          buttons: recommendedActions,
        };
      }
    } catch (error) {
      if (isStaleCoordinatedRun()) {
        return;
      }

      const context = createContext(query);
      onError?.(query, error, context);
      pendingMessage = {
        type: 'other',
        parts: [
          createTextPart(resolveErrorMessage(query, error, errorMessage)),
        ],
      };
    } finally {
      const elapsedMs = Date.now() - loadingStartedAt;
      const remainingMs = minimumLoadingDurationMs - elapsedMs;

      if (remainingMs > 0) {
        await wait(remainingMs);
      }
    }

    if (isStaleCoordinatedRun()) {
      return;
    }

    if (pendingMessage) {
      if (loadingMessageId === undefined) {
        addMessage({
          type: 'other',
          parts: pendingMessage.parts,
          ...(pendingMessage.buttons
            ? { buttons: pendingMessage.buttons }
            : {}),
        });
      } else {
        setMessages(
          getMessages().map(message => {
            if (message.id !== loadingMessageId) {
              return message;
            }

            const {
              isLoading: _isLoading,
              loadingLabel: _loadingLabel,
              ...resolvedMessage
            } = message;

            return {
              ...resolvedMessage,
              type: 'other',
              parts: pendingMessage.parts,
              rawContent: getMessageRawText(pendingMessage.parts),
              isLoading: false,
              ...(pendingMessage.buttons
                ? { buttons: pendingMessage.buttons }
                : { buttons: [] }),
            };
          })
        );
      }
    }

    if (
      coordinatedOperationId !== undefined &&
      activeCoordinatedOperationId === coordinatedOperationId
    ) {
      activeCoordinatedOperationId = undefined;
      activeCoordinatedLoadingMessageId = undefined;

      const nextQueuedRecommendation = queuedRecommendations.shift();
      if (nextQueuedRecommendation) {
        void recommend(nextQueuedRecommendation.query).then(
          nextQueuedRecommendation.resolve,
          nextQueuedRecommendation.reject
        );
      }
    }
  };

  const recommend = (submittedQuery: string): Promise<void> => {
    if (!shouldCoordinateRequests) {
      return runFlow(submittedQuery);
    }

    if (activeCoordinatedOperationId !== undefined) {
      if (cancelInFlightOnNewInput) {
        removeMessageById(activeCoordinatedLoadingMessageId);
        activeCoordinatedLoadingMessageId = undefined;
        clearQueuedRecommendations();
      } else if (queueWhileWaiting) {
        return new Promise<void>((resolve, reject) => {
          queuedRecommendations.push({
            query: submittedQuery,
            resolve,
            reject,
          });
        });
      }
    }

    const coordinatedOperationId = ++nextCoordinatedOperationId;
    activeCoordinatedOperationId = coordinatedOperationId;

    return runFlow(submittedQuery, coordinatedOperationId);
  };

  const buttonConfig: Omit<RequestInputButtonDefinition, 'kind'> = {
    id,
    initialLabel,
    inputPromptMessage: queryPromptMessage,
    inputType,
    placeholder,
    ...(cooldownMessage ? { cooldownMessage } : {}),
    ...(cooldownMs !== undefined ? { cooldownMs } : {}),
    ...(inputTimeoutMessage ? { inputTimeoutMessage } : {}),
    ...(inputTimeoutMs !== undefined ? { inputTimeoutMs } : {}),
    ...(minMessageLength !== undefined ? { minMessageLength } : {}),
    ...(minMessageLengthMessage ? { minMessageLengthMessage } : {}),
    ...(rateLimit ? { rateLimit } : {}),
    suppressValidationFailureMessage,
    ...(abortLabel ? { abortLabel } : {}),
    ...(className ? { className } : {}),
    ...(inputDescription ? { inputDescription } : {}),
    ...(showAbort !== undefined ? { showAbort } : {}),
    ...(shouldWaitForTurn !== undefined ? { shouldWaitForTurn } : {}),
    ...(style ? { style } : {}),
    ...(validator ? { validator } : {}),
    ...(variant ? { variant } : {}),
  };

  const buttonDefinition = createRequestInputButtonDef(buttonConfig);
  const button = createButton(buttonDefinition, {
    ...(abortCallback ? { abortCallback } : {}),
    ...(id ? { id } : {}),
    ...(onInvalidInput ? { onInvalidInput } : {}),
    onValidInput: recommend,
  });

  return {
    button,
    start: () => {
      button.onClick?.();
    },
    recommend,
  };
}
