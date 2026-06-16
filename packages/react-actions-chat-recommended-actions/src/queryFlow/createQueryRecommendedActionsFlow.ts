import {
  createButton,
  createRequestInputButtonDef,
  type RequestInputButtonDefinition,
} from 'react-actions-chat';
import {
  DEFAULT_INITIAL_LABEL,
  DEFAULT_INPUT_TYPE,
  DEFAULT_PLACEHOLDER,
  DEFAULT_QUERY_PROMPT_MESSAGE,
} from './defaults';
import { createErrorMessage, createRecommendationMessage } from './messages';
import { normalizeResolverResult } from './results';
import {
  addRecommendationLoadingMessage,
  createQueryRecommendedActionsContext,
  removeMessageById,
  resolveRecommendationMessage,
} from './storeMessages';
import { wait } from './timing';
import { resolveLoadingMessage } from './messages';
import type {
  QueryRecommendedActionsFlow,
  QueryRecommendedActionsFlowConfig,
  QueryRecommendedActionsMessageDraft,
  QueuedRecommendationResolver,
} from './types';

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
    initialLabel = DEFAULT_INITIAL_LABEL,
    inputDescription,
    inputTimeoutMessage,
    inputTimeoutMs,
    inputType = DEFAULT_INPUT_TYPE,
    minMessageLength,
    minMessageLengthMessage,
    normalizeQuery = query => query.trim(),
    onError,
    onInvalidInput,
    loadingMessage,
    minimumLoadingDurationMs = 0,
    placeholder = DEFAULT_PLACEHOLDER,
    queryPromptMessage = DEFAULT_QUERY_PROMPT_MESSAGE,
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
    const loadingStartedAt = Date.now();
    const loadingLabel = resolveLoadingMessage(query, loadingMessage);
    let pendingMessage: QueryRecommendedActionsMessageDraft | undefined;
    let loadingMessageId =
      coordinatedOperationId !== undefined
        ? activeCoordinatedLoadingMessageId
        : undefined;

    const isStaleCoordinatedRun = (): boolean => {
      return (
        coordinatedOperationId !== undefined &&
        activeCoordinatedOperationId !== coordinatedOperationId
      );
    };

    try {
      loadingMessageId = addRecommendationLoadingMessage(loadingLabel);
      if (coordinatedOperationId !== undefined) {
        activeCoordinatedLoadingMessageId = loadingMessageId;
      }

      const resolverResult = await getRecommendedActions(
        query,
        createQueryRecommendedActionsContext(query)
      );
      if (isStaleCoordinatedRun()) {
        return;
      }

      pendingMessage = createRecommendationMessage({
        query,
        result: normalizeResolverResult(resolverResult),
        emptyStateMessage,
        buildRecommendationsMessage,
      });
    } catch (error) {
      if (isStaleCoordinatedRun()) {
        return;
      }

      const context = createQueryRecommendedActionsContext(query);
      onError?.(query, error, context);
      pendingMessage = createErrorMessage(query, error, errorMessage);
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
      resolveRecommendationMessage(loadingMessageId, pendingMessage);
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
