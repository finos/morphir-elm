#!/usr/bin/env bun
//MISE description="Run WASM interpreter integration tests"
//MISE depends=["build:interpreter-wasm"]

import { exec, log, join, ROOT_DIR } from "../_lib.ts";

const pkgDir = join(ROOT_DIR, "packages/morphir-interpreter-wasm");

log("test:interpreter-wasm", "Running WASM interpreter integration tests...");

await exec("node", ["--test", "test/interpreter.test.js"], { cwd: pkgDir });

log("test:interpreter-wasm", "Done");
