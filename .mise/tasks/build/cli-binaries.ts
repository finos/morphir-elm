#!/usr/bin/env bun
//MISE description="Build platform-specific CLI binaries using bun build --compile"
//MISE depends=["build:cli2"]

import { log, PATHS, join, mkdir, rm } from "../_lib.ts";

const BINARY_NAME = "morphir";

// Compile from source TS directly — Bun handles TypeScript natively.
// The source imports resolve ./Morphir.Elm.CLI.cjs from packages/cli2/
// which is the correct location. (The lib/ output externalizes .cjs files
// so it can't be used for --compile.)
const ENTRY_POINT = join(PATHS.cli2, "morphir.ts");
const OUT_DIR = join(PATHS.dist, "binaries");

// Platform targets supported by bun build --compile --target
const TARGETS = [
  { bunTarget: "bun-linux-x64", name: `${BINARY_NAME}-linux-amd64` },
  { bunTarget: "bun-linux-arm64", name: `${BINARY_NAME}-linux-arm64` },
  { bunTarget: "bun-darwin-arm64", name: `${BINARY_NAME}-darwin-arm64` },
  { bunTarget: "bun-windows-x64", name: `${BINARY_NAME}-windows-amd64.exe` },
] as const;

log("build:cli-binaries", "Building platform-specific CLI binaries...");

// Clean and create output directory
await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

// Build all targets in parallel
await Promise.all(
  TARGETS.map(async ({ bunTarget, name }) => {
    const outfile = join(OUT_DIR, name);
    log("build:cli-binaries", `  ${bunTarget} → ${name}`);

    const result = Bun.spawnSync(
      ["bun", "build", ENTRY_POINT, "--compile", "--minify", "--target", bunTarget, "--outfile", outfile],
      { stdout: "inherit", stderr: "inherit" }
    );

    if (result.exitCode !== 0) {
      throw new Error(`Failed to compile ${name} (exit code ${result.exitCode})`);
    }
  })
);

log("build:cli-binaries", `Done. Binaries in ${OUT_DIR}/`);
