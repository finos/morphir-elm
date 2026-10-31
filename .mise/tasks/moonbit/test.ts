#!/usr/bin/env bun
//MISE description="Test the MoonBit Elm module on wasm, wasm-gc, js and native, or on one target"
//MISE depends=["moonbit:deps"]

import { log } from "../_lib.ts";
import { modulePackages, moon } from "./_moon.ts";

const TARGETS = ["wasm", "wasm-gc", "js", "native"] as const;
const requested = process.argv[2];
if (requested !== undefined && !(TARGETS as readonly string[]).includes(requested)) {
  throw new Error(`moonbit:test: unknown target '${requested}'; expected one of ${TARGETS.join(", ")}`);
}

const packages = modulePackages();
for (const target of requested === undefined ? TARGETS : [requested]) {
  log("moonbit:test", `Testing on ${target}`);
  await moon(["test", "--target", target, ...packages]);
}
