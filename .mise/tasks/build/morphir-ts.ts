#!/usr/bin/env bun
//MISE description="Build Morphir TypeScript library"
//MISE depends=["build:cli", "build:cli2"]
//MISE sources=["src/**/*.elm", "morphir.json", "morphir-ts/tsconfig.json", "morphir-ts/src/sdk/**/*", "cli/Morphir.Elm.CLI.js", "cli/Morphir.Elm.DevCLI.js", "cli2/Morphir.Elm.CLI.cjs"]
//MISE outputs=["morphir-ir.json", "morphir-ts/dist/**/*.js", "morphir-ts/src/generated/**/*.ts"]

import { del, morphirMake, morphirGen, exec, log, PATHS, ROOT_DIR, copyGlob, join } from "../_lib.ts";

log("build:morphir-ts", "Building Morphir TypeScript library...");

// Step 1: Generate morphir-ir.json from root
log("build:morphir-ts", "Generating morphir-ir.json...");
await morphirMake(".", "./morphir-ir.json", { force: true });

// Step 2: Clean previously generated files
log("build:morphir-ts", "Cleaning previous builds...");
await del([
  "morphir-ts/src/generated",
  "morphir-ts/dist",
]);

// Step 3: Generate TypeScript from IR
log("build:morphir-ts", "Generating TypeScript from IR...");
await morphirGen("./morphir-ir.json", "./morphir-ts/src/generated", "TypeScript");

// Step 4: Copy SDK files
log("build:morphir-ts", "Copying SDK files...");
await copyGlob("**/*", join(PATHS.morphirTs, "src/generated/morphir/sdk"), {
  cwd: join(PATHS.morphirTs, "src/sdk"),
});

// Step 5: Compile TypeScript
log("build:morphir-ts", "Compiling TypeScript...");
await exec("npx", ["tsc", "--project", "morphir-ts/tsconfig.json"], {
  cwd: ROOT_DIR,
});

log("build:morphir-ts", "Done");
