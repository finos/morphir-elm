#!/usr/bin/env bun
//MISE description="Build the standalone Morphir Elm MEP frontend"
//MISE depends=["build:cli2"]

import { $, join, log, mkdir, PATHS, rm, ROOT_DIR } from "../_lib.ts";

const outputDirectory = join(PATHS.dist, "morphir-elm-extension");
const executableName = `morphir-elm-extension${
  process.platform === "win32" ? ".exe" : ""
}`;
const outputPath = join(outputDirectory, executableName);

log("build:mep-extension", "Compiling standalone executable...");
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await $`bun build ${join(
  ROOT_DIR,
  "cli2/mep-extension.ts"
)} --compile --minify --outfile ${outputPath}`;
log("build:mep-extension", `Created ${outputPath}`);
