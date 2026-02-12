# Chat Component Examples

This folder contains self-contained, runnable examples demonstrating different use cases of the Chat component.

## Examples

- **basic-qa-bot** - A simple question and answer bot that responds to user queries
- **login** - A login flow using email and password inputs
- **settings** - A settings page with change email, change password, and logout functionality

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

## How Examples Work

Each example:

- Has its own `package.json` with all necessary dependencies
- Imports the Chat component and related utilities from the parent `src` directory
- Is configured with Vite for fast development and building
- Uses TypeScript with strict type checking

The examples demonstrate:

- Basic chat interactions with `userResponseCallback`
- Input requests using `createRequestInputButton`
- Confirmation dialogs using `createRequestConfirmationButton`
- Input field configuration and validation
- Theme customization
