# packages/react-actions-chat-llms/src/chatTextGenerationFlow

Internal modules for the transcript-aware chat text-generation flow.

## Directories

- None.

## Files

- `createChatTextGenerationFlow.ts`: Factory that wires chat store hooks, context creation, and generator callbacks into the flow runtime.
- `index.ts`: Internal export barrel for the chat text-generation flow modules.
- `messages.ts`: Default assistant and error message factories used by the flow.
- `transcript.ts`: Pure transcript normalization helpers that convert chat messages to LLM messages and prepend system prompts.
- `types.ts`: Chat text-generation flow contracts and callback context types.

## Writing Rules

- Keep public flow contracts in `types.ts`, pure transcript conversion in `transcript.ts`, default message formatting in `messages.ts`, and chat-store orchestration in `createChatTextGenerationFlow.ts`.
- Follow inherited AGENTS.md guidance when applicable.
