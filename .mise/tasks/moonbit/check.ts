#!/usr/bin/env bun
//MISE description="Check, format-check and interface-check the MoonBit Elm module"
//MISE depends=["moonbit:deps"]

import { $, ROOT_DIR } from "../_lib.ts";
import { modulePackages, moon } from "./_moon.ts";

const packages = modulePackages();
// --deny-warn also applies to the finos/morphir-moonbit sources that moonbit/deps.toml pins (workspace members). At
// that commit they still use the `} derive(...)` syntax, which MoonBit 0.10.20 marks deprecated_syntax. Only that
// warning is off; `moon fmt --check` below still refuses the old syntax in this module. Remove `--warn-list` when
// deps.toml pins a finos/morphir-moonbit commit that is on MoonBit 0.10.20.
await moon(["check", "--deny-warn", "--warn-list", "-deprecated_syntax", "--target", "all", ...packages]);
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
