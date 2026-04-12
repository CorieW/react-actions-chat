#!/usr/bin/env node

/**
 * Simpler build script using Tailwind CLI directly
 * This is an alternative to the Vite-based build-styles.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function buildStyles() {
  console.log('🎨 Building standalone CSS with Tailwind CLI...');

  try {
    // Use Tailwind CLI to build CSS
    // This scans all files in content paths and generates only used classes
    const { stdout, stderr } = await execAsync(
      'npx tailwindcss -i src/index.css -o src/styles.css --minify',
      { cwd: rootDir }
    );

    if (stderr && !stderr.includes('Done in')) {
      console.warn('⚠️ Warnings:', stderr);
    }

    // Add header comment
    const targetCssPath = path.resolve(rootDir, 'src/styles.css');
    let css = fs.readFileSync(targetCssPath, 'utf-8');

    const header = `/* Standalone CSS for actionable-support-chat - auto-generated from Tailwind */
/* DO NOT EDIT MANUALLY - run 'pnpm build:styles' to regenerate */

`;

    if (!css.startsWith('/* Standalone CSS')) {
      css = header + css;
      fs.writeFileSync(targetCssPath, css);
    }

    console.log('✅ Successfully generated src/styles.css');
    console.log(stdout);
  } catch (error) {
    console.error('❌ Error building styles:', error);
    process.exit(1);
  }
}

buildStyles();
