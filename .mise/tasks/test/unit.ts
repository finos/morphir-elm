#!/usr/bin/env bun
//MISE description="Run Elm unit tests"

import { exec, log } from "../_lib.ts";

log("test:unit", "Running Elm unit tests...");

await exec("npx", ["elm-test"]);

log("test:unit", "Done");
