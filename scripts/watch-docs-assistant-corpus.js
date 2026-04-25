/**
 * Watches docs markdown files and regenerates the docs assistant corpus.
 *
 * Steps:
 * 1. Generate the corpus once unless explicitly skipped by the caller.
 * 2. Watch `docs/` recursively for markdown content changes.
 * 3. Debounce rapid edits into a single corpus regeneration run.
 * 4. Remind local developers that embeddings stay stale until regenerated.
 */

import { existsSync, watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const docsRoot = resolve(repoRoot, 'docs');
const corpusScriptPath = resolve(
  repoRoot,
  'scripts',
  'build-docs-assistant-corpus.js'
);
const embeddingsFilePath = resolve(
  repoRoot,
  'docs-chat',
  'backend',
  'generated',
  'docsAssistantEmbeddings.json'
);
const debounceMs = 150;
const skipInitialBuild = process.argv.includes('--skip-initial-build');
let activeBuild = null;
let debounceTimer = null;
let pendingReason = '';

if (!skipInitialBuild) {
  await requestCorpusBuild('initial startup');
}

console.log(
  '[docs-assistant:corpus] Watching docs markdown for corpus changes.'
);

const watcher = watch(
  docsRoot,
  {
    recursive: true,
  },
  (_eventType, rawRelativePath) => {
    if (typeof rawRelativePath !== 'string' || rawRelativePath === '') {
      queueCorpusBuild('docs change');
      return;
    }

    const normalizedRelativePath = rawRelativePath.replace(/\\/g, '/');

    if (shouldIgnorePath(normalizedRelativePath)) {
      return;
    }

    queueCorpusBuild(normalizedRelativePath);
  }
);

watcher.on('error', error => {
  console.error('[docs-assistant:corpus] Watcher failed.', error);
  shutdown(1);
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

function shouldIgnorePath(relativePath) {
  return (
    relativePath.startsWith('.vitepress/') ||
    !relativePath.endsWith('.md') ||
    relativePath.endsWith('AGENTS.md')
  );
}

function queueCorpusBuild(reason) {
  pendingReason = reason;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    const resolvedReason = pendingReason || 'docs change';
    pendingReason = '';
    void requestCorpusBuild(resolvedReason);
  }, debounceMs);
}

async function requestCorpusBuild(reason) {
  if (activeBuild) {
    pendingReason ||= reason;
    return activeBuild;
  }

  activeBuild = runCorpusBuild(reason)
    .catch(() => {})
    .finally(async () => {
      activeBuild = null;

      if (pendingReason) {
        const nextReason = pendingReason;
        pendingReason = '';
        await requestCorpusBuild(nextReason);
      }
    });

  return activeBuild;
}

async function runCorpusBuild(reason) {
  console.log(`[docs-assistant:corpus] Regenerating corpus after ${reason}.`);

  const exitCode = await runNodeScript(corpusScriptPath);

  if (exitCode !== 0) {
    console.error(
      `[docs-assistant:corpus] Corpus generation failed with exit code ${exitCode}.`
    );
    return;
  }

  if (reason !== 'initial startup' && existsSync(embeddingsFilePath)) {
    console.log(
      '[docs-assistant:corpus] Embeddings were not regenerated. Run `node scripts/build-docs-assistant-embeddings.js` when you want semantic retrieval to catch up with docs changes.'
    );
  }
}

function runNodeScript(scriptPath) {
  return new Promise(resolvePromise => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: repoRoot,
      stdio: 'inherit',
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        resolvePromise(1);
        return;
      }

      resolvePromise(code ?? 1);
    });
  });
}

function shutdown(exitCode) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  watcher.close();
  process.exit(exitCode);
}
