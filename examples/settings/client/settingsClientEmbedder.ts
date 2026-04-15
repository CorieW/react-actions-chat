import {
  createCohereTextEmbedder,
  createGeminiTextEmbedder,
  createOpenAITextEmbedder,
  createVoyageTextEmbedder,
  type TextEmbedder,
} from 'react-actions-chat-recommended-actions';

export const SETTINGS_EMBEDDER_PROVIDER_IDS = [
  'openai',
  'cohere',
  'gemini',
  'voyage',
] as const;

export type SettingsEmbedderProviderId =
  (typeof SETTINGS_EMBEDDER_PROVIDER_IDS)[number];

interface SettingsEmbedderProviderDefinition {
  readonly id: SettingsEmbedderProviderId;
  readonly label: string;
  readonly description: string;
  readonly apiKeyPlaceholder: string;
}

/**
 * Browser-side embedder providers supported by the settings example.
 */
export const SETTINGS_EMBEDDER_PROVIDERS: readonly SettingsEmbedderProviderDefinition[] =
  [
    {
      id: 'openai',
      label: 'OpenAI',
      description:
        'Uses OpenAI embeddings directly from the browser for semantic settings matching.',
      apiKeyPlaceholder: 'sk-proj-...',
    },
    {
      id: 'cohere',
      label: 'Cohere',
      description:
        "Uses Cohere's embed API with retrieval-aware query and document modes.",
      apiKeyPlaceholder: 'your-cohere-api-key',
    },
    {
      id: 'gemini',
      label: 'Gemini',
      description:
        'Uses the Gemini embeddings API directly from the browser for semantic settings matching.',
      apiKeyPlaceholder: 'AIza...',
    },
    {
      id: 'voyage',
      label: 'Voyage AI',
      description:
        'Uses Voyage AI embeddings directly from the browser for semantic settings matching.',
      apiKeyPlaceholder: 'pa-...',
    },
  ];

const DEFAULT_SETTINGS_EMBEDDER_PROVIDER_ID: SettingsEmbedderProviderId =
  'openai';

const PROVIDER_MAP = new Map(
  SETTINGS_EMBEDDER_PROVIDERS.map(provider => [provider.id, provider])
);

/**
 * Returns the provider definition used by the browser-side selector UI.
 */
export function getSettingsEmbedderProvider(
  providerId: SettingsEmbedderProviderId
): SettingsEmbedderProviderDefinition {
  return (
    PROVIDER_MAP.get(providerId) ??
    PROVIDER_MAP.get(DEFAULT_SETTINGS_EMBEDDER_PROVIDER_ID)!
  );
}

/**
 * Trims user-entered API keys before the example uses them.
 */
export function normalizeEmbedderApiKey(rawApiKey: string): string {
  return rawApiKey.trim();
}

/**
 * Creates the browser-side embedder used by the settings example.
 */
export function createSettingsClientEmbedder(args: {
  readonly providerId: SettingsEmbedderProviderId;
  readonly apiKey: string;
}): TextEmbedder | null {
  const apiKey = normalizeEmbedderApiKey(args.apiKey);

  if (apiKey === '') {
    return null;
  }

  if (args.providerId === 'cohere') {
    return createCohereTextEmbedder({
      apiKey,
    });
  }

  if (args.providerId === 'voyage') {
    return createVoyageTextEmbedder({
      apiKey,
    });
  }

  if (args.providerId === 'gemini') {
    return createGeminiTextEmbedder({
      apiKey,
    });
  }

  return createOpenAITextEmbedder({
    apiKey,
  });
}
