# CLI2 Modernization for `bun build --compile`

**Date**: 2026-02-25
**Status**: Approved

## Problem

The cli2 codebase uses Node.js-era patterns (`createRequire`, `__dirname` from `import.meta.url`, runtime `require()` for package.json) that are incompatible with `bun build --compile`. Seven files independently load Elm-compiled `.cjs` modules via `createRequire`, and the main entry point uses Commander's external-command pattern which spawns child processes — neither works inside a compiled binary.

## Design

### 1. Centralized Elm Worker Module

New `packages/cli2/elm-worker.ts` imports `Morphir.Elm.CLI.cjs` using Bun's native CJS import and exports the initialized worker. All files that currently use `createRequire` to load the Elm worker switch to importing from this module. Single worker instance, single point of change.

### 2. Unified Entry Point

Delete the old `morphir.ts` (external command pattern that spawns child processes). Rename `morphir-bundle.ts` → `morphir.ts`. One entry point for both dev (`bun run`) and compiled binary. Uses dynamic import dispatch for subcommands.

### 3. Static Package.json Import

Replace `createRequire` + `require(package.json)` in `morphir-mcp.ts` with `import packageJson from "../../package.json"` (matching what the bundle entry point already does).

### 4. Embedded Redistributable Files

Replace `__dirname`-based path resolution in `cli.ts`, `morphir-snowpark-gen.ts`, and `morphir-typescript-gen.ts` with compile-time embedded file contents (Bun's `import` of text files or `Bun.file` at build time). Redistributable templates get written to disk at generation time instead of copied from a filesystem-relative directory.

### 5. Remove `createRequire` Entirely

After all changes, no file in cli2 uses `createRequire` or `import.meta.url`-based `__dirname` synthesis. The `elmExternalPlugin` in `build:cli2.ts` becomes unnecessary for the compiled binary path.

## What Stays the Same

- All Commander option definitions in subcommand files
- All business logic (make, gen, stats, dockerize, etc.)
- The Elm compilation step (CLI.elm → .cjs)
- The `build:cli-binaries.ts` mise task structure
- Install scripts (`scripts/install.sh`, `scripts/install.ps1`)
