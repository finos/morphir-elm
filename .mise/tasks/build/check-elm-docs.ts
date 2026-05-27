#!/usr/bin/env bun
//MISE description="Check Elm documentation compiles"
//MISE depends=["setup:elm-tooling"]

import { elmMake, log } from "../_lib.ts";

log("build:check-elm-docs", "Checking Elm docs compile...");

await elmMake([], { docs: "docs.json" });

log("build:check-elm-docs", "Done");
