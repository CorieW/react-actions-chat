# src/components

Public React components and button-building helpers that define the chat package's UI surface.

## Directories

- `Chat/`: Top-level chat container and persistent action UI.
- `InputBar/`: Shared input component plus its behavior, mode, and validation wiring.
- `Message/`: Message bubble rendering, loading UI, and message action buttons.
- `MessageList/`: Transcript list rendering and message-part composition helpers.
- `RequestInputButton/`: Helper modules for multi-step request-input button flows.
- `shared/`: Small styling helpers shared across component families.
- `ui/`: Low-level UI primitives consumed by higher-level chat components.

## Files

- `RequestConfirmationButton.tsx`: Confirmation-button definitions and the runtime flow that asks the user to confirm or reject an action.
- `RequestInputButton.tsx`: Public entry point for request-input button definitions and flow creation.
- `createButton.ts`: Shared factory that turns plain, request-input, and confirmation definitions into runtime buttons.
- `index.ts`: Public component-layer barrel exports.

## Writing Rules

- No additional local writing rules.
- Follow inherited AGENTS.md guidance when applicable.
