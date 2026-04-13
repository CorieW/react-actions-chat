# Sub-packages

This repo includes companion packages that extend the core `actionable-support-chat` package.

Use this section when you want functionality that should stay modular instead of being bundled into the main chat UI package.

## Available Sub-packages

- [`actionable-support-chat-recommended-actions`](./actionable-support-chat-recommended-actions.md): query-driven and vector-search-backed recommended action recommenders for chat experiences

## When To Use a Sub-package

Reach for a sub-package when:

- you want optional functionality on top of the core chat package
- you only need a focused extension instead of a larger all-in-one dependency
- you want the core package to stay lightweight while adding more advanced behavior
