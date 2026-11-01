# Proposal

## Why

Damian decided on 2026-11-01 that every Morphir extension moves to the latest MEP, 0.2.0-draft.1, as soon as possible.
The Elm classic extension (`cli2/mep`, `extension/elm-classic/v0.5.1`) speaks MEP 0.1 only. The MoonBit CLI's
worker host compiles through the 0.2 model operation `morphir.frontend.compileModel`, which carries Morphir IR 4.0.0 in
a model envelope. Elm classic produces classic IR (format 3), so it also needs a v3-to-v4 conversion.

## What Changes

- Elm classic speaks MEP 0.2.0-draft.1 beside 0.1. Describe lists both versions. Initialize selects 0.2 when the host
  offers it with a model transport offer, and 0.1 otherwise, so the finos/morphir Rust host and older hosts keep
  working.
- In a 0.2 session, `morphir.frontend.compileModel` answers the tuple `morphir-ir` / `morphir-json` / envelope
  `0.1.0-draft.1` / IR `4.0.0`. The model payload is the compiled IR converted to v4.
- The conversion is finos/morphir-ir's own migration (`versioned/json` read, then `migration.to_current`, then the v4
  JSON writer), which the MoonBit Elm extension's parity tests already use on `morphir-elm` output. It is compiled once
  to JavaScript from `moonbit/`, committed under `cli2/mep/generated/`, and checked in CI against a fresh build. So the
  classic extension's build and release need no MoonBit toolchain.
- Unchanged: the legacy `morphir.frontend.compile`, workspace discovery, one document per compile, and an absent
  `exposedModules` meaning every module (0.5.1).
- Release `extension/elm-classic/v0.6.0`.

## Capabilities

### New Capabilities

- `elm-classic-extension/mep`: the MEP versions the Elm classic extension speaks, how it negotiates them, and how it
  answers `compileModel`.

### Modified Capabilities

None.

## Beads

- **Tracked by**: `morphir-ukvn.1.18`
- **Related**:
  - `morphir-ukvn.5.64.36.16` (absent `exposedModules`; its behaviour carries over)
  - `morphir-ukvn.5.64.36` (the MoonBit CLI's worker host, which runs Elm classic as a process worker)

## Impact

- `cli2/mep/protocol.ts`, `identity.ts`, a new model-operation module, and their tests.
- `cli2/mep/generated/classic-ir.js` (generated), with its MoonBit source package in `moonbit/classic-ir` and a check
  in the Elm extension workflow.
- `cli2/mep/extension.json` version `0.6.0`.
