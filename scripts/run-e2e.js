/**
 * Runs the Playwright suite in one of the supported E2E lanes.
 *
 * Steps:
 * 1. Read the requested lane and map it to the matching example-build mode and
 *    Playwright arguments.
 * 2. Build the example apps with the settings-example mode required for that
 *    lane.
 * 3. Execute Playwright with any extra CLI args and lane-specific env vars.
 * 4. Exit with the first failing subprocess status so CI sees the right
 *    result.
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const rootDir = resolve(import.meta.dirname, '..');
const lane = process.argv[2] ?? 'pr';
const extraPlaywrightArgs = process.argv.slice(3);

const laneConfig = getLaneConfig(lane);

runNodeScript('scripts/build-e2e-examples.js', [
  `--settings-mode=${laneConfig.settingsMode}`,
]);
runPnpm(
  ['exec', 'playwright', ...laneConfig.playwrightArgs, ...extraPlaywrightArgs],
  laneConfig.playwrightEnv
);

function getLaneConfig(selectedLane) {
  switch (selectedLane) {
    case 'pr':
      return {
        settingsMode: 'fallback',
        playwrightArgs: [
          'test',
          '--project=chromium',
          '--grep-invert',
          '@live',
        ],
      };
    case 'matrix':
      return {
        settingsMode: 'fallback',
        playwrightArgs: ['test', '--grep-invert', '@live'],
      };
    case 'live':
      return {
        settingsMode: 'live',
        playwrightArgs: ['test', '--project=chromium', '--grep', '@live'],
        playwrightEnv: {
          PLAYWRIGHT_LIVE_E2E: 'true',
        },
      };
    default:
      console.error(
        `Unknown E2E lane "${selectedLane}". Use pr, matrix, or live.`
      );
      process.exit(1);
  }
}

function runNodeScript(scriptPath, args) {
  const nodeExecutable = process.execPath;
  const result = spawnSync(nodeExecutable, [scriptPath, ...args], {
    cwd: rootDir,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runPnpm(args, extraEnv) {
  const pnpmExecutable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const result = spawnSync(pnpmExecutable, args, {
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
