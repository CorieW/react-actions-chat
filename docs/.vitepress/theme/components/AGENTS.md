# docs/.vitepress/theme/components

Bridge components that mount the interactive React homepage chat demo inside the VitePress Vue theme.

## Directories

- None.

## Files

- `HomepageChatDemo.vue`: Thin Vue wrapper that mounts the interactive docs chat.
- `homepageChatDemo.ts`: Thin re-export that points the Vue wrapper at the shared `docs-chat` implementation.

## Writing Rules

- Keep `HomepageChatDemo.vue` as a thin mount-and-cleanup wrapper, and keep transcript logic, embedded styling, and demo state resets in `docs-chat/frontend/homepageChatDemo.ts`.
- Follow inherited AGENTS.md guidance when applicable.
