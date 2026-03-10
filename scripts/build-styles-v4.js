#!/usr/bin/env node

/**
 * Build script for Tailwind CSS v4
 * Tailwind v4 uses @tailwindcss/vite, so we create a temporary entry point
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
  const tempHtml = path.resolve(tempDir, 'index.html');
  const tempEntry = path.resolve(tempDir, 'entry.css');
  const targetCssPath = path.resolve(rootDir, 'src/styles.css');

  try {
    // Create temporary build directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create CSS entry point that imports the source CSS and includes all components
    fs.writeFileSync(
      tempEntry,
      `@import '../src/index.css';

/* Force Tailwind to scan and include all classes used in components */
@tailwind components;
@tailwind utilities;
`
    );

    // Create HTML that references all component files to ensure Tailwind scans them
    const componentFiles = getAllFiles(path.resolve(rootDir, 'src/components'))
      .filter(f => f.endsWith('.tsx'))
      .map(f => path.relative(tempDir, f));

    fs.writeFileSync(
      tempHtml,
      `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="./entry.css">
</head>
<body>
  <!-- Reference component files so Tailwind scans them -->
  ${componentFiles.map(f => `<!-- ${f} -->`).join('\n  ')}
</body>
</html>`
    );

    // Build with Vite + Tailwind with explicit config
    await build({
      root: rootDir, // Use root directory so Tailwind can find all files
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
    const header = `/* Standalone CSS for actionable-support-chat - auto-generated from Tailwind */
/* DO NOT EDIT MANUALLY - run 'npm run build:styles' to regenerate */

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

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.resolve(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

buildStyles();
