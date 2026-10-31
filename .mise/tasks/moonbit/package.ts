#!/usr/bin/env bun
//MISE description="Build the Elm extension's Wasm module and its SHA-256 into dist/elm-extension/artifacts"
//MISE depends=["moonbit:deps"]

import { createHash } from "node:crypto";
import { copyFile, join, log, mkdir, PATHS, readFile, rm, writeFile } from "../_lib.ts";
import { MOONBIT_DIR, moon } from "./_moon.ts";
import { moduleImports } from "../../../moonbit/tooling/bytes-host.ts";
import { checksumLine, moduleVersion, wasmArtifactName } from "../../../moonbit/tooling/module.ts";

const version = moduleVersion(await readFile(join(MOONBIT_DIR, "moon.mod"), "utf8"));
const name = wasmArtifactName(version);
const output = join(PATHS.dist, "elm-extension", "artifacts");

// From 0.10.18, moon links wasm executables for WASI by default, which adds a wasi_snapshot_preview1.fd_write
// import. The morphir-bytes-v1 ABI allows only the three morphir_bytes_v1 imports, so turn WASI linking off for this
// build only: the MoonBit scripts, such as the parity refresh, use moonbitlang/async and need WASI.
await moon(["build", "--target", "wasm", "--release", "extension"], { env: { MOON_WASI_LINK: "0" } });
const built = join(MOONBIT_DIR, "_build", "wasm", "release", "build", "finos", "morphir-elm", "extension", "extension.wasm");

// The morphir-bytes-v1 ABI allows exactly these imports. A toolchain change must not ship a module that hosts refuse.
const imports = moduleImports(await readFile(built));
const allowed = ["morphir_bytes_v1.input_byte", "morphir_bytes_v1.input_len", "morphir_bytes_v1.output_byte"];
if (JSON.stringify(imports) !== JSON.stringify(allowed)) {
  throw new Error(`moonbit:package: the module imports ${imports.join(", ")}; only ${allowed.join(", ")} are allowed`);
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await copyFile(built, join(output, name));
const sha256 = createHash("sha256").update(await readFile(join(output, name))).digest("hex");
await writeFile(join(output, `${name}.sha256`), checksumLine(sha256, name));
log("moonbit:package", `${join(output, name)} ${sha256}`);
