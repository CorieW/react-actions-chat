import {
  createButton,
  createRequestInputButtonDef,
  createTextPart,
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
  readonly query: string;
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

type QueryRecommendedActionsResolverResult =
  | QueryRecommendedActionsResult
  | readonly QueryRecommendedAction[]
  | null
  | undefined;

export type QueryRecommendedActionsResolver = (
  query: string,
  context: QueryRecommendedActionsContext
) =>
  | QueryRecommendedActionsResolverResult
  | Promise<QueryRecommendedActionsResolverResult>;

type FlowMessageResolver = (query: string) => string;
type FlowErrorMessageResolver = (query: string, error: unknown) => string;
type FlowLoadingMessageResolver = (query: string) => string;
type QueuedRecommendationResolver = {
  readonly query: string;
  readonly resolve: () => void;
  readonly reject: (error: unknown) => void;
};

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
   */
  readonly recommend: (query: string) => Promise<void>;
}

function isRecommendedActionArray(
  result: QueryRecommendedActionsResolverResult
): result is readonly QueryRecommendedAction[] {
  return Array.isArray(result);
}

function createContext(query: string): QueryRecommendedActionsContext {
  return {
    query,
    messages: useChatStore.getState().getMessages(),
  };
}

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

function resolveLoadingMessage(
  query: string,
  message: string | FlowLoadingMessageResolver | undefined
): string {
  if (typeof message === 'function') {
    return message(query);
  }

  return message ?? `Finding recommended actions for "${query}"...`;
}

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
          readonly type: 'other';
          readonly parts: readonly MessagePart[];
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
              rawContent: pendingMessage.parts
                .map(part => part.text)
                .filter(value => value.length > 0)
                .join('\n'),
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
