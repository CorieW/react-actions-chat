/**
 * Builds the runnable example apps used by the Playwright E2E suite.
 *
 * Steps:
 * 1. Read the requested settings-example mode from CLI args or env.
 * 2. Validate the mode and require an API key when the live lane is selected.
 * 3. Build the coding, LLM support, login, QA bot, uploads, support-desk, and
 *    settings examples with pnpm, passing the resolved mode through to the
 *    settings example when needed.
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const rootDir = resolve(import.meta.dirname, '..');
const supportedSettingsModes = new Set(['auto', 'fallback', 'live']);
const settingsMode =
  getSettingsModeFromArgs() ??
  process.env.VITE_SETTINGS_EXAMPLE_MODE?.trim() ??
  'fallback';

if (!supportedSettingsModes.has(settingsMode)) {
  console.error(
    `Unsupported settings example mode "${settingsMode}". Use auto, fallback, or live.`
  );
  process.exit(1);
}

if (settingsMode === 'live' && !process.env.VITE_OPENAI_API_KEY?.trim()) {
  console.error(
    'VITE_OPENAI_API_KEY is required when building the settings example in live mode.'
  );
  process.exit(1);
}

console.log(`Building E2E examples with settings mode "${settingsMode}".`);

runPnpm(['--filter', 'coding-example', 'build']);
runPnpm(['--filter', 'llm-support-example', 'build'], {
  VITE_LLM_SUPPORT_EXAMPLE_MODE: 'fallback',
});
runPnpm(['--filter', 'login-example', 'build']);
runPnpm(['--filter', 'qa-bot-example', 'build']);
runPnpm(['--filter', 'uploads-example', 'build']);
runPnpm(['--filter', 'support-desk-example', 'build']);
runPnpm(
  ['--filter', 'settings-example', 'build'],
  settingsMode === 'auto'
    ? undefined
    : {
        VITE_SETTINGS_EXAMPLE_MODE: settingsMode,
      }
);

function getSettingsModeFromArgs() {
  const settingsModeArg = process.argv
    .slice(2)
    .find(argument => argument.startsWith('--settings-mode='));

  if (!settingsModeArg) {
    return undefined;
  }

  return settingsModeArg.split('=')[1]?.trim();
}

function runPnpm(args, extraEnv) {
  const pnpmExecutable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const command = [pnpmExecutable, ...args].join(' ');
  const result = spawnSync(pnpmExecutable, args, {
    cwd: rootDir,
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.error(`Command failed: ${command}`);
    process.exit(result.status ?? 1);
  }
}
