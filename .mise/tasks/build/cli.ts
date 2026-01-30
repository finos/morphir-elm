#!/usr/bin/env bun
//MISE description="Build CLI (Elm compilation)"
//MISE depends=["build:check-elm-docs"]

import { elmMake, log, PATHS } from "../_lib.ts";

log("build:cli", "Compiling CLI Elm modules...");

// Build both CLI and DevCLI in parallel
await Promise.all([
  elmMake(["src/Morphir/Elm/CLI.elm"], {
    cwd: PATHS.cli,
    output: "Morphir.Elm.CLI.js",
  }),
  elmMake(["src/Morphir/Elm/DevCLI.elm"], {
    cwd: PATHS.cli,
    output: "Morphir.Elm.DevCLI.js",
  }),
]);

log("build:cli", "Done");
