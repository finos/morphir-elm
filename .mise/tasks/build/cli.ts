#!/usr/bin/env bun
//MISE description="Build CLI (Elm compilation)"
//MISE depends=["build:check-elm-docs"]
//MISE sources=["src/**/*.elm", "cli/src/**/*.elm", "cli/elm.json"]
//MISE outputs=["cli/Morphir.Elm.CLI.js", "cli/Morphir.Elm.DevCLI.js"]

import { elmMake, log, PATHS } from "../_lib.ts";

log("build:cli", "Compiling CLI Elm modules...");

// Sequential: concurrent elm make on a cold ~/.elm cache causes race conditions on Windows
await elmMake(["src/Morphir/Elm/CLI.elm"], {
  cwd: PATHS.cli,
  output: "Morphir.Elm.CLI.js",
});
await elmMake(["src/Morphir/Elm/DevCLI.elm"], {
  cwd: PATHS.cli,
  output: "Morphir.Elm.DevCLI.js",
});

log("build:cli", "Done");
