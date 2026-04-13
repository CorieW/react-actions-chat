#!/usr/bin/env node

/**
 * Build script to generate standalone CSS from Tailwind
 * This ensures styles.css is always in sync with Tailwind classes used in components
 */

import { build } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function buildStyles() {
  console.log('🎨 Building standalone CSS from Tailwind...');

  try {
    // Build the CSS using Vite with Tailwind plugin
    await build({
      root: rootDir,
      build: {
        outDir: path.resolve(rootDir, 'dist-styles'),
        emptyOutDir: true,
        cssCodeSplit: false,
        rollupOptions: {
          input: path.resolve(rootDir, 'src/index.css'),
          output: {
            assetFileNames: 'styles.css',
          },
        },
      },
    });

    // Copy the generated CSS to src/styles.css
    const builtCssPath = path.resolve(rootDir, 'dist-styles/styles.css');
    const targetCssPath = path.resolve(rootDir, 'src/styles.css');

    if (fs.existsSync(builtCssPath)) {
      let css = fs.readFileSync(builtCssPath, 'utf-8');

      // Add header comment
      const header = `/* Standalone CSS for react-actions-chat - auto-generated from Tailwind */
/* DO NOT EDIT MANUALLY - run 'pnpm build:styles' to regenerate */

`;
      css = header + css;

      fs.writeFileSync(targetCssPath, css);
      console.log('✅ Successfully generated src/styles.css');

      // Clean up temporary build directory
      fs.rmSync(path.resolve(rootDir, 'dist-styles'), {
        recursive: true,
        force: true,
      });
    } else {
      throw new Error('Built CSS file not found');
    }
  } catch (error) {
    console.error('❌ Error building styles:', error);
    process.exit(1);
  }
}

buildStyles();
