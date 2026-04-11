# Chat Component Examples

This folder contains self-contained, runnable examples demonstrating different use cases of the Chat component.

## Examples

- **basic-qa-bot** - A simple question and answer bot that responds to user queries
- **login** - A login flow using email and password inputs
- **settings** - A settings page that uses the companion recommended-actions package and a real OpenAI embedder to recommend settings actions from a user query

You can also build reusable recommended-action flows with the companion `actionable-support-chat-recommended-actions` package, including embedding-based search backed by your own search or vector search service.

## Running an Example

Each example is a standalone project that installs `actionable-support-chat` from the local parent directory. The settings example also installs the local `actionable-support-chat-recommended-actions` companion package.

### Prerequisites

Make sure you have Node.js and npm installed.

### Steps

1. Navigate to the example directory:

   ```bash
   cd examples/basic-qa-bot
   # or
   cd examples/login
   # or
   cd examples/settings
   ```

2. Install dependencies (this will install the local `actionable-support-chat` package):

   ```bash
   npm install
   ```

3. If you are running the `settings` example, create `examples/settings/.env.local` with a real OpenAI API key:

   ```bash
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

   This keeps the example simple and fully runnable, but it exposes the key to the browser bundle. In a production app, call the embedder from your own backend instead.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

To build an example for production:

```bash
npm run build
```

The built files will be in the `dist` directory. You can preview the production build with:

```bash
npm run preview
```
