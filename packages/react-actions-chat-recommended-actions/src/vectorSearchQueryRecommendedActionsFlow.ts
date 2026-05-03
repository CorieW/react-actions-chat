import { createButton } from 'react-actions-chat';
import {
  createQueryRecommendedActionsFlow,
  type QueryRecommendedAction,
  type QueryRecommendedActionsContext,
  type QueryRecommendedActionsFlow,
  type QueryRecommendedActionsFlowConfig,
  type QueryRecommendedActionsResult,
  type QueryRecommendedActionsResolver,
} from './queryRecommendedActionsFlow';
import {
  embedTexts,
  type EmbeddingVector,
  type TextEmbedder,
} from './embedders';
import {
  buildVectorSearchButtonText,
  type VectorSearchButtonDefinition,
} from './vectorSearchButtonDefinition';

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
) => EmbeddingVector | Promise<EmbeddingVector>;

/**
 * Optional hook for customizing how a button match becomes a rendered action.
 * By default, the flow calls createButton on the matched button definition.
 *
 * @param args - Match, query, and context used to create an action.
 */
export type VectorSearchButtonActionResolver<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> = (args: {
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
}) => QueryRecommendedAction | Promise<QueryRecommendedAction>;

/**
 * Optional hook for customizing the full recommendation result after search.
 *
 * @param args - Matches, query, and context used to build the result.
 */
export type VectorSearchButtonsResultResolver<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> = (args: {
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
}) =>
  | QueryRecommendedActionsResult
  | readonly QueryRecommendedAction[]
  | null
  | undefined
  | Promise<
      | QueryRecommendedActionsResult
      | readonly QueryRecommendedAction[]
      | null
      | undefined
    >;

/**
 * Search adapter for hosted vector databases or custom retrieval systems.
 *
 * @param args - Query, embedding, context, and limit used by the search adapter.
 */
export type VectorSearchButtonSearchAdapter<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> = (args: {
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
}) =>
  | readonly VectorSearchButtonMatch<TButtonDefinition>[]
  | Promise<readonly VectorSearchButtonMatch<TButtonDefinition>[]>;

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

/**
 * Calculates cosine similarity between two embedding vectors.
 *
 * @param left - Left value in the comparison.
 * @param right - Right value in the comparison.
 */
function cosineSimilarity(
  left: EmbeddingVector,
  right: EmbeddingVector
): number {
  if (left.length !== right.length) {
    throw new Error('Embedding vectors must have the same length.');
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;

    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / Math.sqrt(leftMagnitude * rightMagnitude);
}

/**
 * Returns whether vector search is delegated to an external adapter.
 *
 * @param config - Vector-search recommendation configuration to inspect or resolve.
 */
function usesSearchAdapter<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition>
): config is SearchButtonsVectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition> {
  return 'search' in config && typeof config.search === 'function';
}

/**
 * Returns whether buttons already provide precomputed embeddings.
 *
 * @param config - Vector-search recommendation configuration to inspect or resolve.
 */
function usesEmbeddedButtons<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition>
): config is EmbeddedButtonsVectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition> {
  return typeof config.getButtonEmbedding === 'function';
}

/**
 * Returns the configured button definitions for local vector search.
 *
 * @param config - Vector-search recommendation configuration to inspect or resolve.
 */
function getConfiguredButtons<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition>
): readonly TButtonDefinition[] {
  return config.buttons ?? [];
}

/**
 * Returns the configured button text resolver when present.
 *
 * @param config - Vector-search recommendation configuration to inspect or resolve.
 */
function getButtonTextResolver<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition>
): ((button: TButtonDefinition) => string) | undefined {
  return config.getButtonText;
}

/**
 * Returns the configured button embedding resolver when present.
 *
 * @param config - Vector-search recommendation configuration to inspect or resolve.
 */
function getButtonEmbeddingResolver<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition>
): ((button: TButtonDefinition) => EmbeddingVector) | undefined {
  return config.getButtonEmbedding;
}

/**
 * Scores locally embedded buttons against the query embedding.
 *
 * @param queryEmbedding - Embedding vector for the submitted query.
 * @param buttons - Buttons to transform, render, or customize.
 */
function runInMemoryVectorSearch<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  queryEmbedding: EmbeddingVector,
  buttons: readonly {
    /**
     * Button definition or instance handled by this contract.
     */
    readonly button: TButtonDefinition;
    /**
     * Vector embedding generated for the text.
     */
    readonly embedding: EmbeddingVector;
  }[]
): readonly VectorSearchButtonMatch<TButtonDefinition>[] {
  return buttons.map(({ button, embedding }) => ({
    button,
    score: cosineSimilarity(queryEmbedding, embedding),
  }));
}

