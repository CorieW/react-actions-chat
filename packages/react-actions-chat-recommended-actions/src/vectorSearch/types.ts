import type {
  QueryRecommendedAction,
  QueryRecommendedActionsContext,
  QueryRecommendedActionsFlowConfig,
  QueryRecommendedActionsResult,
} from '../queryFlow';
import type { MaybePromise } from '../queryFlow/types';
import type { EmbeddingVector, TextEmbedder } from '../embedders';
import type { VectorSearchButtonDefinition } from '../vectorSearchButtonDefinition';

/**
 * A scored vector search match for a button definition.
 */
export interface VectorSearchButtonMatch<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> {
  /**
   * Button definition or instance handled by this contract.
   */
  readonly button: TButtonDefinition;
  /**
   * Similarity score returned for the vector-search match.
   */
  readonly score: number;
}

/**
 * Embeds a user query before vector search runs.
 *
 * @param query - Submitted query text.
 * @param context - Context object available to this resolver.
 */
export type QueryEmbeddingResolver = (
  query: string,
  context: QueryRecommendedActionsContext
) => MaybePromise<EmbeddingVector>;

/**
 * Context passed when turning a vector-search match into a chat action.
 */
export interface VectorSearchButtonActionContext<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> {
  /**
   * Vector-search match returned for a button definition.
   */
  readonly match: VectorSearchButtonMatch<TButtonDefinition>;
  /**
   * Search query or user request text.
   */
  readonly query: string;
  /**
   * Context passed to the callback or resolver.
   */
  readonly context: QueryRecommendedActionsContext;
}

/**
 * Optional hook for customizing how a button match becomes a rendered action.
 * By default, the flow calls createButton on the matched button definition.
 *
 * @param context - Match, query, and context used to create an action.
 */
export type VectorSearchButtonActionResolver<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> = (
  context: VectorSearchButtonActionContext<TButtonDefinition>
) => MaybePromise<QueryRecommendedAction>;

/**
 * Context passed when building a full vector-search recommendation result.
 */
export interface VectorSearchButtonsResultContext<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> {
  /**
   * Vector-search matches available to the result resolver.
   */
  readonly matches: readonly VectorSearchButtonMatch<TButtonDefinition>[];
  /**
   * Search query or user request text.
   */
  readonly query: string;
  /**
   * Context passed to the callback or resolver.
   */
  readonly context: QueryRecommendedActionsContext;
}

/**
 * Optional hook for customizing the full recommendation result after search.
 *
 * @param context - Matches, query, and context used to build the result.
 */
export type VectorSearchButtonsResultResolver<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> = (
  context: VectorSearchButtonsResultContext<TButtonDefinition>
) => MaybePromise<
  | QueryRecommendedActionsResult
  | readonly QueryRecommendedAction[]
  | null
  | undefined
>;

/**
 * Context passed to hosted vector-search adapters.
 */
export interface VectorSearchButtonSearchContext {
  /**
   * Search query or user request text.
   */
  readonly query: string;
  /**
   * Context passed to the callback or resolver.
   */
  readonly context: QueryRecommendedActionsContext;
  /**
   * Embedding vector generated for the query.
   */
  readonly queryEmbedding: EmbeddingVector;
  /**
   * Maximum number of search matches to return.
   */
  readonly maxResults: number;
}

/**
 * Search adapter for hosted vector databases or custom retrieval systems.
 *
 * @param context - Query, embedding, context, and limit used by the search adapter.
 */
export type VectorSearchButtonSearchAdapter<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> = (
  context: VectorSearchButtonSearchContext
) => MaybePromise<readonly VectorSearchButtonMatch<TButtonDefinition>[]>;

/**
 * Locally stored vector embedding for a button definition.
 */
export interface EmbeddedVectorSearchButton<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> {
  /**
   * Button definition or instance handled by this contract.
   */
  readonly button: TButtonDefinition;
  /**
   * Vector embedding generated for the text.
   */
  readonly embedding: EmbeddingVector;
}

