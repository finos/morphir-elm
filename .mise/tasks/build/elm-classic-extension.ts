#!/usr/bin/env bun
//MISE description="Build the standalone Morphir Elm classic frontend (the JavaScript MEP extension)"
//MISE depends=["build:cli2"]

import { $, join, log, mkdir, PATHS, rm, ROOT_DIR } from "../_lib.ts";

const outputDirectory = join(PATHS.dist, "elm-classic-extension");
const executableName = `morphir-elm-classic-extension${
  process.platform === "win32" ? ".exe" : ""
}`;
const outputPath = join(outputDirectory, executableName);

log("build:elm-classic-extension", "Compiling standalone executable...");
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await $`bun build ${join(
  ROOT_DIR,
  "cli2/mep-extension.ts"
)} --compile --minify --outfile ${outputPath}`;
log("build:elm-classic-extension", `Created ${outputPath}`);
