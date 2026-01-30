#!/usr/bin/env bun
//MISE description="Build Try Morphir web app"
//MISE depends=["build:check-elm-docs"]

import { elmMake, log, PATHS } from "../_lib.ts";

log("build:try-morphir", "Building Try Morphir...");

await elmMake(["src/Morphir/Web/TryMorphir.elm"], {
  cwd: PATHS.cli,
  output: "web/try-morphir.html",
});

log("build:try-morphir", "Done");
