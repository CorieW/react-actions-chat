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
    'Consumer docs for react-actions-chat and its recommended-actions, support, and llms companion packages.',
  lastUpdated: true,
  themeConfig: {
    nav: [],
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
          { text: 'Use Cases', link: '/use-cases' },
          { text: 'Examples', link: '/examples' },
        ],
      },
      {
        text: 'Components',
        items: [
          { text: 'Components', link: '/components/' },
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
          { text: 'Types', link: '/types/' },
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
          { text: 'Stores', link: '/stores/' },
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
          { text: 'Sub-packages', link: '/sub-packages/' },
          {
            text: 'react-actions-chat-llms',
            link: '/sub-packages/react-actions-chat-llms',
          },
          {
            text: 'react-actions-chat-recommended-actions',
            link: '/sub-packages/react-actions-chat-recommended-actions',
          },
          {
            text: 'react-actions-chat-support',
            link: '/sub-packages/react-actions-chat-support',
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
            text: 'Using Chat Globals and Defaults',
            link: '/guides/using-chat-globals-and-defaults',
          },
          {
            text: 'Collect Input and Confirm Actions',
            link: '/guides/collecting-input-and-confirming-actions',
          },
          {
            text: 'Connect to an LLM Backend',
            link: '/guides/connect-to-an-llm-backend',
          },
          {
            text: 'Build a Support Desk',
            link: '/guides/build-a-support-desk',
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
            text: 'LLMs API',
            link: '/reference/llms-api',
          },
          {
            text: 'Recommended Actions API',
            link: '/reference/recommended-actions-api',
          },
          {
            text: 'Support API',
            link: '/reference/support-api',
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
