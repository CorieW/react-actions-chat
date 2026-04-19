# Chat Component Examples

This folder contains runnable workspace examples demonstrating different use cases of the Chat component.

## Examples

- **coding** - A coding assistant demo that highlights multiline prompts and markdown-rendered replies
- **qa-bot** - A simple question and answer bot that responds to user queries
- **login** - A login flow using email and password inputs
- **llm-support** - A backend-routed LLM support demo powered by the companion `react-actions-chat-llms` package
  -- **settings** - A settings page that uses the companion recommended-actions package and a real OpenAI embedder to recommend settings actions from a user query
- **support-desk** - A shared customer/admin support workspace powered by `react-actions-chat-support`

You can also build reusable recommended-action flows with the companion `react-actions-chat-recommended-actions` package, support-desk workflows with `react-actions-chat-support`, and backend-routed text generation with `react-actions-chat-llms`.

## Running an Example

Each example is a workspace package that resolves `react-actions-chat` through the repo's shared `pnpm` workspace.

### Prerequisites

Make sure you have Node.js and `pnpm` available. If needed, run `corepack enable` first.

### Steps

1. Install workspace dependencies from the repo root:

   ```bash
   pnpm install
   ```

2. Start an example from the repo root:

   ```bash
   pnpm --filter qa-bot-example dev
   # or
   pnpm --filter coding-example dev
   # or
   pnpm --filter login-example dev
   # or
   pnpm --filter llm-support-example dev
   # or
   pnpm --filter support-desk-example dev
   # or
   pnpm --filter settings-example dev
   ```

3. If you prefer, you can still work inside the example directory after the root install:

   ```bash
   cd examples/qa-bot
   # or
   cd examples/coding
   # or
   cd examples/login
   # or
   cd examples/llm-support
   # or
   cd examples/support-desk
   # or
   cd examples/settings
   ```

4. Install dependencies (this will install the local `react-actions-chat` package):

   ```bash
   pnpm install
   ```

5. If you are running the `llm-support` example, the chat starts in a locked state and asks for an OpenAI API key before the first message.

   The key stays in memory for the current tab only so you can try the live backend-routed flow without creating a local `.env` file. In production, keep provider keys on your own backend.

6. If you are running the `support-desk` example, the workspace starts with seeded tickets for both the customer and admin views. Create a new ticket in the customer inbox, then switch to the admin console to work the same issue from the shared in-memory queue.

7. If you are running the `settings` example, create `examples/settings/.env.local` with a real OpenAI API key:

   ```bash
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

   This keeps the example simple and fully runnable, but it exposes the key to the browser bundle. In a production app, call the embedder from your own backend instead.

8. Start the development server:

   ```bash
   pnpm dev
   ```

9. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

To build an example for production:

```bash
pnpm --filter qa-bot-example build
```

The built files will be in the `dist` directory. You can preview the production build with:

```bash
pnpm --filter qa-bot-example preview
```
