# Theming and Styling

The chat ships with bundled styles and a small theme object that controls the main color tokens.

## Required Style Import

Import the bundled stylesheet once in your app:

```tsx
import 'actionable-support-chat/styles';
```

Without that import, the component will render without its packaged styling.

## Theme Presets

`Chat` accepts:

- `'dark'`
- `'light'`
- a partial or complete `ChatTheme` object

```tsx
<Chat theme='light' />
<Chat theme='dark' />
```

If you pass a custom object, it is merged over the built-in dark theme so omitted fields still get defaults.

## Custom Theme Example

```tsx
import { Chat, type ChatTheme } from 'actionable-support-chat';

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

`ChatTheme` includes these tokens:

- `primaryColor`
- `secondaryColor`
- `backgroundColor`
- `textColor`
- `borderColor`
- `inputBackgroundColor`
- `inputTextColor`
- `buttonColor`
- `buttonTextColor`

## Theme Helpers

The library also exports:

- `LIGHT_THEME`
- `DARK_THEME`
- `getResolvedTheme(theme)`
- `getThemeStyles(theme)`

These are useful when you want to build matching custom UI outside the chat component.

## Vite Note

If you use the package in a Vite app and hit duplicate React issues such as `resolveDispatcher() is null`, add the exported Vite plugin:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { actionableSupportChatVitePlugin } from 'actionable-support-chat/vite-plugin';

export default defineConfig({
  plugins: [react(), actionableSupportChatVitePlugin()],
});
```

This deduplicates `react` and `react-dom`. The runnable `login` and `qa-bot` examples in this repo both use it.

## Related Docs

- [Getting started](../getting-started.md)
- [Collect input and confirmations](collecting-input-and-confirming-actions.md)
- [Core API reference](../reference/core-api.md)
- [Examples guide](../examples.md)
