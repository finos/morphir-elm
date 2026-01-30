#!/usr/bin/env bun
//MISE description="Clean build artifacts"

import { del, log } from "./_lib.ts";

log("clean", "Removing build artifacts...");

await del([
  "dist",
  "docs.json",
  "tests-integration/reference-model/Dockerfile",
]);

log("clean", "Done");
