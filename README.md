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

## Quick Start

```tsx
import { Chat } from 'actionable-support-chat';
import 'actionable-support-chat/styles';

function App() {
  const initialMessages = [
    {
      type: 'other',
      content: 'Hello! How can I help you today?',
      buttons: [
        {
          label: 'Get Support',
          onClick: () => console.log('Support requested'),
        },
      ],
    },
  ];

  return <Chat initialMessages={initialMessages} theme='dark' />;
}
```

> **Note:** Import `actionable-support-chat/styles` to include the component styles.

## Usage Examples

See the [examples](examples) folder for examples of how to use the Chat component.

## Development

Use Node.js `22.13.0` or newer.

This repo uses `pnpm` workspaces for the core package, companion packages, and local examples.

```bash
corepack enable
pnpm install
```

### Building Styles

This project uses Tailwind CSS for development. The standalone CSS file (`src/styles.css`) is auto-generated:

```bash
# Generate standalone CSS from Tailwind classes
pnpm build:styles

# Build the package (automatically generates styles first)
pnpm build
```

**Important:** After adding new Tailwind classes to components, run `pnpm build:styles` to update the standalone CSS.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Unlicense - see the [LICENSE](LICENSE) file for details.
