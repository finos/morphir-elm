#!/usr/bin/env bun
//MISE description="Compile the Elm that the MoonBit backend generates with elm make 0.19.1"
//MISE depends=["moonbit:deps"]

import { exec, join } from "../../_lib.ts";
import { MOONBIT_DIR, requireMoon } from "../_moon.ts";

requireMoon();
const scripts = join(MOONBIT_DIR, "scripts");
// The scripts package has its own lockfile, which pins elm and morphir-elm for these checks.
await exec("bun", ["install", "--frozen-lockfile", "--cwd", scripts]);
await exec("bun", [join(scripts, "test-elm-make.mts")]);
