# Recommended Actions Overview

Use `react-actions-chat-recommended-actions` when you want a user query to resolve into one or more next-step buttons.

Install it alongside the core package:

```bash
npm install react-actions-chat react-actions-chat-recommended-actions
```

## When To Use It

Use the companion package when:

- users describe what they need in free-form text
- you want to suggest the best next actions instead of matching every intent by hand
- you want the result to stay inside the chat UI as normal buttons

Use the core package alone when your flows are fully scripted and you already know which buttons to show.

## Two Main Paths

### Query-Based Recommendations

`createQueryRecommendedActionsFlow` asks the user for a query, calls your resolver, and renders the buttons you return.

Choose this when:

- you already have your own search or rules engine
- you want to call a backend endpoint that returns recommended actions
- you do not need embedding-based similarity inside the package

If you already know the frontend should talk to a backend endpoint, use
`createRemoteRecommendedActionsFlow` to handle the fetch, shared payload
shape, and client-side button hydration for you.

### Vector-Search Recommendations

`createVectorSearchQueryRecommendedActionsFlow` is built for semantic matching over button definitions.

Choose this when:

- users phrase the same request in many different ways
- you want embeddings to help match the right action
- you want either in-memory matching or a hosted vector-search adapter

## Basic Query Flow Example

```tsx
import { useMemo } from 'react';
import { createButton } from 'react-actions-chat';
import { createQueryRecommendedActionsFlow } from 'react-actions-chat-recommended-actions';

const flow = createQueryRecommendedActionsFlow({
  initialLabel: 'Find help',
  getRecommendedActions: query => {
    if (query.toLowerCase().includes('password')) {
      return [
        createButton({
          label: 'Reset password',
          onClick: () => {
            console.log('Start password reset');
          },
        }),
      ];
    }

    return {
      responseMessage: `I could not find a direct match for "${query}".`,
      recommendedActions: [],
    };
  },
});
```

The returned object exposes:

- `button` to attach to a message
- `start()` to launch the flow programmatically
- `recommend(query)` to skip the prompt and resolve directly

## Production Guidance

The `examples/settings` app in this repo keeps the demo simple by collecting the
embedder provider and API key in the browser. Production apps should usually
follow a backend-driven pattern instead so provider keys stay on a trusted
backend instead of in the browser.

For backend-driven recommendations, the package also exports:

- `react-actions-chat-recommended-actions/client` for the frontend flow helper
- `react-actions-chat-recommended-actions/server` for a JSON handler helper
- `react-actions-chat-recommended-actions/shared` for the shared request and response types
