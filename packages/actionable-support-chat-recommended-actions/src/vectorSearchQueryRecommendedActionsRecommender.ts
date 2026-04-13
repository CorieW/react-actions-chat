import { createButton } from 'actionable-support-chat';
import {
  createQueryRecommendedActionsRecommender,
  type QueryRecommendedAction,
  type QueryRecommendedActionsContext,
  type QueryRecommendedActionsRecommender,
  type QueryRecommendedActionsRecommenderConfig,
  type QueryRecommendedActionsResult,
  type QueryRecommendedActionsResolver,
} from './queryRecommendedActionsRecommender';
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
  readonly button: TButtonDefinition;
  readonly score: number;
}

/**
 * Embeds a user query before vector search runs.
 */
export type QueryEmbeddingResolver = (
  query: string,
  context: QueryRecommendedActionsContext
) => EmbeddingVector | Promise<EmbeddingVector>;

/**
 * Optional hook for customizing how a button match becomes a rendered action.
 * By default, the recommender calls createButton on the matched button definition.
 */
export type VectorSearchButtonActionResolver<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> = (args: {
  readonly match: VectorSearchButtonMatch<TButtonDefinition>;
  readonly query: string;
  readonly context: QueryRecommendedActionsContext;
}) => QueryRecommendedAction | Promise<QueryRecommendedAction>;

/**
 * Optional hook for customizing the full recommendation result after search.
 */
export type VectorSearchButtonsResultResolver<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> = (args: {
  readonly matches: readonly VectorSearchButtonMatch<TButtonDefinition>[];
  readonly query: string;
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
 */
export type VectorSearchButtonSearchAdapter<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> = (args: {
  readonly query: string;
  readonly context: QueryRecommendedActionsContext;
  readonly queryEmbedding: EmbeddingVector;
  readonly maxResults: number;
}) =>
  | readonly VectorSearchButtonMatch<TButtonDefinition>[]
  | Promise<readonly VectorSearchButtonMatch<TButtonDefinition>[]>;

interface VectorSearchQueryRecommendedActionsRecommenderConfigBase<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> extends Omit<
  QueryRecommendedActionsRecommenderConfig,
  'getRecommendedActions'
> {
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
export interface EmbeddedButtonsVectorSearchQueryRecommendedActionsRecommenderConfig<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> extends VectorSearchQueryRecommendedActionsRecommenderConfigBase<TButtonDefinition> {
  readonly buttons: readonly TButtonDefinition[];
  readonly getButtonEmbedding: (button: TButtonDefinition) => EmbeddingVector;
  readonly getButtonText?: undefined;
  readonly search?: undefined;
}

/**
 * In-memory vector search setup that embeds button text for you.
 */
export interface TextButtonsVectorSearchQueryRecommendedActionsRecommenderConfig<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> extends VectorSearchQueryRecommendedActionsRecommenderConfigBase<TButtonDefinition> {
  readonly buttons: readonly TButtonDefinition[];
  readonly embedder: TextEmbedder;
  readonly getButtonText?: ((button: TButtonDefinition) => string) | undefined;
  readonly getButtonEmbedding?: undefined;
  readonly search?: undefined;
}

/**
 * Hosted vector search setup for external vector databases.
 */
export interface SearchButtonsVectorSearchQueryRecommendedActionsRecommenderConfig<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> extends VectorSearchQueryRecommendedActionsRecommenderConfigBase<TButtonDefinition> {
  readonly search: VectorSearchButtonSearchAdapter<TButtonDefinition>;
  readonly buttons?: undefined;
  readonly getButtonEmbedding?: undefined;
  readonly getButtonText?: undefined;
}

/**
 * Configuration for vector-search-backed button recommendations.
 */
export type VectorSearchQueryRecommendedActionsRecommenderConfig<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> =
  | EmbeddedButtonsVectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>
  | TextButtonsVectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>
  | SearchButtonsVectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>;

interface LegacyVectorSearchButtonMatch<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> {
  readonly document: TButtonDefinition;
  readonly score: number;
}

interface LegacyVectorSearchQueryRecommendedActionsRecommenderConfig<
  TButtonDefinition extends VectorSearchButtonDefinition =
    VectorSearchButtonDefinition,
> {
  readonly documents?: readonly TButtonDefinition[] | undefined;
  readonly getDocumentEmbedding?:
    | ((button: TButtonDefinition) => EmbeddingVector)
    | undefined;
  readonly getDocumentText?:
    | ((button: TButtonDefinition) => string)
    | undefined;
  readonly toAction?:
    | VectorSearchButtonActionResolver<TButtonDefinition>
    | undefined;
}

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

function usesSearchAdapter<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>
): config is SearchButtonsVectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition> {
  return 'search' in config && typeof config.search === 'function';
}

function usesEmbeddedButtons<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>
): config is EmbeddedButtonsVectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition> {
  const legacyConfig =
    config as LegacyVectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>;

  return (
    ('getButtonEmbedding' in config &&
      typeof config.getButtonEmbedding === 'function') ||
    typeof legacyConfig.getDocumentEmbedding === 'function'
  );
}

function getConfiguredButtons<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>
): readonly TButtonDefinition[] {
  const legacyConfig =
    config as LegacyVectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>;

  return config.buttons ?? legacyConfig.documents ?? [];
}