/**
 * Creates the query embedding resolver for vector-search recommendations.
 *
 * @param config - Vector-search recommendation configuration to inspect or resolve.
 */
function createQueryEmbeddingResolver<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition>
): QueryEmbeddingResolver {
  if (config.embedQuery) {
    return config.embedQuery;
  }

  if (config.embedder) {
    return async query => {
      return config.embedder!.embedText(query, {
        inputType: 'query',
      });
    };
  }

  throw new Error(
    'Vector search flow requires either embedQuery or embedder for query embeddings.'
  );
}

/**
 * Creates a default action.
 *
 * @param options - Match data used to create the default action.
 */
function createDefaultAction<
  TButtonDefinition extends VectorSearchButtonDefinition,
>({
  match,
}: {
  /**
   * Vector-search match returned for a button definition.
   */
  readonly match: VectorSearchButtonMatch<TButtonDefinition>;
}) {
  if ('kind' in match.button && match.button.kind === 'request-input') {
    return createButton(match.button);
  }

  if ('kind' in match.button && match.button.kind === 'request-confirmation') {
    return createButton(match.button);
  }

  return createButton(match.button);
}

/**
 * Creates a vector search resolver.
 *
 * @param config - Vector-search recommendation configuration to inspect or resolve.
 */
function createVectorSearchResolver<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition>
): QueryRecommendedActionsResolver {
  const {
    buildResult,
    createAction = createDefaultAction,
    maxResults = 3,
    minScore = 0,
  } = config;
  const embedQuery = createQueryEmbeddingResolver(config);
  const buttons = getConfiguredButtons(config);
  const getButtonText = getButtonTextResolver(config);
  const getButtonEmbedding = getButtonEmbeddingResolver(config);

  let embeddedButtonsPromise:
    | Promise<
        readonly {
          /**
           * Button definition or instance handled by this contract.
           */
          readonly button: TButtonDefinition;
          /**
           * Vector embedding generated for the text.
           */
          readonly embedding: EmbeddingVector;
        }[]
      >
    | undefined;

  const getEmbeddedButtons = async (): Promise<
    readonly {
      /**
       * Button definition or instance handled by this contract.
       */
      readonly button: TButtonDefinition;
      /**
       * Vector embedding generated for the text.
       */
      readonly embedding: EmbeddingVector;
    }[]
  > => {
    if (usesSearchAdapter(config)) {
      return [];
    }

    if (usesEmbeddedButtons(config)) {
      return buttons.map(button => ({
        button,
        embedding: getButtonEmbedding?.(button) ?? [],
      }));
    }

    if (!embeddedButtonsPromise) {
      const { embedder } = config;

      if (!embedder) {
        throw new Error(
          'Text button vector search requires an embedder to create button embeddings.'
        );
      }

      const buttonTexts = buttons.map(
        button => getButtonText?.(button) ?? buildVectorSearchButtonText(button)
      );
      const embeddings = await embedTexts(embedder, buttonTexts, 'document');

      if (embeddings.length !== buttons.length) {
        throw new Error(
          'Button embedding count did not match the number of source buttons.'
        );
      }

      embeddedButtonsPromise = Promise.resolve(
        buttons.map((button, index) => ({
          button,
          embedding: embeddings[index] ?? [],
        }))
      );
    }

    return embeddedButtonsPromise;
  };

  return async (query, context) => {
    const queryEmbedding = await embedQuery(query, context);
    const rawMatches = usesSearchAdapter(config)
      ? await config.search({
          query,
          context,
          queryEmbedding,
          maxResults,
        })
      : runInMemoryVectorSearch(queryEmbedding, await getEmbeddedButtons());

    const matches = [...rawMatches]
      .filter(match => match.score >= minScore)
      .sort((left, right) => right.score - left.score)
      .slice(0, maxResults);

    if (buildResult) {
      return buildResult({
        matches,
        query,
        context,
      });
    }

    return Promise.all(
      matches.map(match =>
        Promise.resolve(
          createAction({
            match,
            query,
            context,
          })
        )
      )
    );
  };
}

/**
 * Creates a query flow with built-in embedding and vector search wiring for
 * button definitions.
 *
 * @param config - Vector-search recommendation configuration to inspect or resolve.
 */
export function createVectorSearchQueryRecommendedActionsFlow<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition>
): QueryRecommendedActionsFlow {
  return createQueryRecommendedActionsFlow({
    ...config,
    getRecommendedActions: createVectorSearchResolver(config),
  });
}
