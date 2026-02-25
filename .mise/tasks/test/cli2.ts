#!/usr/bin/env bun
//MISE description="Run CLI2 unit tests"
//MISE depends=["build:cli2"]

import { exec, log } from "../_lib.ts";

log("test:cli2", "Running CLI2 unit tests...");

await exec("bun", ["test", "cli2/"]);

log("test:cli2", "Done");
