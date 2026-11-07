# Proposal

## Why

MoonBit 0.10.20 (`moonc v0.10.20+65efd5b93`, `moon 0.1.20261104`) is the toolchain for the 0.10.20 rollout across
the Morphir MoonBit repositories. The maintainer approved the rollout on 2026-11-07, without support for 0.10.18:
0.10.20 deprecates the `} derive(...)` syntax and moves to the `#derive(...)` attribute.

## What Changes

- Pin MoonBit `0.10.20+65efd5b93` in `mise.moonbit.toml`.
- Commit the 0.10.20 `moon fmt` and `moon info` output: `#derive(...)` in the sources and the package interfaces.
- Replace the deprecated `String::view` call in `frontend/lower` with `String::exact_view`.
- In `scripts/elm-parity-refresh.mbtx`, put the imports in the frontmatter and use `StringBuilder()`.
- Commit the classic-to-IR-4.0.0 converter (`cli2/mep/generated/classic-ir.js`) that 0.10.20 builds.
- `moonbit:check` turns off only the `deprecated_syntax` warning, because the pinned finos/morphir-moonbit sources
  (workspace members) still use the old syntax. `moon fmt --check` still refuses that syntax in this module.
- The module spec names MoonBit `0.10.20+65efd5b93`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `elm-extension/module`: the pinned MoonBit version is `0.10.20+65efd5b93`.

## Beads

- **Tracked by**: `morphir-ukvn.1.20`
- **Related**: `morphir-ukvn.1.16` (the move to MoonBit 0.10.18)

## Impact

- `mise.moonbit.toml`, `.mise/tasks/moonbit/check.ts`, `moonbit/**` (format and interfaces only, one API call, the
  parity script), `cli2/mep/generated/classic-ir.js`, and the module spec.
- The Elm extension's module bytes change; its version stays `0.5.0-preview.2`. No release is part of this change.
