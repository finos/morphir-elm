#!/usr/bin/env bun
//MISE description="Check, format-check and interface-check the MoonBit Elm module"
//MISE depends=["moonbit:deps"]

import { $, ROOT_DIR } from "../_lib.ts";
import { modulePackages, moon } from "./_moon.ts";

const packages = modulePackages();
await moon(["update"]);
await moon(["check", "--deny-warn", "--target", "all", ...packages]);
await moon(["fmt", "--check", ...packages]);
// The committed pkg.generated.mbti files must be what the pinned toolchain writes.
await moon(["info", ...packages]);
await $`git -C ${ROOT_DIR} diff --exit-code -- moonbit`;
