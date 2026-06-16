import { createTextPart } from 'react-actions-chat';
import {
  getDefaultEmptyStateMessage,
  getDefaultErrorMessage,
  getDefaultLoadingMessage,
  getDefaultRecommendationsMessage,
} from './defaults';
import type {
  FlowErrorMessageResolver,
  FlowLoadingMessageResolver,
  FlowMessageResolver,
  QueryRecommendedActionsMessageDraft,
  QueryRecommendedActionsResult,
} from './types';

/**
 * Options used to build a recommendation response message.
 */
interface CreateRecommendationMessageOptions {
  /**
   * Submitted query text.
   */
  readonly query: string;
  /**
   * Normalized recommendation result returned by the resolver.
   */
  readonly result: QueryRecommendedActionsResult;
  /**
   * Optional message shown when no recommendations are returned.
   */
  readonly emptyStateMessage?: string | FlowMessageResolver | undefined;
  /**
   * Optional message shown when recommendations are returned.
   */
  readonly buildRecommendationsMessage?: FlowMessageResolver | undefined;
}

/**
 * Resolves static or query-derived flow message text.
 *
 * @param query - Submitted query text.
 * @param message - Message to inspect, format, or clone.
 * @param fallback - Fallback text used when no resolver value is provided.
 */
function resolveFlowMessage(
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
export function resolveLoadingMessage(
  query: string,
  message: string | FlowLoadingMessageResolver | undefined
): string {
  if (typeof message === 'function') {
    return message(query);
  }

  return message ?? getDefaultLoadingMessage(query);
}

/**
 * Resolves error text for a failed recommendation lookup.
 *
 * @param query - Submitted query text.
 * @param error - Error thrown while resolving the request.
 * @param message - Message to inspect, format, or clone.
 */
export function resolveErrorMessage(
  query: string,
  error: unknown,
  message: string | FlowErrorMessageResolver | undefined
): string {
  if (typeof message === 'function') {
    return message(query, error);
  }

  return message ?? getDefaultErrorMessage(query);
}

/**
 * Creates a message draft for normalized recommendation results.
 *
 * @param options - Query, result, and message overrides used for the draft.
 */
export function createRecommendationMessage({
  query,
  result,
  emptyStateMessage,
  buildRecommendationsMessage,
}: CreateRecommendationMessageOptions): QueryRecommendedActionsMessageDraft {
  const recommendedActions = result.recommendedActions ?? [];

  if (recommendedActions.length === 0) {
    return {
      type: 'other',
      parts: [
        createTextPart(
          resolveFlowMessage(
            query,
            result.responseMessage ?? emptyStateMessage,
            getDefaultEmptyStateMessage(query)
          )
        ),
      ],
    };
  }

  return {
    type: 'other',
    parts: [
      createTextPart(
        resolveFlowMessage(
          query,
          result.responseMessage ?? buildRecommendationsMessage,
          getDefaultRecommendationsMessage(query)
        )
      ),
    ],
    buttons: recommendedActions,
  };
}

/**
 * Creates a message draft for recommendation lookup failures.
 *
 * @param query - Submitted query text.
 * @param error - Error thrown while resolving the request.
 * @param message - Message to inspect, format, or clone.
 */
export function createErrorMessage(
  query: string,
  error: unknown,
  message: string | FlowErrorMessageResolver | undefined
): QueryRecommendedActionsMessageDraft {
  return {
    type: 'other',
    parts: [createTextPart(resolveErrorMessage(query, error, message))],
  };
}
