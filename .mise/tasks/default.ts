#!/usr/bin/env bun
//MISE description="Full build pipeline (clean, check, setup, build)"
//MISE depends=["clean", "test:check-package-lock", "test:check-node-version", "setup"]

import { exec, log, ROOT_DIR } from "./_lib.ts";

// setup has completed — now run build phase (elm requires node_modules from setup)
await exec("mise", ["run", "build"], { cwd: ROOT_DIR });

log("default", "Full build pipeline completed");
