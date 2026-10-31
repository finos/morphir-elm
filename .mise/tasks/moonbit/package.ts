#!/usr/bin/env bun
//MISE description="Build the Elm extension's Wasm module and its SHA-256 into dist/elm-extension/artifacts"
//MISE depends=["moonbit:deps"]

import { createHash } from "node:crypto";
import { copyFile, join, log, mkdir, PATHS, readFile, rm, writeFile } from "../_lib.ts";
import { MOONBIT_DIR, moon } from "./_moon.ts";
import { checksumLine, moduleVersion, wasmArtifactName } from "../../../moonbit/tooling/module.ts";

const version = moduleVersion(await readFile(join(MOONBIT_DIR, "moon.mod"), "utf8"));
const name = wasmArtifactName(version);
const output = join(PATHS.dist, "elm-extension", "artifacts");

await moon(["build", "--target", "wasm", "--release", "extension"]);
const built = join(MOONBIT_DIR, "_build", "wasm", "release", "build", "finos", "morphir-elm", "extension", "extension.wasm");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await copyFile(built, join(output, name));
const sha256 = createHash("sha256").update(await readFile(join(output, name))).digest("hex");
await writeFile(join(output, `${name}.sha256`), checksumLine(sha256, name));
log("moonbit:package", `${join(output, name)} ${sha256}`);
