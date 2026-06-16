/**
 * Default label for the button that starts the query flow.
 */
export const DEFAULT_INITIAL_LABEL = 'Find help';

/**
 * Default input mode used while collecting recommendation queries.
 */
export const DEFAULT_INPUT_TYPE = 'search';

/**
 * Default placeholder shown while collecting recommendation queries.
 */
export const DEFAULT_PLACEHOLDER = 'Search for help topics...';

/**
 * Default prompt shown before collecting recommendation queries.
 */
export const DEFAULT_QUERY_PROMPT_MESSAGE = 'What would you like help with?';

/**
 * Default empty-state response shown when no recommendations are returned.
 *
 * @param query - Submitted query text.
 */
export function getDefaultEmptyStateMessage(query: string): string {
  return `I couldn't find any recommended actions for "${query}" yet.`;
}

/**
 * Default response shown when recommendations are returned.
 *
 * @param query - Submitted query text.
 */
export function getDefaultRecommendationsMessage(query: string): string {
  return `Here are the recommended next steps for "${query}".`;
}

/**
 * Default loading text shown while recommendations are resolving.
 *
 * @param query - Submitted query text.
 */
export function getDefaultLoadingMessage(query: string): string {
  return `Finding recommended actions for "${query}"...`;
}

/**
 * Default error text shown when recommendation lookup fails.
 *
 * @param query - Submitted query text.
 */
export function getDefaultErrorMessage(query: string): string {
  return `I hit a problem while looking up recommendations for "${query}". Please try again.`;
}
