#!/usr/bin/env bun
//MISE description="Build CLI2 (TypeScript + Elm in parallel)"
//MISE depends=["build:check-elm-docs"]

import { elmMake, log, PATHS, join } from "../_lib.ts";
import { mkdir, rm } from "fs/promises";

async function compileCli2Ts() {
  log("build:cli2", "Compiling TypeScript...");

  // Ensure output directory exists and is clean
  const outdir = join(PATHS.cli2, "lib");
  await rm(outdir, { recursive: true, force: true });
  await mkdir(outdir, { recursive: true });

  // Get all .ts files except test files
  const glob = new Bun.Glob("*.ts");
  const tsFiles: string[] = [];

  for await (const file of glob.scan({ cwd: PATHS.cli2, absolute: true })) {
    if (!file.endsWith(".test.ts")) {
      tsFiles.push(file);
    }
  }

  // Build using Bun.build API
  // Output ESM format (default) to match package.json "type": "module"
  // Externalize Elm-compiled .cjs files — they're resolved at runtime, not bundled here
  const result = await Bun.build({
    entrypoints: tsFiles,
    outdir,
    target: "node",
    format: "esm",
    root: PATHS.cli2, // Set root so output files are directly in outdir
    external: ["*.cjs"],
  });

  if (!result.success) {
    console.error("Build failed:");
    for (const message of result.logs) {
      console.error(message);
    }
    throw new Error("TypeScript build failed");
  }
}

async function makeCli2Elm() {
  log("build:cli2", "Compiling Elm...");
  // Compile to .js first, then rename to .cjs so it's treated as CommonJS in ESM context
  await elmMake(["src/Morphir/Elm/CLI.elm"], {
    cwd: PATHS.cli2,
    output: "Morphir.Elm.CLI.js",
  });
  // Rename to .cjs for proper CommonJS handling in ESM project
  const { rename } = await import("fs/promises");
  await rename(
    join(PATHS.cli2, "Morphir.Elm.CLI.js"),
    join(PATHS.cli2, "Morphir.Elm.CLI.cjs")
  );
}

log("build:cli2", "Building CLI2...");

// Parallel execution
await Promise.all([compileCli2Ts(), makeCli2Elm()]);

log("build:cli2", "Done");
