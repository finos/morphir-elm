#!/usr/bin/env bun
//MISE description="Install npm dependencies (npm ci)"

import { exec, log } from "../_lib.ts";

log("setup:npm", "Installing npm dependencies...");
await exec("npm", ["ci"]);
log("setup:npm", "Done");
