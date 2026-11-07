# Proposal

## Why

`morphir.initialize` agrees four model limits: `maxEncodedBytes`, `maxDecodedBytes`, `maxDepth` and `maxNodes`. The
MoonBit Elm extension checks only the two byte limits. The MoonBit host refuses a model payload that is deeper than
`maxDepth` levels or has more than `maxNodes` JSON values (finos/morphir-moonbit `pkgs/morphir-moonbit/mep/model_budget.mbt`
and `wire.parse_bounded`), and the Elm classic extension 0.6.0 checks both (`cli2/mep/model.ts` `jsonShape`, #1339).
So the extension can return a model that the host then refuses, and it accepts a model that is over the limits it
agreed.

## What Changes

- `compileModel` answers `success: false` with an `elm.model_limit` diagnostic, and no model, when the compiled IR
  is deeper than `maxDepth` levels or has more than `maxNodes` JSON values.
- `generateModel` refuses such a model with the model admission refusal it already gives for the byte limits:
  JSON-RPC error `-32602`, `Model admission refused: model_limit`.
- The count is the host's: the root value is level 1, and each JSON value is one node (an object key is not). The
  check scans the JSON text without building a tree and stops at the first value over a limit.
- The depth and node limits are typed values (`MaxDepth`, `MaxNodes`), not bare integers.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `elm-extension/mep-guest`: model payloads stay within the agreed depth and node limits.

## Beads

- **Tracked by**: `morphir-ukvn.1.19`

## Impact

- `moonbit/mep` (`claims.mbt`, `model.mbt`, `session.mbt` and tests) and `moonbit/README.md`.
- A model that was over the agreed depth or node limits, which the host refused, is now refused by the extension
  first. The conformance projects are well within the default limits; the session digest does not change.
