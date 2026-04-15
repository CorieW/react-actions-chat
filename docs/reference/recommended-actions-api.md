# Recommended Actions API Reference

Concise reference for the public exports from `react-actions-chat-recommended-actions`.

## Main Flow Creators

### `createQueryRecommendedActionsFlow(config)`

Creates a reusable flow that asks for a query, resolves recommended buttons, and renders them in the chat.

Returned API:

- `button: MessageButton`
- `start(): void`
- `recommend(query: string): Promise<void>`

Important config fields:

- `initialLabel`
- `queryPromptMessage`
- `getRecommendedActions(query, context)`
- `normalizeQuery`
- `buildRecommendationsMessage`
- `emptyStateMessage`
- `errorMessage`
- `loadingMessage`
- `minimumLoadingDurationMs`
- `validator`
- `placeholder`
- `inputDescription`

### `createRemoteRecommendedActionsFlow(config)`

Creates a query flow that posts recommendation lookups to a backend endpoint
and hydrates the returned action ids into real chat buttons.

Returned API:

- `button: MessageButton`
- `start(): void`
- `recommend(query: string): Promise<void>`

Important config fields:

- `endpoint`
- `actions`
- `createAction`
- `buildRequestBody`
- `parseResponse`
- `headers`

### `createRemoteRecommendedActionsResolver(config)`

Creates the backend-powered resolver used by
`createRemoteRecommendedActionsFlow(...)`.

### `createVectorSearchQueryRecommendedActionsFlow(config)`

Creates a semantic recommendation flow over button definitions.

Supported config shapes:

- `buttons` + `embedder`
- `buttons` + `getButtonEmbedding`
- `search` adapter

Important config fields:

- `buttons`
- `search`
- `embedder`
- `embedQuery`
- `createAction`
- `buildResult`
- `minScore`
- `maxResults`

## Backend Helpers

### `createRemoteRecommendedActionsHandler(config)`

Creates a backend helper that validates the shared request shape and returns
JSON responses for remote recommendation lookups.

Returned API:

- `handle(request): Promise<RemoteRecommendedActionsResponse>`
- `handleRequest(request: Request): Promise<Response>`

Important config fields:

- `recommend`
- `errorMessage`
- `headers`
- `onError`

## Core Types

### `VectorSearchButtonDefinition`

Searchable button definition used by the vector-search flow.

It extends a reusable action definition with metadata such as `description` and `exampleQueries` so semantically similar user prompts can map to the same button.

### `QueryRecommendedActionsContext`

Resolver context with:

- `query`
- `messages`

### `QueryRecommendedActionsFlow`

Public object returned by `createQueryRecommendedActionsFlow(...)`.

### `RemoteRecommendedActionsRequest`

Shared request payload with:

- `query`
- `messages`

### `RemoteRecommendedActionsResponse`

Shared response payload with:

- `responseMessage`
- `recommendedActions`

### `RemoteRecommendedAction`

Serializable action reference with:

- `id`
- `label`
- `variant`
- `data`

### `VectorSearchButtonMatch`

Scored result shape:

- `button`
- `score`

## Embedder Helpers

### `createOpenAITextEmbedder(config)`

Builds a `TextEmbedder` backed by OpenAI embeddings.

### `createCohereTextEmbedder(config)`

Builds a `TextEmbedder` backed by Cohere embeddings.

### `createGeminiTextEmbedder(config)`

Builds a `TextEmbedder` backed by Gemini embeddings.

### `createVoyageTextEmbedder(config)`

Builds a `TextEmbedder` backed by Voyage embeddings.

### Related Exported Types

- `TextEmbedder`
- `EmbeddingVector`
- `EmbeddingInputType`
- `EmbedTextOptions`
- `FetchLike`
- provider config types for OpenAI, Cohere, Gemini, and Voyage

## Helper Utilities

### `buildVectorSearchButtonText(button)`

Builds the search text used to represent a button definition.

### `embedTexts(...)`

Shared utility used by the vector-search flow and the exported embedder layer.

### `serializeRecommendedActionsMessages(messages)`

Converts chat store messages into the shared serializable wire format used by
the remote client and server helpers.
