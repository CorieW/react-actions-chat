---
layout: home
title: Actionable Support Chat Docs
titleTemplate: false

hero:
  name: Actionable Support Chat
  text: Docs for guided React chat flows
  tagline: Build support chats with buttons, confirmations, shared input flows, and recommended actions.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: Build a Chat Flow
      link: /guides/building-a-chat-flow
    - theme: alt
      text: Recommended Actions
      link: /guides/recommended-actions-overview

features:
  - title: Core Chat Flows
    details: Seed conversations, add message buttons, and handle free-form follow-ups through a shared chat input.
    link: /guides/building-a-chat-flow
  - title: Input and Confirmation Helpers
    details: Collect emails, passwords, or other structured values and gate risky actions behind confirm and decline steps.
    link: /guides/collecting-input-and-confirming-actions
  - title: Recommended Actions
    details: Turn user queries into next-step buttons with a custom resolver, embeddings, or vector search.
    link: /guides/recommended-actions-overview
  - title: API Reference
    details: Look up the exported components, types, stores, and companion package helpers in one place.
    link: /reference/core-api
---

## Start Here

- New to the package: [Getting started](./getting-started.md)
- Building a conversation flow: [Build a chat flow](./guides/building-a-chat-flow.md)
- Collecting structured user input: [Collect input and confirmations](./guides/collecting-input-and-confirming-actions.md)
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
