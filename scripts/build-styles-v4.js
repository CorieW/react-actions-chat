#!/usr/bin/env node

/**
 * Generates standalone package CSS with the Tailwind v4 Vite plugin.
 *
 * Steps:
 * 1. Create a temporary CSS entry that imports the source CSS and restricts
 *    Tailwind scanning to package source folders.
 * 2. Run a Vite build with `@tailwindcss/vite` to emit the compiled CSS.
 * 3. Read the generated CSS, prepend the generated-file header, and write the
 *    result to `src/styles.css`.
 * 4. Remove the temporary build directory even when the build fails.
 */

import { build } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function buildStyles() {
  console.log('🎨 Building standalone CSS from Tailwind v4...');

  const tempDir = path.resolve(rootDir, '.temp-styles-build');
  const tempEntry = path.resolve(tempDir, 'entry.css');
  const targetCssPath = path.resolve(rootDir, 'src/styles.css');

  try {
    // Create temporary build directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create CSS entry point that imports the source CSS and pins Tailwind's
    // scan scope to package sources, keeping local helper files out of output.
    fs.writeFileSync(
      tempEntry,
      `@import '../src/index.css' source(none);

@source '../src/components';
@source '../src/lib';
@source '../src/js';

/* Force Tailwind to scan and include all classes used in components */
@tailwind components;
@tailwind utilities;
`
    );

    // Build with Vite + Tailwind with explicit config
    await build({
      root: rootDir, // Use root directory so imports and build paths resolve consistently
      plugins: [tailwindcss()],
      build: {
        outDir: path.resolve(tempDir, 'dist'),
        emptyOutDir: true,
        minify: false,
        rollupOptions: {
          input: tempEntry,
        },
      },
      configFile: false,
    });

    // Find and copy the generated CSS
    const distDir = path.resolve(tempDir, 'dist');

    // Look for CSS files in dist or dist/assets
    let cssFiles = [];
    if (fs.existsSync(path.resolve(distDir, 'assets'))) {
      cssFiles = fs
        .readdirSync(path.resolve(distDir, 'assets'))
        .filter(file => file.endsWith('.css'))
        .map(f => path.resolve(distDir, 'assets', f));
    }

    if (cssFiles.length === 0) {
      cssFiles = fs
        .readdirSync(distDir)
        .filter(file => file.endsWith('.css'))
        .map(f => path.resolve(distDir, f));
    }

    if (cssFiles.length === 0) {
      throw new Error('No CSS file generated');
    }

    let css = fs.readFileSync(cssFiles[0], 'utf-8');

    // Add header comment
    const header = `/* Standalone CSS for react-actions-chat - auto-generated from Tailwind */
/* DO NOT EDIT MANUALLY - run 'pnpm build:styles' to regenerate */

`;
    css = header + css;

    // Write to target location
    fs.writeFileSync(targetCssPath, css);

    console.log('✅ Successfully generated src/styles.css');
    console.log(
      'ℹ️  Note: styles.css is excluded from Prettier formatting (config/.prettierignore)'
    );
  } catch (error) {
    console.error('❌ Error building styles:', error);
    process.exit(1);
  } finally {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

buildStyles();
