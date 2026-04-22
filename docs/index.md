---
layout: home
title: React Actions Chat Docs
titleTemplate: false

hero:
  name: React Actions Chat
  text: Docs for guided React chat flows
  tagline: Build support chats with buttons, confirmations, upload-aware shared input flows, and companion packages for recommendations, support desks, and LLM replies.
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
    details: Add optional companion functionality such as recommended-action flows, reusable support workflows, and backend-routed text generation without bloating the core package.
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
  - title: Uploads and Shared Input
    details: Configure text, password, email, search, and upload-aware request flows through the same shared input bar.
    link: /guides/using-different-input-types
---

## Start Here

- New to the package: [Getting started](./getting-started.md)
- Exploring the main building blocks: [Components overview](./components/index.md)
- Reviewing the main data shapes: [Types overview](./types/index.md)
- Working directly with state: [Stores overview](./stores/index.md)
- Exploring companion packages: [Sub-packages](./sub-packages/index.md)
- Adding backend-routed text generation: [react-actions-chat-llms](./sub-packages/react-actions-chat-llms.md)
- Building reusable support workflows: [react-actions-chat-support](./sub-packages/react-actions-chat-support.md)
- Building a conversation flow: [Build a chat flow](./guides/building-a-chat-flow.md)
- Working with passwords, emails, uploads, and validated fields: [Using different input types](./guides/using-different-input-types.md)
- Setting chat-wide request defaults: [Using chat globals and defaults](./guides/using-chat-globals-and-defaults.md)
- Collecting structured user input: [Collect input and confirmations](./guides/collecting-input-and-confirming-actions.md)
- Connecting backend-routed generation: [Connect to an LLM backend](./guides/connect-to-an-llm-backend.md)
- Building a reusable customer/admin workspace: [Build a support desk](./guides/build-a-support-desk.md)
- Changing the visual style: [Theming and styling](./guides/theming-and-styling.md)
- Adding recommended action flows: [Recommended actions overview](./guides/recommended-actions-overview.md)
- Wiring semantic matching: [Recommended actions with vector search](./guides/recommended-actions-vector-search.md)

## Run The Site Locally

```bash
pnpm docs:dev
```

Build the static site with:

```bash
pnpm docs:build
```
