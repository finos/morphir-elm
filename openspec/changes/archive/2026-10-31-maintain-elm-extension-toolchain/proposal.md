# Proposal

## Why

Two facts about the Elm extension's toolchain are out of date.

- The module spec requires MoonBit `0.10.17+d971670cd`, but `vnext` moved to `0.10.18+6c83a7f62` in #1330.
- The repository pins Bun 1.4.0. Its JavaScriptCore has a compiler bug that gives wrong answers for the Elm extension's module once the OMG WebAssembly tier inlines a SIMD function into a non-SIMD one (WebKit 319839@main, bead `morphir-ukvn.1.15.8`). #1326 worked around it with `BUN_JSC_useOMGJIT=0`. Bun 1.4.2 and later contain the fix.

## What Changes

- Pin Bun 1.4.4 in `mise.toml`, and in the Elm classic workflow's version check.
- Remove `BUN_JSC_useOMGJIT=0` from the Elm extension workflows.
- `moonbit/tests` refuses to run under a Bun older than 1.4.2, instead of requiring the variable.
- The module spec names MoonBit `0.10.18+6c83a7f62`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `elm-extension/module`: the pinned MoonBit version is `0.10.18+6c83a7f62`.

## Beads

- **Tracked by**: `morphir-ukvn.1.16`
- **Related**:
  - `morphir-ukvn.1.15.8` (the JavaScriptCore bug: cause and the fixed Bun versions)
  - `morphir-ukvn.1.15` (the move of the MoonBit Elm extension, which wrote these specs)

## Impact

- `mise.toml`, `.github/workflows/elm-classic-extension.yml`, `.github/workflows/elm-extension.yml`,
  `.github/workflows/elm-extension-release.yml`, `moonbit/tests/guest-harness.ts`, and the module spec.
- The Elm classic extension's executables are built with Bun 1.4.4 from its next release on. The Elm classic workflow
  tests them on Linux, macOS and Windows.
