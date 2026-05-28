#!/usr/bin/env bun
//MISE description="Build development server Elm components"
//MISE depends=["build:cli"]

import { elmMake, log, PATHS } from "../_lib.ts";

log("build:dev-server", "Building dev server Elm components...");

// Build all dev server components in parallel
await Promise.all([
  // Main dev server app
  elmMake(["src/Morphir/Web/DevelopApp.elm"], {
    cwd: PATHS.cli,
    output: "web/index.js",
  }),
  // Insight API
  elmMake(["src/Morphir/Web/Insight.elm"], {
    cwd: PATHS.cli,
    output: "web/insight.js",
  }),
  // Dev server API variant
  elmMake(["src/Morphir/Web/DevelopApp.elm"], {
    cwd: PATHS.cli,
    output: "web/insightapp.js",
  }),
]);

log("build:dev-server", "Done");
