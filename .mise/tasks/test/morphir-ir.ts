#!/usr/bin/env bun
//MISE description="Test Morphir IR TypeScript codecs"
//MISE depends=["build:cli"]

import { exec, morphirMake, morphirGen, log, ROOT_DIR } from "../_lib.ts";

log("test:morphir-ir", "Testing Morphir IR TypeScript codecs...");

// Step 1: Build Morphir IR (types only)
log("test:morphir-ir", "Building Morphir IR (types only)...");
await morphirMake(
  ".",
  "tests-integration/generated/morphirIR/morphir-ir.json",
  { typesOnly: true }
);

// Step 2: Generate TypeScript for Morphir.IR
log("test:morphir-ir", "Generating TypeScript...");
await morphirGen(
  "./tests-integration/generated/morphirIR/morphir-ir.json",
  "./tests-integration/generated/morphirIR/src/typescript/",
  "TypeScript"
);

// Step 3: Run codec tests
log("test:morphir-ir", "Running codec tests...");
await exec(
  "npx",
  ["mocha", "--require", "ts-node/register", "tests-integration/typescript/CodecsTest-Morphir-IR.ts"],
  { cwd: ROOT_DIR }
);

log("test:morphir-ir", "Done");
