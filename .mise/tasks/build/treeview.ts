#!/usr/bin/env bun
//MISE description="Build treeview webpack bundle"
//MISE depends=["build:check-elm-docs"]
//MISE sources=["cli/treeview/src/*", "cli/treeview/webpack.config.js", "cli/treeview/tsconfig.json"]
//MISE outputs=["cli/treeview/dist/bundle.js", "cli/treeview/dist/index.html"]

import { exec, log, PATHS, ROOT_DIR } from "../_lib.ts";

log("build:treeview", "Building treeview with webpack...");

await exec("npx", ["webpack", "--config", "cli/treeview/webpack.config.js"], {
  cwd: ROOT_DIR,
});

log("build:treeview", "Done");
