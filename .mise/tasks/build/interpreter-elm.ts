#!/usr/bin/env bun
//MISE description="Compile Elm interpreter worker to JS"

import { elmMake, log, mkdir, join, ROOT_DIR } from "../_lib.ts";

const pkgDir = join(ROOT_DIR, "packages/morphir-interpreter-wasm");

log("build:interpreter-elm", "Compiling Elm interpreter worker...");

await mkdir(join(pkgDir, "build"), { recursive: true });

await elmMake(["src/Morphir/Interpreter/Worker.elm"], {
  cwd: pkgDir,
  output: "build/Morphir.Interpreter.js",
});

log("build:interpreter-elm", "Done");
