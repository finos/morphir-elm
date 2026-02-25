#!/usr/bin/env bun
//MISE description="Build WASM component from JS + Elm"
//MISE depends=["build:interpreter-elm"]

import { exec, log, join, ROOT_DIR } from "../_lib.ts";

const pkgDir = join(ROOT_DIR, "packages/morphir-interpreter-wasm");

log("build:interpreter-wasm", "Building WASM component...");

await exec("npx", [
  "jco", "componentize",
  "src/interpreter.js",
  "--wit", "wit/",
  "--world-name", "interpreter",
  "--output", "build/interpreter.wasm",
], { cwd: pkgDir });

log("build:interpreter-wasm", "Done");
