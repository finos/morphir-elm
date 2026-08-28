#!/usr/bin/env bun
//MISE description="Run Elm unit tests"

import { exec, log } from "../_lib.ts";

log("test:unit", "Running Elm unit tests...");

const elmPath = Bun.which("elm");
if (!elmPath) {
  throw new Error("Elm compiler not found on PATH. Run `mise install`.");
}

await exec("npx", ["elm-test", "--compiler", elmPath]);

log("test:unit", "Done");
