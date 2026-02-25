#!/usr/bin/env bun
//MISE description="Transpile WASM component to browser ESM"
//MISE depends=["build:interpreter-wasm"]

import { exec, log, mkdir, join, ROOT_DIR } from "../_lib.ts";

const pkgDir = join(ROOT_DIR, "packages/morphir-interpreter-wasm");

log("build:interpreter-browser", "Transpiling WASM component for browser...");

await mkdir(join(pkgDir, "build/browser"), { recursive: true });

await exec("npx", [
  "jco", "transpile",
  "build/interpreter.wasm",
  "--out-dir", "build/browser",
], { cwd: pkgDir });

log("build:interpreter-browser", "Done");
