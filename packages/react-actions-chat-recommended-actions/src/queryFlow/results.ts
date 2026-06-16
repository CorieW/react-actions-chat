import type {
  QueryRecommendedAction,
  QueryRecommendedActionsResolverResult,
  QueryRecommendedActionsResult,
} from './types';

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
 * Normalizes every supported recommendation resolver result shape.
 *
 * @param result - Resolver or provider result to normalize.
 */
export function normalizeResolverResult(
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
