#!/usr/bin/env node

/**
 * Verifies that the docs assistant corpus can be regenerated from the current docs.
 *
 * Steps:
 * 1. Regenerate the corpus with the canonical docs assistant generator.
 * 2. Read the generated JSON artifact from the backend tree.
 * 3. Fail when the build did not produce any chunks.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
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
  console.log('Checking if the docs assistant corpus can be generated...');
  const hadExistingCorpus = existsSync(corpusFilePath);

  try {
    execSync('node scripts/build-docs-assistant-corpus.js', {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Error regenerating the docs assistant corpus.', error);
    process.exit(1);
  }

  let corpus = null;

  try {
    corpus = JSON.parse(readFileSync(corpusFilePath, 'utf8'));
  } catch (error) {
    console.error('Error reading the generated docs assistant corpus.', error);
    process.exit(1);
  }

  const chunkCount =
    typeof corpus?.chunkCount === 'number'
      ? corpus.chunkCount
      : Array.isArray(corpus?.chunks)
        ? corpus.chunks.length
        : 0;

  if (!Array.isArray(corpus?.chunks) || chunkCount === 0) {
    console.error(
      '\nERROR: docsAssistantCorpus.json was generated but is empty.\n'
    );
    console.error(
      'The docs assistant corpus build completed without any retrieval chunks.'
    );
    process.exit(1);
  }

  if (!hadExistingCorpus) {
    try {
      rmSync(corpusFilePath, {
        force: true,
      });
    } catch (error) {
      console.error(
        'The docs assistant corpus check succeeded, but the transient artifact could not be cleaned up.',
        error
      );
      process.exit(1);
    }
  }

  console.log(
    `The docs assistant corpus generated successfully (${chunkCount} chunk(s)).`
  );
}
