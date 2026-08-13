#!/usr/bin/env node
// Guard against Node 24 EBADF double-close on GC (finos/morphir-elm#1282)
import "./ebadf-guard.js";

// NPM imports
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { Command } from "commander";

// ESM equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create require for loading CommonJS modules
const require = createRequire(import.meta.url);

// Read the package.json of this package
const packageJson = require(path.join(__dirname, "../../package.json"));

// Set up Commander
const program = new Command();
program
  .version(packageJson.version, "-v, --version")
  .command("make", "Translate Elm sources to Morphir IR")
  .command("json-schema-gen", "Generate Json Schema from the Morphir IR")
  .command("stats", "Collect morphir features used in a model into a document")
  .command(
    "dockerize",
    "Creates a docker image of a Morphir IR and Morphir Develop"
  )
  .command(
    "test-coverage",
    "Generates report on number of branches in a Morphir value and TestCases covered"
  )
  //.command('generate-test-data', 'Creates a docker image of a Morphir IR and Morphir Develop')
  .command(
    "init",
    "Launches an interactive session to initialize a new morphir project."
  )
  .command("mcp", "Start a Model Context Protocol server for Morphir project interaction")
  // transpile commands
  .command("scala-gen", "Generate scala code from Morphir IR")
  .command("snowpark-gen", "Generate Scala with Snowpark code from Morphir IR")
  .command("typescript-gen", "Generate typescript code from Morphir IR")
  .parse(process.argv);
