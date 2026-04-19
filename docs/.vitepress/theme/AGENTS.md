# docs/.vitepress/theme

Custom VitePress theme assets that adapt the docs site branding, layout, and homepage demo.

## Directories

- `components/`: Theme-specific Vue and React bridge components used by the docs homepage and layout.

## Files

- `Layout.vue`: Custom VitePress layout wrapper for the docs site.
- `custom.css`: Custom docs-theme styles, including homepage demo styling.
- `index.ts`: Registers the custom VitePress theme and layout overrides.

## Writing Rules

- Keep theme registration and layout composition in `index.ts` and `Layout.vue`, and keep docs-wide visual overrides in `custom.css` instead of scattering them through feature components.
- Follow inherited AGENTS.md guidance when applicable.
