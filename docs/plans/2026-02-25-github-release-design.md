# GitHub Release Workflow

**Date**: 2026-02-25
**Status**: Approved

## Problem

The project has no automated way to publish release artifacts to GitHub Releases. The WASM interpreter component needs to be distributed as downloadable binaries for hosts in Rust, Go, Python, etc.

## Design

### Triggers

1. **Tag push**: any tag matching `v*`
2. **Manual dispatch**: inputs for `branch` (string) and `version` (string)

### Tag Convention

- Default branch (`main`): `v{version}` (e.g., `v2.101.0`) → **latest release**
- Non-default branch: `v{branchName}-{version}` (e.g., `vnext-0.1.0`) → **prerelease**

### Manual Dispatch Behavior

Takes branch + version. Checks out that branch, creates the appropriate tag (`v{version}` if `main`, `v{branchName}-{version}` otherwise), pushes it, then builds and releases.

### Build Steps

1. Checkout the tagged commit
2. Install dependencies (mise, bun, elm-tooling)
3. Build the interpreter WASM component (`mise run build:interpreter-wasm`)
4. Build platform-specific CLI binaries (`mise run build:cli-binaries`)

### Release Artifacts

**CLI binaries** (built with `bun build --compile` via `morphir-bundle.ts` unified entry point):
1. **`morphir-linux-amd64`** — Linux x86_64 binary
2. **`morphir-linux-arm64`** — Linux ARM64 binary
3. **`morphir-darwin-arm64`** — macOS Apple Silicon binary
4. **`morphir-windows-amd64.exe`** — Windows x86_64 binary

**WASM interpreter artifacts**:
5. **`interpreter.wasm`** — raw WASM component file
6. **`morphir-interpreter-wit.tar.gz`** — tarball of WIT interface definitions
7. **`morphir-interpreter-wasm.tar.gz`** — tarball bundling WASM file + WIT directory

**Install scripts** (also release artifacts):
8. **`install.sh`** — Unix installer (Linux/macOS) with `--cli`, `--wasm`, `--wit` options
9. **`install.ps1`** — Windows installer with `-Cli`, `-Wasm`, `-Wit` parameters

### Release Metadata

- Title: tag name
- Auto-generated release notes
- `prerelease: true` if tag matches `v{branchName}-{version}` pattern (contains non-semver prefix)
- `prerelease: false` (latest) if tag is plain `v{semver}`
