# Actionable Support Chat

[![codecov](https://codecov.io/gh/CorieW/actionable-support-chat/graph/badge.svg?branch=master&token=pfMTdwuPfK)](https://codecov.io/gh/CorieW/actionable-support-chat)

Interactive React chat UI for support flows, guided actions, confirmations, and user input collection.

## Installation

```bash
npm install actionable-support-chat
```

This package targets Node.js `22.13.0+`.

If you want query-driven or vector-search-backed action recommendations, install the companion package too:

```bash
npm install actionable-support-chat actionable-support-chat-recommended-actions
```

## Quick Start

```tsx
import { Chat } from 'actionable-support-chat';
import 'actionable-support-chat/styles';

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

Check out the [documentation](docs/index.md) for more information.

## Examples

Runnable workspace examples live in [examples](examples/README.md):

- `qa-bot`: basic support assistant flow
- `login`: input and confirmation flows
- `settings`: companion recommended-actions package with a real OpenAI embedder

Start one from the repo root after `pnpm install`:

```bash
pnpm --filter qa-bot-example dev
pnpm --filter login-example dev
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
- `pnpm docs:dev`
- `pnpm docs:build`
- `pnpm run refresh:all`

## License

This project is licensed under the Unlicense. See [LICENSE](LICENSE).
