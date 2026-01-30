#!/usr/bin/env bun
//MISE description="Clone and setup Morphir JVM assets"

import { $, del, mkdir, log, PATHS, ROOT_DIR, ENV, join } from "../_lib.ts";
import { mkdtemp, cp } from "fs/promises";
import { tmpdir } from "os";

log("setup:morphir-jvm", `Setting up Morphir JVM v${ENV.morphirJvmVersion}...`);

// Create temp directory for clone
const tempDir = await mkdtemp(join(tmpdir(), "morphir-jvm-"));

try {
  // Clone the specific tag
  log("setup:morphir-jvm", "Cloning morphir-jvm repository...");
  await $`git clone --depth 1 --branch v${ENV.morphirJvmVersion} https://github.com/finos/morphir-jvm ${tempDir}`.quiet();

  // Copy SDK files
  log("setup:morphir-jvm", "Copying SDK files...");
  const srcDir = join(tempDir, "morphir/sdk");
  const destDir = join(PATHS.redistributable, "Scala/sdk");

  await mkdir(destDir, { recursive: true });

  // Use recursive copy
  await cp(srcDir, destDir, { recursive: true });

  log("setup:morphir-jvm", "Done");
} finally {
  // Cleanup temp directory
  await del([tempDir]);
}
