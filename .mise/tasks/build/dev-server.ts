#!/usr/bin/env bun
//MISE description="Build development server Elm components"
//MISE depends=["build:cli"]
//MISE sources=["src/**/*.elm", "cli/src/**/*.elm", "cli/elm.json"]
//MISE outputs=["cli/web/index.js", "cli/web/insight.js", "cli/web/insightapp.js"]

import { elmMake, log, PATHS } from "../_lib.ts";

log("build:dev-server", "Building dev server Elm components...");

// Sequential: concurrent elm make calls against the same elm.json race on
// cli/elm-stuff and ~/.elm/<package>/artifacts.dat, producing
// "PROBLEM BUILDING DEPENDENCIES" failures on Windows.
await elmMake(["src/Morphir/Web/DevelopApp.elm"], {
  cwd: PATHS.cli,
  output: "web/index.js",
});
await elmMake(["src/Morphir/Web/Insight.elm"], {
  cwd: PATHS.cli,
  output: "web/insight.js",
});
await elmMake(["src/Morphir/Web/DevelopApp.elm"], {
  cwd: PATHS.cli,
  output: "web/insightapp.js",
});

log("build:dev-server", "Done");
