# Chat Component Examples

This folder contains runnable workspace examples demonstrating different use cases of the Chat component.

## Examples

- **basic-qa-bot** - A simple question and answer bot that responds to user queries
- **login** - A login flow using email and password inputs
- **settings** - A settings page with change email, change password, and logout functionality

## Running an Example

Each example is a workspace package that resolves `actionable-support-chat` through the repo's shared `pnpm` workspace.

### Prerequisites

Make sure you have Node.js and `pnpm` available. If needed, run `corepack enable` first.

### Steps

1. Install workspace dependencies from the repo root:

   ```bash
   pnpm install
   ```

2. Start an example from the repo root:

   ```bash
   pnpm --filter basic-qa-bot-example dev
   # or
   pnpm --filter login-example dev
   # or
   pnpm --filter settings-example dev
   ```

3. If you prefer, you can still work inside the example directory after the root install:

   ```bash
   cd examples/basic-qa-bot
   pnpm dev
   ```

4. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

To build an example for production:

```bash
pnpm --filter basic-qa-bot-example build
```

The built files will be in the `dist` directory. You can preview the production build with:

```bash
pnpm --filter basic-qa-bot-example preview
```
