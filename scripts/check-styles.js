#!/usr/bin/env node

/**
 * CI check to ensure styles.css is in sync with Tailwind source
 * Fails if styles.css is out of date
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

    // Run the build:styles script
    console.log('🎨 Rebuilding styles.css...');
    execSync('npm run build:styles', {
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
      console.error('  1. Run: npm run build:styles');
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
