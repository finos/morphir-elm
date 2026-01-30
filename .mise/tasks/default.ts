#!/usr/bin/env bun
//MISE description="Full build pipeline (clean, check, setup, build)"
//MISE depends=["clean", "test:check-package-lock", "setup", "build"]

import { log } from "./_lib.ts";

log("default", "Full build pipeline completed");
