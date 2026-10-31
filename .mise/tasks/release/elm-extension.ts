#!/usr/bin/env bun
//MISE description="Build, describe and check the Elm extension's release files (MISE_ENV=moonbit)"
//MISE depends=["moonbit:package"]

// Usage: MISE_ENV=moonbit mise run release:elm-extension -- <tag> [git-commit]
//
// Writes dist/elm-extension-release/ with the Wasm module, its .sha256 file and the version-2 bundle descriptor
// morphir-elm-<version>.release.json, whose artifact claims come from the module's own describe answer.
import { createHash } from "node:crypto";
import { $, copyFile, join, log, mkdir, PATHS, readFile, rm, ROOT_DIR, writeFile } from "../_lib.ts";
import { wasmGuest } from "../../../moonbit/tooling/bytes-host.ts";
import { moduleVersion, wasmArtifactName } from "../../../moonbit/tooling/module.ts";
import { describeClaims, parseReleaseTag, releaseDescriptor } from "../../../moonbit/tooling/release.ts";

const TASK = "release:elm-extension";
const [tag, commitArgument] = process.argv.slice(2);
if (tag === undefined) {
  console.error("usage: MISE_ENV=moonbit mise run release:elm-extension -- <tag> [git-commit]");
  process.exit(2);
}

const version = parseReleaseTag(tag, moduleVersion(await readFile(join(ROOT_DIR, "moonbit", "moon.mod"), "utf8")));
const gitCommit = commitArgument ?? (await $`git -C ${ROOT_DIR} rev-parse HEAD`.text()).trim();
const filename = wasmArtifactName(version);
const packaged = join(PATHS.dist, "elm-extension", "artifacts");
const output = join(PATHS.dist, "elm-extension-release");

const bytes = await readFile(join(packaged, filename));
const sha256 = createHash("sha256").update(bytes).digest("hex");
const checksum = await readFile(join(packaged, `${filename}.sha256`), "utf8");
if (!checksum.startsWith(`${sha256}  `)) {
  throw new Error(`${filename}.sha256 does not match the module`);
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await copyFile(join(packaged, filename), join(output, filename));
await copyFile(join(packaged, `${filename}.sha256`), join(output, `${filename}.sha256`));
const descriptor = releaseDescriptor({ version, gitCommit, filename, sha256, claims: describeClaims(wasmGuest(bytes)) });
const descriptorName = `morphir-elm-${version}.release.json`;
await writeFile(join(output, descriptorName), `${JSON.stringify(descriptor, null, 2)}\n`);
log(TASK, `Wrote ${filename} (${sha256}) and ${descriptorName} to ${output}`);
