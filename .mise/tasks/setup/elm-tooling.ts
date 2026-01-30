#!/usr/bin/env bun
//MISE description="Install Elm tooling"

import { exec, log } from "../_lib.ts";

log("setup:elm-tooling", "Installing Elm tooling...");

await exec("npx", ["elm-tooling", "install"]);

log("setup:elm-tooling", "Done");
