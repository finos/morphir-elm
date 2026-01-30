#!/usr/bin/env bun
//MISE description="Build insight components (concatenate JS)"
//MISE depends=["build:dev-server"]

import { concat, log, PATHS, join } from "../_lib.ts";

log("build:components", "Concatenating insight components...");

await concat(
  [
    join(PATHS.cli, "web/insight.js"),
    join(PATHS.cli, "web/morphir-insight-element.js"),
  ],
  join(PATHS.cli, "web/insight.js")
);

log("build:components", "Done");
