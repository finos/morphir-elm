#!/usr/bin/env node

// Increase stack size for complex type inference (see GitHub issue #1258).
// The Elm type solver uses deep recursion that exceeds Node.js default stack (~1MB)
// on large value definitions. Re-exec with 8MB stack if needed.
import { execFileSync } from "child_process";

if (!process.env.__MORPHIR_STACK_EXPANDED) {
  process.env.__MORPHIR_STACK_EXPANDED = "1";
  try {
    execFileSync(process.execPath, ["--stack-size=8192", ...process.argv.slice(1)], {
      stdio: "inherit",
      env: process.env,
    });
  } catch (e: any) {
    process.exit(e.status || 1);
  }
  process.exit(0);
}

// NPM imports
import { Command } from 'commander'
import { make } from './cliAPI.js'
import 'log-timestamp'

// Set up Commander
const program = new Command()
program
    .name('morphir make')
    .description('Translate Elm sources to Morphir IR')
    .option('-p, --project-dir <path>', 'Root directory of the project where morphir.json is located.', '.')
    .option('-o, --output <path>', 'Target file location where the Morphir IR will be saved.', 'morphir-ir.json')
    .option('-t, --types-only', 'Only include type information in the IR, no values.', false)
    .option('-i, --indent-json', 'Use indentation in the generated JSON file.', false)
    .option("-I, --include [pathOrUrl...]", "Include additional Morphir distributions as a dependency. Can be specified multiple times. Can be a path, url, or data-url.")
    .parse(process.argv)

const dirAndOutput = program.opts()

// run make
make(dirAndOutput.projectDir, dirAndOutput)