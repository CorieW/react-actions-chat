# Chat Component Examples

This folder contains self-contained, runnable examples demonstrating different flow patterns with the Chat component.

## Examples

- **basic-qa-bot** - Simple flows for FAQ-style prompts and quick actions
- **login** - A multi-step login flow using email and password inputs
- **settings** - Initial home flow that triggers email, password, and logout flows

## Running an Example

Each example is a standalone project that installs `actionable-support-chat` from the local parent directory.

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

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

To build an example for production:

```bash
npm run build
```

The built files will be in the `dist` directory. You can preview the production build with:

```bash
npm run preview
```
