#!/usr/bin/env bun
//MISE description="Build treeview webpack bundle"
//MISE depends=["build:check-elm-docs"]

import { exec, log, PATHS, ROOT_DIR } from "../_lib.ts";

log("build:treeview", "Building treeview with webpack...");

await exec("npx", ["webpack", "--config", "packages/cli/treeview/webpack.config.js"], {
  cwd: ROOT_DIR,
});

log("build:treeview", "Done");
