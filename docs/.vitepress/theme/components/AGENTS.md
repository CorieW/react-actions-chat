# docs/.vitepress/theme/components

Bridge components that mount the interactive React homepage chat demo inside the VitePress Vue theme.

## Directories

- None.

## Files

- `HomepageChatDemo.vue`: Vue wrapper that mounts the interactive homepage chat demo.
- `homepageChatDemo.ts`: React-based homepage demo logic, embedded chat styling, and shared-store reset helpers for the docs site.

## Writing Rules

- Keep `HomepageChatDemo.vue` as a thin mount-and-cleanup wrapper, and keep transcript logic, embedded styling, and demo state resets in `homepageChatDemo.ts`.
- Follow inherited AGENTS.md guidance when applicable.
