/**
 * @fileoverview
 * Refreshes local build outputs and Vite caches across the repo so the next
 * build or dev session starts from a clean state.
 */

import { readdirSync, existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const projectDirectories = [
  rootDir,
  ...getProjectDirectories(join(rootDir, "packages")),
  ...getProjectDirectories(join(rootDir, "examples")),
];

const refreshTargets = [
  "dist",
  join("node_modules", ".vite"),
];

for (const projectDirectory of projectDirectories) {
  for (const target of refreshTargets) {
    removePath(join(projectDirectory, target));
  }
}

removePath(join(rootDir, ".temp-styles-build"));

console.log(
  `Refreshed ${projectDirectories.length} project(s) across examples and packages.`,
);

function getProjectDirectories(parentDirectory) {
  if (!existsSync(parentDirectory)) {
    return [];
  }

  return readdirSync(parentDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(parentDirectory, entry.name))
    .filter((directory) => existsSync(join(directory, "package.json")))
    .sort();
}

function removePath(targetPath) {
  if (!existsSync(targetPath)) {
    return;
  }

  rmSync(targetPath, {
    force: true,
    recursive: true,
  });

  console.log(`Removed ${targetPath.replace(`${rootDir}/`, "")}`);
}
