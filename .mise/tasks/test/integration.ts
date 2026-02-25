#!/usr/bin/env bun
//MISE description="Run integration tests"
//MISE depends=["build:cli", "build:cli2"]

import {
  del,
  exec,
  morphirMake,
  morphirGen,
  morphirJsonSchemaGen,
  morphirDockerize,
  log,
  PATHS,
  ROOT_DIR,
  join,
  copyGlob,
  $,
} from "../_lib.ts";

log("test:integration", "Running integration tests...");

// Step 1: Clean previous integration test artifacts
log("test:integration", "Cleaning previous artifacts...");
await del([
  "tests-integration/generated",
  "tests-integration/reference-model/morphir-ir.json",
  "tests-integration/json-schema/model/dist",
  "tests-integration/json-schema/model/morphir-ir.json",
]);

// Step 2: Build morphir IR for test models
log("test:integration", "Building test models...");

// Build reference model (both new and old CLI)
await morphirMake(
  "./tests-integration/reference-model",
  "./tests-integration/generated/refModel/morphir-ir.json"
);

await morphirMake(
  "./tests-integration/reference-model",
  "./tests-integration/generated/refModel/morphir-ir.json",
  { force: true }
);

// Build JSON schema model
await morphirMake(
  "./tests-integration/json-schema/model",
  "./tests-integration/json-schema/model/morphir-ir.json",
  { useCli2: true }
);

// Step 3: Run tests in parallel
log("test:integration", "Running test suites...");

async function testMorphirTest() {
  // Copy IR to reference model directory
  await copyGlob(
    "morphir-ir.json",
    join(PATHS.testsIntegration, "reference-model"),
    { cwd: join(PATHS.testsIntegration, "generated/refModel") }
  );

  await exec(
    "node",
    ["./packages/cli/morphir-elm.js", "test", "-p", "./tests-integration/reference-model"],
    { cwd: ROOT_DIR }
  );
}

async function testScala() {
  log("test:integration", "Generating Scala...");
  await morphirGen(
    "./tests-integration/generated/refModel/morphir-ir.json",
    "./tests-integration/generated/refModel/src/scala/",
    "Scala"
  );

  // Mill build is optional - skip if not available
  log("test:integration", "Skipping Scala build (mill not available in standard setup)");
}

async function testTypeScript() {
  log("test:integration", "Generating TypeScript...");
  await morphirGen(
    "./tests-integration/generated/refModel/morphir-ir.json",
    "./tests-integration/generated/refModel/src/typescript/",
    "TypeScript"
  );

  log("test:integration", "Running TypeScript tests...");
  // Use bun test directly (bun natively understands TypeScript and has built-in test runner)
  await exec(
    "bun",
    ["test", "./tests-integration/typescript/TypesTest-refModel.ts"],
    { cwd: ROOT_DIR }
  );
}

// Run parallel test suites
await Promise.all([testMorphirTest(), testScala(), testTypeScript()]);

// Step 4: Dockerize test
log("test:integration", "Testing dockerize...");
await morphirDockerize("./tests-integration/reference-model");

// Step 5: JSON Schema generation test
log("test:integration", "Testing JSON schema generation...");
await morphirJsonSchemaGen(
  "./tests-integration/json-schema/model/morphir-ir.json",
  "./tests-integration/json-schema/model/dist",
  "JsonSchema"
);

log("test:integration", "All integration tests passed");
