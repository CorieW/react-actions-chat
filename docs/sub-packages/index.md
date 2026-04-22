# Sub-packages

This repo includes companion packages that extend the core `react-actions-chat` package.

Use this section when you want functionality that should stay modular instead of being bundled into the main chat UI package.

## Available Sub-packages

- [`react-actions-chat-llms`](./react-actions-chat-llms.md): backend-routed text-generation helpers that turn a chat transcript into provider-ready LLM messages
- [`react-actions-chat-recommended-actions`](./react-actions-chat-recommended-actions.md): query-driven and vector-search-backed recommended action flows for chat experiences
- [`react-actions-chat-support`](./react-actions-chat-support.md): reusable customer and admin support-desk flows built on top of the core chat package

## When To Use a Sub-package

Reach for a sub-package when:

- you want optional functionality on top of the core chat package
- you only need a focused extension instead of a larger all-in-one dependency
- you want the core package to stay lightweight while adding more advanced behavior

## Which One To Pick

- Use `react-actions-chat-llms` when your transcript should drive backend-routed text generation.
- Use `react-actions-chat-recommended-actions` when free-form user queries should resolve into one or more recommended next-step buttons.
- Use `react-actions-chat-support` when you want prebuilt support workflows with tickets, queue review, knowledge-base search, and live-chat handoff.
