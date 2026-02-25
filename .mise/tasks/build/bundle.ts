#!/usr/bin/env bun
//MISE description="Create single-file executables for CLI distribution"
//MISE depends=["build:cli", "build:cli2"]

import { $, mkdir, log, PATHS, ROOT_DIR, join } from "../_lib.ts";

log("build:bundle", "Creating single-file executables...");

await mkdir(join(PATHS.dist, "morphir"), { recursive: true });
await mkdir(join(PATHS.dist, "morphir-elm"), { recursive: true });
await mkdir(join(PATHS.dist, "morphir-server"), { recursive: true });

// Bun compile creates standalone executables (no Node required)
// --compile flag creates native executable, --minify reduces size
await Promise.all([
  // CLI v1 (legacy — morphir-elm)
  $`bun build ${join(PATHS.cli, "morphir.js")} --compile --minify --outfile ${join(PATHS.dist, "morphir-elm/morphir-elm")}`,
  $`bun build ${join(PATHS.cli, "morphir-elm-develop.js")} --compile --minify --outfile ${join(PATHS.dist, "morphir-server/morphir-server")}`,
  // CLI v2 (morphir) — built from compiled lib/ output so Elm .cjs resolves correctly
  $`bun build ${join(PATHS.cli2, "lib", "morphir.js")} --compile --minify --outfile ${join(PATHS.dist, "morphir/morphir")}`,
]);

log("build:bundle", "Created single-file executables in dist/");
