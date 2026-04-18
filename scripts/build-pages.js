/**
 * Builds the GitHub Pages site by combining the VitePress docs with selected
 * live example apps under a single static output directory.
 *
 * Steps:
 * 1. Resolve the deploy base path from env so local and GitHub Pages builds
 *    use compatible asset URLs.
 * 2. Build the docs site and each live example with matching base-path env.
 * 3. Recreate the docs examples output folder and copy each example's built
 *    assets into the final Pages directory structure.
 */

import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const rootDir = resolve(import.meta.dirname, '..');
const pagesBasePath = normalizeBasePath(
  process.env.PAGES_BASE_PATH ??
    (process.env.GITHUB_REPOSITORY
      ? `/${process.env.GITHUB_REPOSITORY.split('/').at(-1)}/`
      : '/')
);
const docsOutputDirectory = join(rootDir, 'docs', '.vitepress', 'dist');
const liveExamples = [
  {
    packageName: 'qa-bot-example',
    directoryName: 'qa-bot',
  },
  {
    packageName: 'login-example',
    directoryName: 'login',
  },
];

runCommand('pnpm', ['docs:build'], {
  DOCS_BASE_PATH: pagesBasePath,
});

for (const example of liveExamples) {
  runCommand('pnpm', ['--filter', example.packageName, 'build'], {
    EXAMPLE_BASE_PATH: joinBasePath(
      pagesBasePath,
      'examples',
      example.directoryName
    ),
  });
}

const examplesOutputDirectory = join(docsOutputDirectory, 'examples');
rmSync(examplesOutputDirectory, {
  force: true,
  recursive: true,
});
mkdirSync(examplesOutputDirectory, {
  recursive: true,
});

for (const example of liveExamples) {
  cpSync(
    join(rootDir, 'examples', example.directoryName, 'dist'),
    join(examplesOutputDirectory, example.directoryName),
    {
      recursive: true,
    }
  );
}

console.log(
  `Built docs and ${liveExamples.length} live example(s) for ${pagesBasePath}`
);

/**
 * Keeps static hosting paths safe for local runs and GitHub Pages deploys.
 */
function normalizeBasePath(rawBasePath) {
  if (!rawBasePath || rawBasePath === '/') {
    return '/';
  }

  const trimmedBasePath = rawBasePath.trim().replace(/^\/+|\/+$/g, '');

  return trimmedBasePath ? `/${trimmedBasePath}/` : '/';
}

/**
 * Joins a Pages base path with child segments while preserving one leading and
 * trailing slash for Vite-compatible base paths.
 */
function joinBasePath(basePath, ...segments) {
  const normalizedBasePath = normalizeBasePath(basePath);
  const normalizedSegments = segments
    .map(segment => segment.trim().replace(/^\/+|\/+$/g, ''))
    .filter(Boolean);

  if (normalizedSegments.length === 0) {
    return normalizedBasePath;
  }

  return normalizeBasePath(
    `${normalizedBasePath}${normalizedSegments.join('/')}/`
  );
}

function runCommand(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
