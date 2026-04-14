---
layout: home
title: React Actions Chat Docs
titleTemplate: false

hero:
  name: React Actions Chat
  text: Docs for guided React chat flows
  tagline: Build support chats with buttons, confirmations, shared input flows, and recommended actions.
  actions:
    - theme: brand
      text: Getting Started
      link: /getting-started
    - theme: alt
      text: Components
      link: /components/index
    - theme: alt
      text: Types
      link: /types/index

features:
  - title: Key Components
    details: Learn how Chat and the button helpers fit together.
    link: /components/index
  - title: Core Types and State
    details: Understand ChatTheme, messages, buttons, and the core data shapes used across the package.
    link: /types/index
  - title: Stores
    details: Work directly with transcript history, shared input state, and persistent buttons through the exported stores.
    link: /stores/index
  - title: Sub-packages
    details: Add optional companion functionality such as recommended-action flows without bloating the core package.
    link: /sub-packages/index
  - title: Core Chat Flows
    details: Seed conversations, add message buttons, and handle free-form follow-ups through a shared chat input.
    link: /guides/building-a-chat-flow
  - title: Input and Confirmation Helpers
    details: Collect emails, passwords, or other structured values and gate risky actions behind confirm and decline steps.
    link: /guides/collecting-input-and-confirming-actions
  - title: Recommended Actions
    details: Turn user queries into next-step buttons with a custom resolver, embeddings, or vector search.
    link: /guides/recommended-actions-overview
  - title: LLM Integrations
    details: Connect hosted text-generation providers and pipe replies back into the chat transcript with a shared responder helper.
    link: /guides/llm-integrations-overview
---

## Start Here

- New to the package: [Getting started](./getting-started.md)
- Exploring the main building blocks: [Components overview](./components/index.md)
- Reviewing the main data shapes: [Types overview](./types/index.md)
- Working directly with state: [Stores overview](./stores/index.md)
- Exploring companion packages: [Sub-packages](./sub-packages/index.md)
- Building a conversation flow: [Build a chat flow](./guides/building-a-chat-flow.md)
- Working with passwords, emails, and validated fields: [Using different input types](./guides/using-different-input-types.md)
- Collecting structured user input: [Collect input and confirmations](./guides/collecting-input-and-confirming-actions.md)
- Changing the visual style: [Theming and styling](./guides/theming-and-styling.md)
- Adding recommended action flows: [Recommended actions overview](./guides/recommended-actions-overview.md)
- Wiring semantic matching: [Recommended actions with vector search](./guides/recommended-actions-vector-search.md)
- Wiring hosted LLM replies: [LLM integrations overview](./guides/llm-integrations-overview.md)

## Run The Site Locally

```bash
pnpm docs:dev
```

Build the static site with:

```bash
pnpm docs:build
```
