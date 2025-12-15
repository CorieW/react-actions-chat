import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Actionable Support Chat',
      description:
        'A React chat component library with interactive buttons, input requests, and theming support',
      social: [
        {
          label: 'GitHub',
          icon: 'github',
          href: 'https://github.com/yourusername/actionable-support-chat',
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/' },
            { label: 'Installation', link: '/getting-started/installation/' },
            { label: 'Quick Start', link: '/getting-started/quick-start/' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Basic Usage', link: '/guides/basic-usage/' },
            { label: 'Messages', link: '/guides/messages/' },
            { label: 'Message Buttons', link: '/guides/message-buttons/' },
            {
              label: 'Request Confirmation',
              link: '/guides/request-confirmation/',
            },
            { label: 'Request Input', link: '/guides/request-input/' },
            {
              label: 'Persistent Buttons',
              link: '/guides/persistent-buttons/',
            },
            { label: 'Theming', link: '/guides/theming/' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'Chat Component', link: '/api/chat/' },
            { label: 'Types', link: '/api/types/' },
            { label: 'Stores', link: '/api/stores/' },
          ],
        },
        {
          label: 'Examples',
          items: [
            { label: 'Customer Support', link: '/examples/customer-support/' },
            {
              label: 'Account Management',
              link: '/examples/account-management/',
            },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
  outDir: './docs-dist',
});
