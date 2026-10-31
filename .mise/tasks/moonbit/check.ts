#!/usr/bin/env bun
//MISE description="Check, format-check and interface-check the MoonBit Elm module"
//MISE depends=["moonbit:deps"]

import { $, ROOT_DIR } from "../_lib.ts";
import { modulePackages, moon } from "./_moon.ts";

const packages = modulePackages();
await moon(["check", "--deny-warn", "--target", "all", ...packages]);
await moon(["fmt", "--check", ...packages]);
// The committed pkg.generated.mbti files must be what the pinned toolchain writes. A new package's interface is an
// untracked file, so look at the status, not only the diff.
await moon(["info", ...packages]);
// Changes that are only staged are fine: the second status column shows the working tree and untracked files.
const status = (await $`git -C ${ROOT_DIR} status --porcelain -- moonbit`.text())
  .split("\n")
  .filter((line) => line.length > 2 && line[1] !== " ")
  .join("\n");
if (status !== "") {
  await $`git -C ${ROOT_DIR} diff -- moonbit`.nothrow();
  throw new Error(`moonbit:check: moon fmt or moon info would change moonbit/, or files are not committed:\n${status}`);
}
