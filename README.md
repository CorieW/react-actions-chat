# Actionable Support Chat

[![codecov](https://codecov.io/gh/CorieW/actionable-support-chat/graph/badge.svg?branch=master&token=pfMTdwuPfK)](https://codecov.io/gh/CorieW/actionable-support-chat)

An interactive React chat component with support for actionable buttons, confirmations, and user input collection. Perfect for building support chat interfaces, customer service bots, or interactive conversations that require user actions.

## Features

- **Interactive Messages** - Add actionable buttons to messages for quick user responses
- **Confirmation Dialogs** - Built-in support for confirmation requests (e.g., account deletion)
- **Persistent Buttons** - Buttons that remain accessible throughout the conversation
- **Customizable Themes** - Built-in light/dark themes with full customization options
- **TypeScript Support** - Fully typed for better developer experience
- **Responsive Design** - Mobile-friendly chat interface
- **Validation Support** - Request and validate user input directly in the chat (email, password, etc.)

## Installation

```bash
npm install actionable-support-chat
```

This package targets Node.js `22.13.0+`.

If you want query-driven recommendation flows or embedding helpers, install the companion package:

```bash
npm install actionable-support-chat-recommended-actions
```

## Quick Start

```tsx
import { Chat } from "actionable-support-chat";
import "actionable-support-chat/styles";

function App() {
  const initialMessages = [
    {
      type: "other",
      content: "Hello! How can I help you today?",
      buttons: [
        {
          label: "Get Support",
          onClick: () => console.log("Support requested"),
        },
      ],
    },
  ];

  return <Chat initialMessages={initialMessages} theme="dark" />;
}
```

> **Note:** Import `actionable-support-chat/styles` to include the component styles.

## Usage Examples

See the [examples](examples) folder for examples of how to use the Chat component.

### Recommended Actions Package

Reusable recommended-action flows now live in the companion package `actionable-support-chat-recommended-actions`.

```tsx
import {
  createQueryRecommendedActionsFlow,
  createVectorSearchQueryRecommendedActionsFlow,
} from "actionable-support-chat-recommended-actions";
import "actionable-support-chat/styles";
```

It includes:

- `createQueryRecommendedActionsFlow`
- `createVectorSearchQueryRecommendedActionsFlow` for semantic retrieval over button definitions
- built-in embedders for OpenAI, Cohere, and Voyage

See [packages/actionable-support-chat-recommended-actions/README.md](packages/actionable-support-chat-recommended-actions/README.md) and the [examples/settings](examples/settings) app for a working setup.

The `examples/settings` app uses a real OpenAI embedder to recommend actions from the user's prompt. For simplicity it reads `VITE_OPENAI_API_KEY` in the browser, which is appropriate for a demo but not for production. In a production app, proxy embedding requests through your own backend.

## Development

Use Node.js `22.13.0` or newer.

### Refreshing Local Outputs

This repo includes a refresh script that clears generated build output and Vite
caches across the root package, local packages, and examples:

```bash
# Clear dist folders and Vite caches across the repo
npm run refresh:all
```

Use this when a local example or package seems to be serving stale code.

### Building Styles

This project uses Tailwind CSS for development. The standalone CSS file (`src/styles.css`) is auto-generated:

```bash
# Generate standalone CSS from Tailwind classes
npm run build:styles

# Build the package (automatically runs refresh:all and generates styles first)
npm run build
```

**Important:** After adding new Tailwind classes to components, run `npm run build:styles` to update the standalone CSS.

If a Vite dev server is already running, `npm run build` will not restart that
live process. In that case, restart the dev server after the build so it picks
up the refreshed output and cleared caches.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Unlicense - see the [LICENSE](LICENSE) file for details.
