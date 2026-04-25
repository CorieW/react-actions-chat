/**
 * Runs the docs assistant local development stack in one command.
 *
 * Steps:
 * 1. Generate the docs assistant corpus once before the backend starts.
 * 2. Start a watcher that keeps the corpus in sync with markdown changes.
 * 3. Start the Firebase Functions emulator on the configured local project.
 * 4. Start the VitePress docs dev server and shut everything down together.
 */

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const corpusScriptPath = resolve(
  repoRoot,
  'scripts',
  'build-docs-assistant-corpus.js'
);
const corpusWatcherPath = resolve(
  repoRoot,
  'scripts',
  'watch-docs-assistant-corpus.js'
);
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const childProcesses = new Set();
let isShuttingDown = false;

const initialCorpusExitCode = await runCommand('corpus', process.execPath, [
  corpusScriptPath,
]);

if (initialCorpusExitCode !== 0) {
  process.exit(initialCorpusExitCode);
}

startPersistentCommand('corpus', process.execPath, [
  corpusWatcherPath,
  '--skip-initial-build',
]);
startPersistentCommand('emulator', pnpmCommand, [
  'exec',
  'firebase',
  'emulators:start',
  '--only',
  'functions',
  '--project',
  'local-docs-assistant',
]);
startPersistentCommand('docs', pnpmCommand, ['docs:dev']);

process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));

async function runCommand(label, command, args) {
  return new Promise(resolvePromise => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    pipeOutput(child, label);

    child.on('exit', (code, signal) => {
      if (signal) {
        resolvePromise(1);
        return;
      }

      resolvePromise(code ?? 1);
    });
  });
}

function startPersistentCommand(label, command, args) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  childProcesses.add(child);
  pipeOutput(child, label);

  child.on('exit', (code, signal) => {
    childProcesses.delete(child);

    if (isShuttingDown) {
      return;
    }

    const resolvedExitCode = typeof code === 'number' ? code : signal ? 1 : 0;
    const reason = signal
      ? `${label} stopped after signal ${signal}.`
      : `${label} exited with code ${resolvedExitCode}.`;

    console.error(`[docs-assistant:dev] ${reason}`);
    void shutdown(resolvedExitCode || 1);
  });

  return child;
}

function pipeOutput(child, label) {
  pipeStream(child.stdout, process.stdout, label);
  pipeStream(child.stderr, process.stderr, label);
}

function pipeStream(source, target, label) {
  if (!source) {
    return;
  }

  let buffered = '';

  source.on('data', chunk => {
    buffered += chunk.toString();
    const lines = buffered.split(/\r?\n/);

    buffered = lines.pop() ?? '';

    for (const line of lines) {
      target.write(`[${label}] ${line}\n`);
    }
  });

  source.on('end', () => {
    if (buffered) {
      target.write(`[${label}] ${buffered}\n`);
      buffered = '';
    }
  });
}

async function shutdown(exitCode) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of childProcesses) {
    child.kill('SIGINT');
  }

  await Promise.all(
    [...childProcesses].map(
      child =>
        new Promise(resolvePromise => {
          child.once('exit', () => resolvePromise());
        })
    )
  );

  process.exit(exitCode);
}
