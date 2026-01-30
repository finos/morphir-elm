#!/usr/bin/env bun
//MISE description="Run all setup tasks"
//MISE depends=["setup:elm-tooling", "setup:morphir-jvm"]

import { log } from "./_lib.ts";

log("setup", "All setup tasks completed");
