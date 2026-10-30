# Proposal

## Why

The MoonBit Morphir CLI (finos/morphir-moonbit `apps/morphir`) is now the main Morphir CLI. Language frontends are
leaving its binary: the CLI will install them as extensions from GitHub-hosted repositories (`morphir-ukvn.5.64.34`).
The MoonBit Elm frontend and backend are built into that binary today. They belong in finos/morphir-elm, next to the
JavaScript Elm extension, released by this repository as an extension that the CLI can install, in native hosts and
in the browser.

The MoonBit code is the more complete Elm implementation that is not JavaScript. It lowers values, expressions and
patterns, infers types on every node, and has a full-IR backend. The Rust `morphir-elm-binding` crate, which an older
plan (A6) would have moved here, lowers type declarations only, and the Rust CLI it served is being sunset.

## What Changes

- Import `pkgs/morphir-elm` (module `finos/morphir-elm`: frontend, backend, mapping, fixtures, conformance,
  acceptance) and its parity-refresh script from finos/morphir-moonbit into `moonbit/`, keeping the git history.
- Build and test the module here: a MoonBit toolchain pinned through mise, the unpublished morphir-moonbit modules
  through a pinned checkout until they are published on mooncakes, and pull-request CI on `vnext` (unit tests on four
  targets, `elm make` checks, and the parity check against `morphir-elm` 2.100.0).
- Add a portable Wasm MEP guest in `moonbit/extension` that serves the Elm frontend and backend over the
  `morphir-bytes-v1` ABI. It compiles a whole Elm project, with many documents, in one request.
- Release the guest as extension `morphir-elm-moonbit` (short id `elm-moonbit`) on tags `extension/elm-moonbit/v*`,
  as a bundle with `release.json` 2.0.0-draft.2, a `.sha256` file per artifact, and GitHub artifact attestations.
  The first release is a preview, `0.1.0-preview.1`.
- Document the two Elm extensions side by side. The JavaScript extension (`morphir-elm`, `extension/elm/v*`,
  `cli2/mep`) does not change.
- Freeze the morphir-moonbit copy: after the import lands, Elm changes are made here only.

## Capabilities

### New Capabilities

- `moonbit-elm/module`: the MoonBit Elm module in this repository: how it is built and tested, and the checks that
  keep its output equal to `morphir-elm` and its generated Elm valid.
- `moonbit-elm/mep-guest`: the portable Wasm MEP extension: its ABI, the claims it reports, and how it answers
  compile and generate requests.
- `moonbit-elm/release`: how the extension is versioned, bundled, attested and published, and how its releases stay
  apart from the JavaScript extension's releases.

### Modified Capabilities

None.

## Beads

- **Tracked by**: `morphir-ukvn.1.15`
- **Related**:
  - `morphir-ukvn.1.8` (A6, superseded by this change)
  - `morphir-ukvn.5.64.34` (the MoonBit CLI acquires extensions from repositories; it will install this one)
  - `morphir-ukvn.5.64.36` (the MoonBit CLI hosts Wasm guests as workers; it runs this guest)
  - `morphir-ukvn.5.64.34.7` (removes the built-in Elm frontend; it depends on this change)
  - `morphir-ukvn.5.22` (the Elm frontend and backend epic in finos/morphir-moonbit; its open parity bugs move with
    the code)

## Impact

- New: `moonbit/`, `mise.moonbit.toml`, `.mise/tasks/moonbit/`, and the `moonbit-elm.yml` and
  `moonbit-elm-extension-release.yml` workflows.
- Docs: `README.md`, `DEVELOPING.md` and `NOTICE`.
- Dependencies: MoonBit `0.10.17+d971670cd`, mooncakes modules `moonrockz/krueger`, `moonrockz/expect` and
  `moonbitlang/x`, and finos/morphir-moonbit (pinned commit) for `finos/morphir-ir`, `finos/morphir-sdk-spec` and
  `finos/morphir-typing` until they are published.
- No change to the JavaScript extension, its workflows or its tags.
- Other repositories, as follow-ups that are not part of this change:
  - finos/morphir-moonbit publishes the three modules, then removes `pkgs/morphir-elm`, `pkgs/morphir-engine/elm` and
    the built-in registration (`morphir-ukvn.5.64.34.7`).
  - The `finos` extension index admits the release.
