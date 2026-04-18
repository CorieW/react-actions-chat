#!/usr/bin/env node

/**
 * Verifies that the committed standalone stylesheet matches the current
 * Tailwind source.
 *
 * Steps:
 * 1. Read the committed `src/styles.css` contents into memory.
 * 2. Rebuild styles with the canonical generator used by the package.
 * 3. Compare the regenerated file with the committed one and fail with
 *    regeneration instructions when they differ.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const stylesPath = path.resolve(rootDir, 'src/styles.css');

async function checkStyles() {
  console.log('🔍 Checking if styles.css is up to date...');

  try {
    // Read the current styles.css
    const beforeContent = fs.readFileSync(stylesPath, 'utf-8');

    // Rebuild styles with the same generator used by the package build.
    console.log('🎨 Rebuilding styles.css...');
    execSync('node scripts/build-styles-v4.js', {
      cwd: rootDir,
      stdio: 'inherit',
    });

    // Read the newly generated styles.css
    const afterContent = fs.readFileSync(stylesPath, 'utf-8');

    // Compare the two
    if (beforeContent !== afterContent) {
      console.error('\n❌ ERROR: styles.css is out of sync!\n');
      console.error(
        'The generated styles.css differs from the committed version.'
      );
      console.error(
        'This means Tailwind classes in components have changed but styles.css was not regenerated.\n'
      );
      console.error('To fix this:');
      console.error('  1. Run: pnpm build:styles');
      console.error('  2. Commit the updated src/styles.css file\n');
      process.exit(1);
    }

    console.log('✅ styles.css is up to date!');
  } catch (error) {
    console.error('❌ Error checking styles:', error.message);
    process.exit(1);
  }
}

checkStyles();
