#!/usr/bin/env bun
//MISE description="Build CLI2 (TypeScript + Elm in parallel)"
//MISE depends=["build:check-elm-docs"]

import { $, elmMake, log, PATHS, ROOT_DIR, join } from "../_lib.ts";

async function compileCli2Ts() {
  log("build:cli2", "Compiling TypeScript...");

  // Use bun's native TS compilation
  // Get all .ts files except test files
  const glob = new Bun.Glob("*.ts");
  const tsFiles: string[] = [];

  for await (const file of glob.scan({ cwd: PATHS.cli2, absolute: true })) {
    if (!file.endsWith(".test.ts")) {
      tsFiles.push(file);
    }
  }

  // Build each file
  for (const file of tsFiles) {
    await $`bun build ${file} --outdir=${join(PATHS.cli2, "lib")} --target=node`.quiet();
  }
}

async function makeCli2Elm() {
  log("build:cli2", "Compiling Elm...");
  await elmMake(["src/Morphir/Elm/CLI.elm"], {
    cwd: PATHS.cli2,
    output: "Morphir.Elm.CLI.js",
  });
}

log("build:cli2", "Building CLI2...");

// Parallel execution
await Promise.all([compileCli2Ts(), makeCli2Elm()]);

log("build:cli2", "Done");
