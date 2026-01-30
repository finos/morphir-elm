#!/usr/bin/env bun
//MISE description="Check package-lock.json for prohibited dependencies"

import { readFile, log, ROOT_DIR, join } from "../_lib.ts";

log("test:check-package-lock", "Checking package-lock.json...");

const packageLockJson = JSON.parse(
  await readFile(join(ROOT_DIR, "package-lock.json"), "utf-8")
);

function hasRuntimeDependencyOnPackage(packageName: string): boolean {
  const runtimeDependencyInPackages =
    packageLockJson.packages &&
    packageLockJson.packages[`node_modules/${packageName}`] &&
    !packageLockJson.packages[`node_modules/${packageName}`].dev;

  const runtimeDependencyInDependencies =
    packageLockJson.dependencies &&
    packageLockJson.dependencies[packageName] &&
    !packageLockJson.dependencies[packageName].dev;

  return runtimeDependencyInPackages || runtimeDependencyInDependencies;
}

// Check for prohibited dependencies
const prohibited = ["binwrap"];

for (const pkg of prohibited) {
  if (hasRuntimeDependencyOnPackage(pkg)) {
    throw new Error(`Runtime dependency on ${pkg} was detected!`);
  }
}

log("test:check-package-lock", "No prohibited dependencies found");
