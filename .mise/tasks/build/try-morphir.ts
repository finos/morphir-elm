#!/usr/bin/env bun
//MISE description="Build Try Morphir web app"
//MISE depends=["build:cli"]
//MISE sources=["src/**/*.elm", "cli/src/**/*.elm", "cli/elm.json"]
//MISE outputs=["cli/web/try-morphir.html"]

import { elmMake, log, PATHS } from "../_lib.ts";

log("build:try-morphir", "Building Try Morphir...");

await elmMake(["src/Morphir/Web/TryMorphir.elm"], {
  cwd: PATHS.cli,
  output: "web/try-morphir.html",
});

log("build:try-morphir", "Done");
