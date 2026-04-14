# Chat Component Examples

This folder contains runnable workspace examples demonstrating different use cases of the Chat component.

## Examples

- **qa-bot** - A simple question and answer bot that responds to user queries
- **login** - A login flow using email and password inputs
- **llm-support** - An OpenAI chat demo using `react-actions-chat-llms` through a local backend route
- **settings** - A settings page that uses the companion recommended-actions package and a real OpenAI embedder to recommend settings actions from a user query

You can also build reusable recommended-action flows with the companion `react-actions-chat-recommended-actions` package, including embedding-based search backed by your own search or vector search service.
You can build hosted model-driven replies with `react-actions-chat-llms` using the same transcript-driven chat pattern.

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
   pnpm --filter login-example dev
   # or
   pnpm --filter llm-support-example dev
   # or
   pnpm --filter settings-example dev
   ```

3. If you prefer, you can still work inside the example directory after the root install:

   ```bash
   cd examples/qa-bot
   # or
   cd examples/login
   # or
   cd examples/llm-support
   # or
   cd examples/settings
   ```

4. Install dependencies (this will install the local `react-actions-chat` package):

   ```bash
   pnpm install
   ```

5. If you are running the `llm-support` example, create `examples/llm-support/.env.local` with a real OpenAI API key:

   ```bash
   OPENAI_API_KEY=your_openai_api_key
   ```

   The example's browser app calls a local `/api/llm` backend route implemented in the example Vite server, so the OpenAI key stays server-side. In a production app, keep using your own backend route rather than calling providers directly from the browser.

6. If you are running the `settings` example, create `examples/settings/.env.local` with a real OpenAI API key:

   ```bash
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

   This keeps the example simple and fully runnable, but it exposes the key to the browser bundle. In a production app, call the embedder from your own backend instead.

7. Start the development server:

   ```bash
   pnpm dev
   ```

8. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

To build an example for production:

```bash
pnpm --filter qa-bot-example build
```

The built files will be in the `dist` directory. You can preview the production build with:

```bash
pnpm --filter qa-bot-example preview
```
