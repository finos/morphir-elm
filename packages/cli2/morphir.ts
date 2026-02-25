#!/usr/bin/env bun

/**
 * Unified CLI entry point for single-file binary distribution.
 *
 * Unlike morphir.ts which uses Commander's external-command pattern
 * (spawning morphir-<subcommand> as a child process), this file
 * dispatches subcommands via dynamic import so everything can be
 * bundled into a single executable with `bun build --compile`.
 *
 * Each subcommand module (morphir-make.ts, etc.) calls
 * `program.parse(process.argv)` at the module level, so we
 * rewrite process.argv before importing to make Commander
 * parse the correct arguments.
 */

// Use static import so bun can inline this at compile time
// (createRequire doesn't work inside bun --compile binaries)
import packageJson from "../../package.json";

const subcommand = process.argv[2];

// Show version
if (
  process.argv.includes("-v") ||
  process.argv.includes("--version") ||
  process.argv.includes("-V")
) {
  console.log(packageJson.version);
  process.exit(0);
}

// Show help if no subcommand
if (!subcommand || subcommand === "help" || subcommand === "--help" || subcommand === "-h") {
  console.log(`morphir ${packageJson.version}`);
  console.log("");
  console.log("Usage: morphir <command> [options]");
  console.log("");
  console.log("Commands:");
  console.log("  make                 Translate Elm sources to Morphir IR");
  console.log("  json-schema-gen      Generate Json Schema from the Morphir IR");
  console.log("  stats                Collect morphir features used in a model");
  console.log("  dockerize            Create a docker image of a Morphir IR");
  console.log("  test-coverage        Generate test coverage report");
  console.log("  init                 Initialize a new morphir project");
  console.log("  mcp                  Start a Model Context Protocol server");
  console.log("  scala-gen            Generate Scala code from Morphir IR");
  console.log("  snowpark-gen         Generate Snowpark code from Morphir IR");
  console.log("  typescript-gen       Generate TypeScript code from Morphir IR");
  console.log("  generate-test-data   Generate test data from Morphir IR");
  console.log("");
  console.log("Run morphir <command> --help for command-specific options.");
  process.exit(0);
}

// Rewrite process.argv so the subcommand module's Commander.parse()
// sees the right arguments: ['morphir-<cmd>', ...rest]
const rest = process.argv.slice(3);
process.argv = [process.argv[0], `morphir-${subcommand}`, ...rest];

// Dispatch to the appropriate subcommand module
switch (subcommand) {
  case "make":
    await import("./morphir-make.js");
    break;
  case "scala-gen":
    await import("./morphir-scala-gen.js");
    break;
  case "snowpark-gen":
    await import("./morphir-snowpark-gen.js");
    break;
  case "typescript-gen":
    await import("./morphir-typescript-gen.js");
    break;
  case "json-schema-gen":
    await import("./morphir-json-schema-gen.js");
    break;
  case "stats":
    await import("./morphir-stats.js");
    break;
  case "dockerize":
    await import("./morphir-dockerize.js");
    break;
  case "generate-test-data":
    await import("./morphir-generate-test-data.js");
    break;
  case "init":
    await import("./morphir-init.js");
    break;
  case "mcp":
    await import("./morphir-mcp.js");
    break;
  case "test-coverage":
    await import("./morphir-test-coverage.js");
    break;
  default:
    console.error(`Unknown command: ${subcommand}`);
    console.error("Run morphir --help for a list of commands.");
    process.exit(1);
}
