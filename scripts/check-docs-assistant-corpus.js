#!/usr/bin/env node

/**
 * Verifies that the committed docs assistant corpus matches the current docs.
 *
 * Steps:
 * 1. Read the committed corpus JSON into memory.
 * 2. Regenerate the corpus with the canonical docs assistant generator.
 * 3. Compare the regenerated file with the committed one and fail when they differ.
 * 4. Instruct contributors to rebuild and commit the corpus artifact when needed.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const corpusFilePath = resolve(
  repoRoot,
  'docs-chat',
  'backend',
  'generated',
  'docsAssistantCorpus.json'
);

checkDocsAssistantCorpus();

function checkDocsAssistantCorpus() {
  console.log('Checking if the docs assistant corpus is up to date...');

  let beforeContent = '';

  try {
    beforeContent = readFileSync(corpusFilePath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ENOENT') {
        console.error('\nERROR: docsAssistantCorpus.json is missing.\n');
        console.error(
          'Generate and commit the docs assistant corpus before merging.'
        );
        console.error('Run: node scripts/build-docs-assistant-corpus.js\n');
        process.exit(1);
      }
    }

    console.error('Error reading the current docs assistant corpus.', error);
    process.exit(1);
  }

  try {
    execSync('node scripts/build-docs-assistant-corpus.js', {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Error regenerating the docs assistant corpus.', error);
    process.exit(1);
  }

  const afterContent = readFileSync(corpusFilePath, 'utf8');

  if (beforeContent !== afterContent) {
    console.error('\nERROR: docsAssistantCorpus.json is out of date.\n');
    console.error(
      'The generated docs assistant corpus differs from the committed version.'
    );
    console.error(
      'This means the docs changed but the retrieval corpus was not regenerated and committed.\n'
    );
    console.error('To fix this:');
    console.error('  1. Run: node scripts/build-docs-assistant-corpus.js');
    console.error(
      '  2. Commit docs-chat/backend/generated/docsAssistantCorpus.json\n'
    );
    process.exit(1);
  }

  console.log('The docs assistant corpus is up to date.');
}