function getButtonTextResolver<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>
): ((button: TButtonDefinition) => string) | undefined {
  const legacyConfig =
    config as LegacyVectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>;

  return config.getButtonText ?? legacyConfig.getDocumentText;
}

function getButtonEmbeddingResolver<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>
): ((button: TButtonDefinition) => EmbeddingVector) | undefined {
  const legacyConfig =
    config as LegacyVectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>;

  return config.getButtonEmbedding ?? legacyConfig.getDocumentEmbedding;
}

function normalizeMatches<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  matches: readonly (
    | VectorSearchButtonMatch<TButtonDefinition>
    | LegacyVectorSearchButtonMatch<TButtonDefinition>
  )[]
): readonly VectorSearchButtonMatch<TButtonDefinition>[] {
  return matches.map(match =>
    'button' in match
      ? match
      : {
          button: match.document,
          score: match.score,
        }
  );
}

function runInMemoryVectorSearch<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  queryEmbedding: EmbeddingVector,
  buttons: readonly {
    readonly button: TButtonDefinition;
    readonly embedding: EmbeddingVector;
  }[]
): readonly VectorSearchButtonMatch<TButtonDefinition>[] {
  return buttons.map(({ button, embedding }) => ({
    button,
    score: cosineSimilarity(queryEmbedding, embedding),
  }));
}

function createQueryEmbeddingResolver<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>
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
    'Vector search recommendations require either embedQuery or embedder for query embeddings.'
  );
}

function createDefaultAction<
  TButtonDefinition extends VectorSearchButtonDefinition,
>({ match }: { readonly match: VectorSearchButtonMatch<TButtonDefinition> }) {
  if ('kind' in match.button && match.button.kind === 'request-input') {
    return createButton(match.button);
  }

  if ('kind' in match.button && match.button.kind === 'request-confirmation') {
    return createButton(match.button);
  }

  return createButton(match.button);
}

function createVectorSearchResolver<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>
): QueryRecommendedActionsResolver {
  const legacyConfig =
    config as LegacyVectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>;
  const {
    buildResult,
    createAction = legacyConfig.toAction ?? createDefaultAction,
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
          readonly button: TButtonDefinition;
          readonly embedding: EmbeddingVector;
        }[]
      >
    | undefined;

  const getEmbeddedButtons = async (): Promise<
    readonly {
      readonly button: TButtonDefinition;
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
      ? normalizeMatches(
          await config.search({
            query,
            context,
            queryEmbedding,
            maxResults,
          })
        )
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
 * Creates a query recommender with built-in embedding and vector search
 * wiring for button definitions.
 */
export function createVectorSearchQueryRecommendedActionsRecommender<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsRecommenderConfig<TButtonDefinition>
): QueryRecommendedActionsRecommender {
  return createQueryRecommendedActionsRecommender({
    ...config,
    getRecommendedActions: createVectorSearchResolver(config),
  });
}
