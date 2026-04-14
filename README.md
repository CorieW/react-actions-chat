# React Actions Chat

[![codecov](https://codecov.io/gh/CorieW/react-actions-chat/graph/badge.svg?branch=main&token=pfMTdwuPfK)](https://codecov.io/gh/CorieW/react-actions-chat)

Interactive React chat UI for support flows, guided actions, confirmations, and user input collection.

## Installation

```bash
npm install react-actions-chat
```

This package targets Node.js `22.13.0+`.

If you want query-driven or vector-search-backed action recommendations, install the companion package too:

```bash
npm install react-actions-chat react-actions-chat-recommended-actions
```

If you want lightweight adapters for hosted LLM providers such as OpenAI, Anthropic, or Gemini, install the LLM companion package:

```bash
npm install react-actions-chat react-actions-chat-llms
```

## Quick Start

```tsx
import { Chat } from 'react-actions-chat';
import 'react-actions-chat/styles';

export function App() {
  return (
    <Chat
      initialMessages={[
        {
          type: 'other',
          content: 'Hello! How can I help you today?',
        },
      ]}
    />
  );
}
```

## Documentation

Read the published documentation site:

- [Getting Started](https://coriew.github.io/react-actions-chat/getting-started.html)

If you're contributing to this repo, the docs source lives in [docs](docs/index.md).

## Examples

Runnable workspace examples live in [examples](examples/README.md):

- `qa-bot`: basic support assistant flow
- `login`: input and confirmation flows
- `llm-support`: companion LLM package with an OpenAI chat demo backed by a local server route
- `settings`: companion recommended-actions package with a real OpenAI embedder

Companion packages:

- `react-actions-chat-recommended-actions`: query-driven and vector-search-backed recommended action flows
- `react-actions-chat-llms`: hosted LLM adapters plus a chat responder helper for OpenAI, Anthropic, and Gemini

Live demos:

- `qa-bot`: https://coriew.github.io/react-actions-chat/examples/qa-bot/
- `login`: https://coriew.github.io/react-actions-chat/examples/login/
- `llm-support`: source only for now because the live version would require exposing provider API keys
- `settings`: source only for now because the live version would require exposing an API key

Start one from the repo root after `pnpm install`:

```bash
pnpm --filter qa-bot-example dev
pnpm --filter login-example dev
pnpm --filter llm-support-example dev
pnpm --filter settings-example dev
```

## Development

Use Node.js `22.13.0` or newer with `pnpm`.

```bash
corepack enable
pnpm install
pnpm build
```

Useful scripts:

- `pnpm test`
- `pnpm test:coverage`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm changeset`
- `pnpm version-packages`
- `pnpm docs:dev`
- `pnpm docs:build`
- `pnpm pages:build`
- `pnpm run refresh:all`

When a pull request changes a published package, add a changeset with `pnpm changeset` unless the PR is intentionally marked with the `no-changeset` label.
Merging changesets to `main` opens or updates a release PR, and merging that release PR publishes to npm when the repo has an `NPM_TOKEN` secret configured.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
