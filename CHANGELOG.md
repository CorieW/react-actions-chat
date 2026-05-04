# react-actions-chat

## 1.1.2

### Patch Changes

- 1cbb427: - Disable transcript and persistent action buttons while shared chat loading is active, and briefly lock actions immediately after a click to prevent duplicate activations before loading appears.
  - Keep async action callbacks from releasing newer action-button locks after a chat reset or remount.
  - Keep label-only action buttons inert so buttons without click handlers do not briefly lock all actions.
- 1cbb427: - Track chat loading-state writes and chat lifecycle resets so delayed support loaders do not clear or reclaim newer loading owners.
  - Add paged ticket-list responses with request offsets so customer and admin flows can continue through backend-limited ticket result sets.
  - Show the chat loading indicator while support adapter and callback operations stay pending.

## 1.1.1

### Patch Changes

- c2cfc8e: - Regenerate published styles so the Tailwind `filter` utility remains in sync with the workspace source scan.

## 1.1.0

### Minor Changes

- 3858c8b: Add select input support to guided request flows. The main package now exports `InputSelectOption`, stores select options on the shared input field, renders `select` mode in `InputBar`, and lets request input buttons pass options with `inputOptions`.

## 1.0.2

### Patch Changes

- bdecfc8: Move `@types/react-syntax-highlighter` into published dependencies so TypeScript consumers that typecheck package source receive declarations for the built-in markdown code block renderer.

## 1.0.1

### Patch Changes

- b976874: Add npm package metadata including descriptions, keywords, author, repository links, and side-effect hints.
