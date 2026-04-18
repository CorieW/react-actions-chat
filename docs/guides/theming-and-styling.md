# Theming and Styling

The chat ships with bundled styles and a small theme object that controls the main color tokens.

## Required Style Import

Import the bundled stylesheet once in your app:

```tsx
import 'react-actions-chat/styles';
```

Without that import, the component will render without its packaged styling.

## Theme Presets

`Chat` accepts:

- `'dark'`
- `'light'`
- a partial or complete [`ChatTheme`](../types/chat-theme.md) object

```tsx
<Chat theme='light' />
<Chat theme='dark' />
```

If you pass a custom object, it is merged over the built-in dark theme so omitted fields still get defaults.

## Custom Theme Example

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

For the full `ChatTheme` shape and token list, see [`ChatTheme`](../types/chat-theme.md).

## Theme Helpers

The library also exports:

- `LIGHT_THEME`
- `DARK_THEME`
- `getResolvedTheme(theme)`
- `getThemeStyles(theme)`

These are useful when you want to build matching custom UI outside the chat component.

## Vite Note

If you use the package in a Vite app and hit duplicate React issues such as `resolveDispatcher() is null`, add the exported Vite plugin:

```ts typecheck
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reactActionsChatVitePlugin } from 'react-actions-chat/vite-plugin';

export default defineConfig({
  plugins: [react(), reactActionsChatVitePlugin()],
});
```

This deduplicates `react` and `react-dom`. The runnable `login` and `qa-bot` examples in this repo both use it.