/**
 * Shared vector-search recommendation configuration fields.
 */
interface VectorSearchQueryRecommendedActionsFlowConfigBase<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> extends Omit<QueryRecommendedActionsFlowConfig, 'getRecommendedActions'> {
  /**
   * Optional hook to override how matched buttons are rendered into actions.
   * When omitted, matched buttons are rendered with createButton.
   */
  readonly createAction?:
    | VectorSearchButtonActionResolver<TButtonDefinition>
    | undefined;

  /**
   * Optional hook to override the final result after search.
   */
  readonly buildResult?:
    | VectorSearchButtonsResultResolver<TButtonDefinition>
    | undefined;

  /**
   * Maximum number of matches to return. Defaults to 3.
   */
  readonly maxResults?: number | undefined;

  /**
   * Minimum score required for a match to be kept. Defaults to 0.
   */
  readonly minScore?: number | undefined;

  /**
   * Optional query embedding override.
   */
  readonly embedQuery?: QueryEmbeddingResolver | undefined;

  /**
   * Optional text embedder used for query embedding and local button
   * embedding.
   */
  readonly embedder?: TextEmbedder | undefined;
}

/**
 * In-memory vector search setup with precomputed button embeddings.
 */
export interface EmbeddedButtonsVectorSearchQueryRecommendedActionsFlowConfig<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> extends VectorSearchQueryRecommendedActionsFlowConfigBase<TButtonDefinition> {
  /**
   * Buttons rendered, stored, or customized by this contract.
   */
  readonly buttons: readonly TButtonDefinition[];
  /**
   * Returns the embedding for a button definition.
   *
   * @param button - Button to store or update.
   */
  readonly getButtonEmbedding: (button: TButtonDefinition) => EmbeddingVector;
  /**
   * Function that returns searchable text for a button definition.
   */
  readonly getButtonText?: undefined;
  /**
   * Search implementation used to retrieve vector matches.
   */
  readonly search?: undefined;
}

/**
 * In-memory vector search setup that embeds button text for you.
 */
export interface TextButtonsVectorSearchQueryRecommendedActionsFlowConfig<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> extends VectorSearchQueryRecommendedActionsFlowConfigBase<TButtonDefinition> {
  /**
   * Buttons rendered, stored, or customized by this contract.
   */
  readonly buttons: readonly TButtonDefinition[];
  /**
   * Text embedder used to create query and button embeddings.
   */
  readonly embedder: TextEmbedder;
  /**
   * Returns button text.
   *
   * @param button - Button to store or update.
   */
  readonly getButtonText?: ((button: TButtonDefinition) => string) | undefined;
  /**
   * Function that returns the vector embedding for a button definition.
   */
  readonly getButtonEmbedding?: undefined;
  /**
   * Search implementation used to retrieve vector matches.
   */
  readonly search?: undefined;
}

/**
 * Hosted vector search setup for external vector databases.
 */
export interface SearchButtonsVectorSearchQueryRecommendedActionsFlowConfig<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> extends VectorSearchQueryRecommendedActionsFlowConfigBase<TButtonDefinition> {
  /**
   * Search implementation used to retrieve vector matches.
   */
  readonly search: VectorSearchButtonSearchAdapter<TButtonDefinition>;
  /**
   * Buttons rendered, stored, or customized by this contract.
   */
  readonly buttons?: undefined;
  /**
   * Function that returns the vector embedding for a button definition.
   */
  readonly getButtonEmbedding?: undefined;
  /**
   * Function that returns searchable text for a button definition.
   */
  readonly getButtonText?: undefined;
}

/**
 * Configuration for vector-search-backed button recommendations.
 */
export type VectorSearchQueryRecommendedActionsFlowConfig<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> =
  | EmbeddedButtonsVectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition>
  | TextButtonsVectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition>
  | SearchButtonsVectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition>;
