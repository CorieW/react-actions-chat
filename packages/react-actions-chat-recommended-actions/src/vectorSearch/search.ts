import { createButton } from 'react-actions-chat';
import { embedTexts, type EmbeddingVector } from '../embedders';
import type { QueryRecommendedActionsResolver } from '../queryFlow';
import {
  buildVectorSearchButtonText,
  type VectorSearchButtonDefinition,
} from '../vectorSearchButtonDefinition';
import { cosineSimilarity } from './similarity';
import type {
  EmbeddedButtonsVectorSearchQueryRecommendedActionsFlowConfig,
  EmbeddedVectorSearchButton,
  QueryEmbeddingResolver,
  SearchButtonsVectorSearchQueryRecommendedActionsFlowConfig,
  VectorSearchButtonMatch,
  VectorSearchQueryRecommendedActionsFlowConfig,
} from './types';

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
 * Scores locally embedded buttons against the query embedding.
 *
 * @param queryEmbedding - Embedding vector for the submitted query.
 * @param buttons - Buttons to transform, render, or customize.
 */
function runInMemoryVectorSearch<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  queryEmbedding: EmbeddingVector,
  buttons: readonly EmbeddedVectorSearchButton<TButtonDefinition>[]
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
    const { embedder } = config;
    return async query => {
      return embedder.embedText(query, {
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
export function createVectorSearchResolver<
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

  let embeddedButtonsPromise:
    | Promise<readonly EmbeddedVectorSearchButton<TButtonDefinition>[]>
    | undefined;

  const getEmbeddedButtons = async (): Promise<
    readonly EmbeddedVectorSearchButton<TButtonDefinition>[]
  > => {
    if (usesSearchAdapter(config)) {
      return [];
    }

    if (usesEmbeddedButtons(config)) {
      return buttons.map(button => ({
        button,
        embedding: config.getButtonEmbedding(button),
      }));
    }

    if (!embeddedButtonsPromise) {
      const { embedder } = config;

      if (!embedder) {
        throw new Error(
          'Text button vector search requires an embedder to create button embeddings.'
        );
      }

      embeddedButtonsPromise = (async () => {
        const buttonTexts = buttons.map(
          button =>
            config.getButtonText?.(button) ??
            buildVectorSearchButtonText(button)
        );
        const embeddings = await embedTexts(embedder, buttonTexts, 'document');

        if (embeddings.length !== buttons.length) {
          throw new Error(
            'Button embedding count did not match the number of source buttons.'
          );
        }

        return buttons.map((button, index) => ({
          button,
          embedding: embeddings[index] ?? [],
        }));
      })();
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
