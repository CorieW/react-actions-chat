# src/components/MessageList/parts

Built-in renderers for individual message-part types used in the transcript.

## Directories

- None.

## Files

- `FilePart.tsx`: Renders non-image attachments as downloadable file cards inside the transcript.
- `ImagePart.tsx`: Renders uploaded image parts inline with optional filename and size metadata.
- `TextPart.tsx`: Renders text message parts using the built-in formatter.
- `renderPart.tsx`: Dispatches built-in message parts to the appropriate renderer.

## Writing Rules

- No additional local writing rules.
- Follow inherited AGENTS.md guidance when applicable.
