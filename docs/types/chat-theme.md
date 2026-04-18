# `ChatTheme`

`ChatTheme` controls the color tokens used throughout the chat UI.

## Fields

- `primaryColor`
- `secondaryColor`
- `backgroundColor`
- `textColor`
- `borderColor`
- `inputBackgroundColor`
- `inputTextColor`
- `buttonColor`
- `buttonTextColor`

## Usage

Pass a `ChatTheme` object to the `theme` prop on `Chat`:

```tsx typecheck
import { Chat, type ChatTheme } from 'react-actions-chat';

const supportTheme: ChatTheme = {
  primaryColor: '#0f766e',
  secondaryColor: '#e6f3ee',
  backgroundColor: '#fffaf3',
  textColor: '#17302d',
  borderColor: '#d4e4dc',
  inputBackgroundColor: '#fffdf8',
  inputTextColor: '#17302d',
  buttonColor: '#145c52',
  buttonTextColor: '#f8faf9',
};

export function App() {
  return <Chat theme={supportTheme} />;
}
```

Custom theme objects are merged over the built-in dark theme by the package helpers.
