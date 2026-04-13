import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Actionable Support Chat',
  description:
    'Consumer docs for actionable-support-chat and actionable-support-chat-recommended-actions.',
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Reference', link: '/reference/core-api' },
      { text: 'Examples', link: '/examples' },
      {
        text: 'GitHub',
        link: 'https://github.com/CorieW/actionable-support-chat',
      },
    ],
    search: {
      provider: 'local',
    },
    editLink: {
      pattern:
        'https://github.com/CorieW/actionable-support-chat/edit/master/docs/:path',
      text: 'Edit this page on GitHub',
    },
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Examples', link: '/examples' },
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
        link: 'https://github.com/CorieW/actionable-support-chat',
      },
    ],
  },
});
