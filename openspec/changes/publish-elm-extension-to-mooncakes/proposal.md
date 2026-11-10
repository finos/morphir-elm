# Proposal

## Why

finos/morphir-elm owns the MoonBit module `finos/morphir-elm`, but the only version on mooncakes is `0.1.0`, the
frozen copy that finos/morphir-moonbit published. finos/morphir-moonbit can move its engine, host and workbench to
this repository's module (bead `morphir-n246`) only when this repository publishes it. The Elm extension release has
no mooncakes step, and `moon package` of `moonbit/` today makes an archive with no license and with the repository's
TypeScript tooling.

## What Changes

- `moonbit/LICENSE` (Apache-2.0) and `moonbit/.moonignore`, so that the module archive has a license and does not
  have `tooling/`, `tests/`, `scripts/`, `deps.toml` or `moon.work`.
- A new job `mooncakes` in `.github/workflows/elm-extension-release.yml`, after `publish`, on the same tag. It does
  these steps in sequence:
  1. Package `moonbit/` from the tagged commit.
  2. Before any credential exists, test the archive alone on `wasm`, `wasm-gc`, `js` and `native` with a new Moon
     home and no workspace.
  3. Stop if the version is already on mooncakes.
  4. Publish one time. Only this step gets `MOONCAKES_TOKEN`.
  5. Test the published version from a new consumer on the four targets.
- A task `release:elm-extension-mooncakes` (`package`, `publish`, `verify`) and pure rules in
  `moonbit/tooling/mooncakes.ts` with unit tests.
- No new pull-request or merge-queue job. The version stays `0.5.0-preview.2` in this change. The bump to
  `0.5.0-preview.3`, the tag and the publication are later steps that need the maintainer's approval.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `elm-extension/release`: the release also publishes the module `finos/morphir-elm` to mooncakes, at the release
  version, from an archive that it tests before it publishes.

## Beads

- **Tracked by**: `morphir-oa72`
- **Related**: `morphir-n246` (blocked by this work: the morphir-moonbit engine, host and workbench move to the
  published module), `morphir-cugo` (after `morphir-n246`: removes the frozen copy in finos/morphir-moonbit)

## Impact

- New: `moonbit/LICENSE`, `moonbit/.moonignore`, `moonbit/tooling/mooncakes.ts` and its test,
  `.mise/tasks/release/elm-extension-mooncakes.ts`.
- Changed: `.github/workflows/elm-extension-release.yml` (one job), `moonbit/README.md`, `DEVELOPING.md`.
- The workflow reads the organization secret `MOONCAKES_TOKEN`, which finos/morphir-elm can see.
- The Wasm module, the session digest and the GitHub release do not change.
