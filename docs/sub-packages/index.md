# Sub-packages

This repo includes companion packages that extend the core `react-actions-chat` package.

Use this section when you want functionality that should stay modular instead of being bundled into the main chat UI package.

## Available Sub-packages

- [`react-actions-chat-recommended-actions`](./react-actions-chat-recommended-actions.md): query-driven and vector-search-backed recommended action flows for chat experiences
- [`react-actions-chat-llms`](./react-actions-chat-llms.md): hosted LLM provider adapters and a chat responder helper for transcript-driven replies

## When To Use a Sub-package

Reach for a sub-package when:

- you want optional functionality on top of the core chat package
- you only need a focused extension instead of a larger all-in-one dependency
- you want the core package to stay lightweight while adding more advanced behavior
