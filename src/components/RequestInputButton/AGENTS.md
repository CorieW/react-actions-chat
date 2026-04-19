# src/components/RequestInputButton

Modules that implement reusable request-input button definitions and the runtime flow that reconfigures the shared input.

## Directories

- None.

## Files

- `config.ts`: Merges request-input button config with chat-level defaults.
- `constants.ts`: Shared constants for request-input button flows.
- `definitions.ts`: Factory for reusable request-input button definitions.
- `flow.ts`: Runtime implementation of the request-input button flow.
- `inputField.ts`: Helpers for configuring, resetting, and guarding the shared input during request-input flows.
- `messageFormatter.ts`: Builds helper messages for rate limits, cooldowns, and timeouts in request-input flows.
- `messageList.ts`: Adds prompt, validation, and timeout messages for request-input flows.
- `types.ts`: Type definitions for request-input button configuration and runtime overrides.

## Writing Rules

- No additional local writing rules.
- Follow inherited AGENTS.md guidance when applicable.
