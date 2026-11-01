#!/usr/bin/env bun
//MISE description="Build the classic-to-IR-4.0.0 converter (moonbit/classic-ir) to JavaScript for the Elm classic extension"
//MISE depends=["moonbit:deps"]

// The Elm classic extension (cli2/mep) converts the classic IR of its Elm worker to IR 4.0.0 with finos/morphir-ir's
// migration. The converter is built here and committed as cli2/mep/generated/classic-ir.js, so the classic
// extension's build and release need no MoonBit toolchain. CI runs this task and requires no difference.
import { copyFile, join, log, ROOT_DIR } from "../_lib.ts";
import { MOONBIT_DIR, moon } from "./_moon.ts";

await moon(["build", "--target", "js", "--release", "classic-ir"]);
const built = join(MOONBIT_DIR, "_build", "js", "release", "build", "finos", "morphir-elm", "classic-ir", "classic-ir.js");
const committed = join(ROOT_DIR, "cli2", "mep", "generated", "classic-ir.js");
await copyFile(built, committed);
log("moonbit:classic-ir", `Wrote ${committed}`);
