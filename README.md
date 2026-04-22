# React Actions Chat

[![codecov](https://codecov.io/gh/CorieW/react-actions-chat/graph/badge.svg?branch=main&token=pfMTdwuPfK)](https://codecov.io/gh/CorieW/react-actions-chat)

Interactive React chat UI for support flows, guided actions, confirmations, and user input collection.

## Installation

```bash
npm install react-actions-chat
```

This package targets Node.js `^22.13.0 || >=24.0.0`.

If you want query-driven or vector-search-backed action recommendations, install the companion package too:

```bash
npm install react-actions-chat react-actions-chat-recommended-actions
```

If you want reusable support-desk flows with ticketing, live-chat handoff, and admin queue management, install:

```bash
npm install react-actions-chat react-actions-chat-support
```

If you want backend-routed text generation on top of the chat UI, install the LLM companion package:

```bash
npm install react-actions-chat react-actions-chat-llms
```

## Quick Start

```tsx
import { Chat, createTextPart } from 'react-actions-chat';
import 'react-actions-chat/styles';

export function App() {
  return (
    <Chat
      allowFreeTextInput
      initialMessages={[
        {
          type: 'other',
          parts: [createTextPart('Hello! How can I help you today?')],
        },
      ]}
    />
  );
}
```

`Chat` keeps the shared input disabled by default. Use `createRequestInputButtonDef(...)` for guided collection steps, or set `allowFreeTextInput` when you want an always-on free-form chat box.

## Documentation

Read the published documentation site:

- [Getting Started](https://coriew.github.io/react-actions-chat/getting-started.html)

If you're contributing to this repo, the docs source lives in [docs](docs/index.md).

## Examples

Runnable workspace examples live in [examples](examples/README.md):

- `coding`: multiline coding-assistant flow with markdown-rendered replies
- `qa-bot`: basic support assistant flow
- `uploads`: dedicated file-upload example with image and file parts
- `login`: input and confirmation flows
- `llm-support`: companion LLM package with a local backend route and an in-chat startup API-key step
- `settings`: companion recommended-actions package with a real OpenAI embedder
- `support-desk`: companion support package with customer and admin ticket workflows

Live demos:

- `coding`: https://coriew.github.io/react-actions-chat/examples/coding/
- `qa-bot`: https://coriew.github.io/react-actions-chat/examples/qa-bot/
- `uploads`: https://coriew.github.io/react-actions-chat/examples/uploads/
- `login`: https://coriew.github.io/react-actions-chat/examples/login/
- `support-desk`: https://coriew.github.io/react-actions-chat/examples/support-desk/
- `llm-support`: https://coriew.github.io/react-actions-chat/examples/llm-support/ (starts locked until you enter an API key in chat)
- `settings`: https://coriew.github.io/react-actions-chat/examples/settings/ (published without `VITE_OPENAI_API_KEY`, so live recommendations stay disabled there)

Start one from the repo root after `pnpm install`:

```bash
pnpm --filter coding-example dev
pnpm --filter qa-bot-example dev
pnpm --filter uploads-example dev
pnpm --filter login-example dev
pnpm --filter support-desk-example dev
pnpm --filter llm-support-example dev
pnpm --filter settings-example dev
```

## Development

Use Node.js `^22.13.0 || >=24.0.0` with `pnpm`.

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
- `pnpm format:check`
- `pnpm changeset`
- `pnpm agents:check`
- `pnpm version-packages`
- `pnpm docs:dev`
- `pnpm docs:build`
- `pnpm pages:build`
- `pnpm run refresh:all`

## Contributing

Contributions are welcome.

If your pull request changes a published package, add a changeset with `pnpm changeset` unless the PR is intentionally marked with the `no-changeset` label.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
