#!/usr/bin/env bun
//MISE description="Run Spark integration tests (requires mill)"
//MISE depends=["build:cli"]

import { exec, morphirMake, morphirGen, log, PATHS, ROOT_DIR } from "../_lib.ts";

log("test:integration-spark", "Running Spark integration tests...");

// Step 1: Build Spark model
log("test:integration-spark", "Building Spark model...");
await morphirMake(
  "./tests-integration/spark/model",
  "./tests-integration/generated/sparkModel/morphir-ir.json"
);

// Step 2: Generate Spark code
log("test:integration-spark", "Generating Spark code...");
await morphirGen(
  "./tests-integration/generated/sparkModel/morphir-ir.json",
  "./tests-integration/generated/sparkModel/src/spark/",
  "Spark"
);

// Step 3: Build with mill (if available)
try {
  log("test:integration-spark", "Building with mill...");
  await exec("mill", ["__.compile"], { cwd: PATHS.testsIntegration });

  // Step 4: Run Spark tests
  log("test:integration-spark", "Running Spark tests...");
  await exec("mill", ["spark.test"], { cwd: PATHS.testsIntegration });

  log("test:integration-spark", "Done");
} catch (err: any) {
  if (err.message?.includes("ENOENT") || err.message?.includes("not found")) {
    log("test:integration-spark", "Skipping - mill build tool not available");
  } else {
    throw err;
  }
}
