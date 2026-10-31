# Proposal

## Why

A browser host (finos/morphir-moonbit #296, bead `morphir-ukvn.5.64.36.14`) needs an Elm extension asset that it can run
in a Web Worker. The Elm extension's Wasm module is such an asset: one core Wasm module with the `morphir-bytes-v1`
ABI. But its release descriptor says only `runtime` `wasm`, so a publisher, an index or a pin author must inspect the
module's imports to learn the ABI. A contract 0.2.0 pin names it as `runtime.abi`.

## What Changes

- The Elm extension's `release.json` artifact entry gains `abi` `morphir-bytes-v1`. Hosts that do not read it ignore
  it, because readers ignore unknown members.
- The next release, `extension/elm/v0.5.0-preview.2`, carries it. It is also the first release built with MoonBit
  0.10.18 (#1330).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `elm-extension/release`: the descriptor's Wasm artifact also names its ABI, `morphir-bytes-v1`.

## Beads

- **Tracked by**: `morphir-ukvn.5.64.36.14.1`
- **Related**:
  - `morphir-ukvn.5.64.36.14` (the request for a browser-capable Elm asset)
  - `morphir-ukvn.5.64.36` (the MoonBit CLI's worker host, which runs the module)

## Impact

- `moonbit/tooling/release.ts` and its tests; `moonbit/moon.mod` and `moonbit/mep/claims.mbt` (version
  `0.5.0-preview.2`); the `elm-extension/release` spec.
- Releasing `extension/elm/v0.5.0-preview.2` needs Damian's approval.
