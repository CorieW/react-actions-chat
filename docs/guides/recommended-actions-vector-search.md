# Recommended Actions With Vector Search

This guide covers semantic matching with `createVectorSearchQueryRecommendedActionsFlow`.

The best runnable reference in this repo is [examples/settings/client/App.tsx](https://github.com/CorieW/react-actions-chat/blob/main/examples/settings/client/App.tsx).

## Button Definitions

Vector search works with `VectorSearchButtonDefinition`, which extends a normal reusable button definition with search-friendly metadata.

Typical fields include:

- the base button definition itself
- `description` for what the action does
- `exampleQueries` for phrases users are likely to type

Those fields are turned into search text with `buildVectorSearchButtonText(...)`.

## Three Supported Configurations

### 1. Text Buttons + Embedder

Pass `buttons` plus an `embedder`. The flow embeds the button text for you and runs in-memory similarity search.

This is the shape used by the `settings` example.

### 2. Precomputed Button Embeddings

Pass `buttons` plus `getButtonEmbedding(button)` when you already have vectors stored or generated elsewhere.

### 3. Hosted Search Adapter

Pass `search(args)` when your vector database already handles retrieval and scoring.

## Example Shape

```tsx
import {
  createOpenAITextEmbedder,
  createVectorSearchQueryRecommendedActionsFlow,
  type VectorSearchButtonDefinition,
} from 'react-actions-chat-recommended-actions';

const buttons: readonly VectorSearchButtonDefinition[] = [
  {
    id: 'email',
    kind: 'request-input',
    initialLabel: 'Change email',
    inputPromptMessage: 'Enter your new email address.',
    description: 'Update the email address on the account.',
    exampleQueries: ['change my email', 'update email address'],
  },
];

const embedder = createOpenAITextEmbedder({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

const flow = createVectorSearchQueryRecommendedActionsFlow({
  initialLabel: 'Find the right setting',
  buttons,
  embedder,
});
```

## Search Responsibilities

When you provide a hosted `search` adapter, your adapter is responsible for:

- embedding or otherwise interpreting the incoming query
- retrieving the best matching buttons
- returning matches in score order as `{ button, score }`

The flow then applies `minScore`, `maxResults`, and action rendering behavior.

## Customization Hooks

Useful hooks on the vector-search flow config:

- `createAction` to turn a match into a custom button
- `buildResult` to customize the full recommendation response
- `embedQuery` to override how query embedding is produced
- `minScore` and `maxResults` to control filtering

## Provider Helpers

The package exports ready-made embedders for:

- OpenAI via `createOpenAITextEmbedder`
- Cohere via `createCohereTextEmbedder`
- Voyage via `createVoyageTextEmbedder`

All three are convenient for demos and app integrations, but production apps should usually call them from backend code rather than the browser.
