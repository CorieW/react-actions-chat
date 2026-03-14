# Actionable Support Chat

[![codecov](https://codecov.io/gh/CorieW/actionable-support-chat/graph/badge.svg?branch=master&token=pfMTdwuPfK)](https://codecov.io/gh/CorieW/actionable-support-chat)

An interactive React chat component for building goal-oriented chat flows. A flow is a group of messages, buttons, and behavior that helps users complete an outcome, from simple one-click actions to multi-step settings updates.

## Features

- **Interactive Messages** - Add actionable buttons to messages for quick user responses
- **Goal-Oriented Flows** - Model messages, buttons, and behavior around a clear outcome
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

## Quick Start

```tsx
import { Chat, type ChatFlow, useChatStore } from 'actionable-support-chat';
import 'actionable-support-chat/styles';

function App() {
  const { startFlow } = useChatStore();

  let homeFlow: ChatFlow;
  let settingsFlow: ChatFlow;
  let statusFlow: ChatFlow;

  settingsFlow = {
    id: 'settings',
    initialMessage: {
      type: 'other',
      content: 'Settings flow started.',
      buttons: [{ label: 'Back', onClick: () => startFlow(homeFlow) }],
    },
  };

  statusFlow = {
    id: 'status',
    initialMessage: {
      type: 'other',
      content: 'All systems operational.',
      buttons: [{ label: 'Back', onClick: () => startFlow(homeFlow) }],
    },
  };

  homeFlow = {
    id: 'home',
    initialMessage: {
      type: 'other',
      content: 'Choose a flow to continue.',
      buttons: [
        { label: 'Open Settings Flow', onClick: () => startFlow(settingsFlow) },
        {
          label: 'Run Simple Status Flow',
          onClick: () => startFlow(statusFlow),
        },
      ],
    },
  };

  return <Chat initialFlow={homeFlow} theme='dark' />;
}
```

> **Note:** Import `actionable-support-chat/styles` to include the component styles.

## Usage Examples

See the [examples](examples) folder for examples of how to use the Chat component.

## Flow Model

Use flows to organize your chat interactions around outcomes:

- **Flow = messages + buttons + behavior (+ optional metadata)**
- Flows can be **multi-step** (for example, updating settings)
- Flows can be **simple** (for example, a one-click status check)
- Set the first active flow with `initialFlow`
- Seed a flow with either `initialMessage` or `initialMessages`
- Store extra flow context in optional `metadata`
- Trigger any flow at runtime with `startFlow(flow)`

## Development

### Building Styles

This project uses Tailwind CSS for development. The standalone CSS file (`src/styles.css`) is auto-generated:

```bash
# Generate standalone CSS from Tailwind classes
npm run build:styles

# Build the package (automatically generates styles first)
npm run build
```

**Important:** After adding new Tailwind classes to components, run `npm run build:styles` to update the standalone CSS.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Unlicense - see the [LICENSE](LICENSE) file for details.
