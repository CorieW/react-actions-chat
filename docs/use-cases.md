# Use Cases

`react-actions-chat` works best when a product needs a conversational surface that can still guide users toward explicit actions. Use this page to choose the package pieces and examples that match the flow you are building.

## Support Triage

Build a chat that starts with common support categories, collects follow-up details, and still accepts free-form questions when users need to explain the issue in their own words.

Use this when you need:

- a first-stop support assistant for orders, billing, shipping, or account questions
- category buttons that branch into more specific next steps
- a shared input bar for follow-up questions

Start with:

- [`Chat`](./components/chat.md)
- [`createButton`](./reference/core-api.md#createbutton-definition-runtimeconfig)
- [Build a chat flow](./guides/building-a-chat-flow.md)
- [`qa-bot` example](./examples.md#qa-bot)

## Guided Account Flows

Collect structured values such as email addresses, passwords, one-time codes, or confirmation text inside the chat while keeping the transcript readable.

Use this when you need:

- login, account recovery, or identity-check steps
- masked password submissions with access to the raw value
- retry and abort behavior for invalid input
- confirmation steps before changing account state

Start with:

- [Input-request buttons](./components/input-request-buttons.md)
- [Confirmation buttons](./components/confirmation-buttons.md)
- [Collect input and confirm actions](./guides/collecting-input-and-confirming-actions.md)
- [`login` example](./examples.md#login)

## Upload-Aware Assistance

Let users attach images or documents only when the current assistant step expects files, then return the input bar to a normal text mode afterward.

Use this when you need:

- support flows that request screenshots, receipts, forms, or documents
- per-step file validation
- image and file message parts in the transcript
- upload controls that stay disabled outside the active collection step

Start with:

- [Using different input types](./guides/using-different-input-types.md)
- [Input-request buttons](./components/input-request-buttons.md)
- [Core API reference](./reference/core-api.md)
- [`uploads` example](./examples.md#uploads)

## Backend-Routed LLM Chat

Keep the UI package focused on rendering and state while routing generation through your own backend endpoint.

Use this when you need:

- generated support replies
- provider keys kept out of the browser bundle
- a reusable text-generation flow around the chat UI
- a local demo route before moving to production infrastructure

Start with:

- [`react-actions-chat-llms`](./sub-packages/react-actions-chat-llms.md)
- [Connect to an LLM backend](./guides/connect-to-an-llm-backend.md)
- [LLMs API reference](./reference/llms-api.md)
- [`llm-support` example](./examples.md#llm-support)

## Recommended Next Actions

Turn a user query into a short list of action buttons so people can jump directly to the setting, workflow, or document they need.

Use this when you need:

- command-palette style recommendations in chat
- semantic matching against a catalog of actions
- vector-search-backed action discovery
- clear buttons instead of long generated answers

Start with:

- [`react-actions-chat-recommended-actions`](./sub-packages/react-actions-chat-recommended-actions.md)
- [Recommended actions overview](./guides/recommended-actions-overview.md)
- [Recommended actions with vector search](./guides/recommended-actions-vector-search.md)
- [`settings` example](./examples.md#settings)

## Shared Support Desk

Use a reusable support adapter to power both the customer chat and the admin queue from the same ticket data.

Use this when you need:

- customer-side ticket creation
- admin queue management
- ticket status changes and replies
- a testable adapter boundary before connecting a real backend

Start with:

- [`react-actions-chat-support`](./sub-packages/react-actions-chat-support.md)
- [Build a support desk](./guides/build-a-support-desk.md)
- [Support API reference](./reference/support-api.md)
- [`support-desk` example](./examples.md#support-desk)

## Coding Or Documentation Assistants

Render longer markdown replies with headings, lists, and fenced code blocks while keeping the chat input comfortable for multiline prompts.

Use this when you need:

- local coding-assistant style flows
- markdown-rendered response parts
- multiline prompts
- follow-up handling that reads the latest user message from the store

Start with:

- [Build a chat flow](./guides/building-a-chat-flow.md)
- [Theming and styling](./guides/theming-and-styling.md)
- [`Message`](./types/message.md)
- [`coding` example](./examples.md#coding)

## Choosing A Path

If you are building a guided workflow, start with request-input and confirmation buttons. If users need open-ended help, start with `allowFreeTextInput` and `userResponseCallback`. If the chat should choose from a known catalog of actions, use recommended actions before adding generated text. If the flow needs tickets, queues, or admin handling, start with the support package.
