import {
  createOpenAITextEmbedder,
  embedTexts,
  type EmbeddingVector,
  type TextEmbedder,
} from '../../../packages/react-actions-chat-recommended-actions/src/embedders/index.ts';
import {
  createRemoteRecommendedActionsHandler,
  type RemoteRecommendedActionsHandler,
} from '../../../packages/react-actions-chat-recommended-actions/src/server.ts';
import { buildVectorSearchButtonText } from '../../../packages/react-actions-chat-recommended-actions/src/vectorSearchButtonDefinition.ts';
import { SETTINGS_RECOMMENDATION_DOCUMENTS } from './settingsRecommendationCatalog';

const MAX_RESULTS = 5;
const MIN_SCORE = 0.2;
const OPENAI_MODEL = 'text-embedding-3-large';

interface EmbeddedRecommendationDocument {
  readonly id: string;
  readonly embedding: EmbeddingVector;
}

export interface CreateSettingsRecommendationHandlerConfig {
  readonly apiKey?: string | undefined;
  readonly embedder?: TextEmbedder | undefined;
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

/**
 * Creates the backend recommendation handler used by the settings example.
 * Embeddings are created on the server so the browser never sees the API key.
 */
export function createSettingsRecommendationHandler(
  config: CreateSettingsRecommendationHandlerConfig
): RemoteRecommendedActionsHandler {
  const embedder =
    config.embedder ??
    (config.apiKey
      ? createOpenAITextEmbedder({
          apiKey: config.apiKey,
          model: OPENAI_MODEL,
        })
      : undefined);

  if (!embedder) {
    throw new Error(
      'Set OPENAI_API_KEY in examples/settings/.env.local before sending a settings recommendation query.'
    );
  }

  let embeddedDocumentsPromise: Promise<
    readonly EmbeddedRecommendationDocument[]
  > | null = null;

  const getEmbeddedDocuments = async (): Promise<
    readonly EmbeddedRecommendationDocument[]
  > => {
    if (!embeddedDocumentsPromise) {
      embeddedDocumentsPromise = (async () => {
        const texts = SETTINGS_RECOMMENDATION_DOCUMENTS.map(document =>
          buildVectorSearchButtonText(document)
        );
        const embeddings = await embedTexts(embedder, texts, 'document');

        if (embeddings.length !== SETTINGS_RECOMMENDATION_DOCUMENTS.length) {
          throw new Error(
            'Settings recommendation embeddings did not match the number of documents.'
          );
        }

        return SETTINGS_RECOMMENDATION_DOCUMENTS.map((document, index) => ({
          id: document.id,
          embedding: embeddings[index] ?? [],
        }));
      })();
    }

    return embeddedDocumentsPromise;
  };

  return createRemoteRecommendedActionsHandler({
    recommend: async ({ query }) => {
      const normalizedQuery = query.trim();

      if (normalizedQuery === '') {
        return {
          responseMessage:
            'Tell me what setting you want to change and I will recommend the best action.',
          recommendedActions: [{ id: 'help' }],
        };
      }

      const [queryEmbedding, embeddedDocuments] = await Promise.all([
        embedder.embedText(normalizedQuery, {
          inputType: 'query',
        }),
        getEmbeddedDocuments(),
      ]);

      const matches = embeddedDocuments
        .map(document => ({
          id: document.id,
          score: cosineSimilarity(queryEmbedding, document.embedding),
        }))
        .filter(match => match.score >= MIN_SCORE)
        .sort((left, right) => right.score - left.score)
        .slice(0, MAX_RESULTS);

      if (matches.length === 0) {
        return {
          responseMessage: `I couldn't find any recommended actions for "${normalizedQuery}".`,
          recommendedActions: [{ id: 'help' }],
        };
      }

      return {
        responseMessage: `Here are the best settings actions I found for "${normalizedQuery}".`,
        recommendedActions: matches.map(match => ({
          id: match.id,
        })),
      };
    },
    errorMessage: error =>
      error instanceof Error
        ? error.message
        : 'Failed to recommend a settings action.',
  });
}
