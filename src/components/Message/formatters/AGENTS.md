# src/components/Message/formatters

Message-part formatters used by the transcript to render structured content inside a message bubble.

## Directories

- None.

## Files

- `FormattedTextPart.tsx`: Adapter component that routes text parts through the current text formatter.
- `MarkdownTextFormatter.tsx`: Built-in formatter that renders markdown text parts with headings, lists, links, and code blocks.
- `PlainTextFormatter.tsx`: Default formatter that renders plain text with preserved whitespace and wrapping.

## Writing Rules

- Keep `FormattedTextPart.tsx` as the format switch, and keep format-specific rendering inside dedicated formatter components that share the same `{ part, theme }` prop contract.
- Keep formatter behavior presentation-only: formatters should render from the part data they receive without mutating message state or transcript flow.
- Follow inherited AGENTS.md guidance when applicable.
