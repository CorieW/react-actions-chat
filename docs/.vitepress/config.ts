import { defineConfig } from 'vitepress';

/**
 * Keeps the docs base path safe for local development and static hosting.
 */
function normalizeBasePath(rawBasePath?: string): string {
  if (!rawBasePath || rawBasePath === '/') {
    return '/';
  }

  const trimmedBasePath = rawBasePath.trim().replace(/^\/+|\/+$/g, '');

  return trimmedBasePath ? `/${trimmedBasePath}/` : '/';
}

export default defineConfig({
  base: normalizeBasePath(process.env.DOCS_BASE_PATH),
  title: 'React Actions Chat',
  description:
    'Consumer docs for react-actions-chat and react-actions-chat-recommended-actions.',
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: 'Components', link: '/components/index' },
      { text: 'Types', link: '/types/index' },
      { text: 'Stores', link: '/stores/index' },
      { text: 'Sub-packages', link: '/sub-packages/index' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Reference', link: '/reference/core-api' },
      { text: 'Examples', link: '/examples' },
      {
        text: 'GitHub',
        link: 'https://github.com/CorieW/react-actions-chat',
      },
    ],
    search: {
      provider: 'local',
    },
    editLink: {
      pattern:
        'https://github.com/CorieW/react-actions-chat/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Docs Home', link: '/' },
          { text: 'Examples', link: '/examples' },
        ],
      },
      {
        text: 'Components',
        items: [
          { text: 'Components', link: '/components/index' },
          { text: 'Chat', link: '/components/chat' },
          {
            text: 'Plain Message Buttons',
            link: '/components/plain-message-buttons',
          },
          {
            text: 'Input-Request Buttons',
            link: '/components/input-request-buttons',
          },
          {
            text: 'Confirmation Buttons',
            link: '/components/confirmation-buttons',
          },
          {
            text: 'Persistent Buttons',
            link: '/components/persistent-buttons',
          },
        ],
      },
      {
        text: 'Types',
        items: [
          { text: 'Types', link: '/types/index' },
          { text: 'ChatTheme', link: '/types/chat-theme' },
          { text: 'InputMessage', link: '/types/input-message' },
          { text: 'Message', link: '/types/message' },
          { text: 'MessageButton', link: '/types/message-button' },
          { text: 'InputType', link: '/types/input-type' },
          {
            text: 'InputValidationResult',
            link: '/types/input-validation-result',
          },
          { text: 'InputValidator', link: '/types/input-validator' },
        ],
      },
      {
        text: 'Stores',
        items: [
          { text: 'Stores', link: '/stores/index' },
          { text: 'useChatStore', link: '/stores/use-chat-store' },
          {
            text: 'useInputFieldStore',
            link: '/stores/use-input-field-store',
          },
          {
            text: 'usePersistentButtonStore',
            link: '/stores/use-persistent-button-store',
          },
        ],
      },
      {
        text: 'Sub-packages',
        items: [
          { text: 'Sub-packages', link: '/sub-packages/index' },
          {
            text: 'react-actions-chat-recommended-actions',
            link: '/sub-packages/react-actions-chat-recommended-actions',
          },
        ],
      },
      {
        text: 'Guides',
        items: [
          {
            text: 'Build a Chat Flow',
            link: '/guides/building-a-chat-flow',
          },
          {
            text: 'Using Different Input Types',
            link: '/guides/using-different-input-types',
          },
          {
            text: 'Collect Input and Confirm Actions',
            link: '/guides/collecting-input-and-confirming-actions',
          },
          {
            text: 'Theming and Styling',
            link: '/guides/theming-and-styling',
          },
          {
            text: 'Recommended Actions Overview',
            link: '/guides/recommended-actions-overview',
          },
          {
            text: 'Recommended Actions With Vector Search',
            link: '/guides/recommended-actions-vector-search',
          },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Core API', link: '/reference/core-api' },
          {
            text: 'Recommended Actions API',
            link: '/reference/recommended-actions-api',
          },
        ],
      },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/CorieW/react-actions-chat',
      },
    ],
  },
});
