#!/usr/bin/env bun
//MISE description="Run all build tasks"
//MISE depends=["build:check-elm-docs", "build:cli", "build:cli2", "build:treeview", "build:morphir-ts", "build:dev-server", "build:components", "build:try-morphir"]

import { log } from "./_lib.ts";

log("build", "All build tasks completed");
