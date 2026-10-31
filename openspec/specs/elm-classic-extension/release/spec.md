# elm-classic-extension/release Specification

## Purpose

Defines the identity and releases of the Elm classic extension: the JavaScript Elm frontend in `cli2/mep`, which was
released as `morphir-elm` before the MoonBit Elm extension took that id.

## Requirements

### Requirement: The classic extension reports its own identity

The JavaScript extension SHALL report extension id `morphir-elm-classic`, short id `elm-classic` and name
`Morphir Elm classic frontend` in describe, in its claims and in every release descriptor.

#### Scenario: Describe

- **WHEN** a host sends `morphir.extension.describe` to the classic extension
- **THEN** `extension.id` is `morphir-elm-classic` and `extension.name` is `Morphir Elm classic frontend`

#### Scenario: Descriptor

- **WHEN** the version-2 bundle descriptor of a classic release is read
- **THEN** `extensionId` is `morphir-elm-classic` and `shortId` is `elm-classic`

### Requirement: Classic releases use their own tags

A classic release SHALL start only from a tag `extension/elm-classic/v<version>` whose version equals the version in
`cli2/mep/extension.json`, on a commit reachable from `vnext`. The classic release SHALL refuse a tag
`extension/elm/v*`.

#### Scenario: Classic tag

- **WHEN** tag `extension/elm-classic/v0.5.0` is pushed and `cli2/mep/extension.json` says `0.5.0`
- **THEN** the classic release runs

#### Scenario: Elm tag

- **WHEN** the classic release task is given tag `extension/elm/v0.5.0`
- **THEN** it fails and names the expected form `extension/elm-classic/v<version>`

### Requirement: Classic file names name the classic extension

Archives, raw executables and descriptors of a classic release SHALL be named with `morphir-elm-classic-extension`,
and the executable inside an archive SHALL be `morphir-elm-classic-extension` (with `.exe` on Windows).

#### Scenario: Linux archive

- **WHEN** release `0.5.0` is packaged for `x86_64-unknown-linux-gnu`
- **THEN** the archive is `morphir-elm-classic-extension-0.5.0-x86_64-unknown-linux-gnu.tgz` and holds the executable `morphir-elm-classic-extension`

### Requirement: Earlier releases are kept as they are

The releases `extension/elm/v0.1.0` to `extension/elm/v0.4.1` SHALL stay published with their tags, assets and
digests unchanged. Nothing SHALL re-tag or re-upload them under the classic name.

#### Scenario: Pinned earlier release

- **WHEN** a consumer downloads `morphir-elm-extension-0.4.1-x86_64-unknown-linux-gnu.tgz` from `extension/elm/v0.4.1` after the rename
- **THEN** its SHA-256 is the same as before the rename

### Requirement: Classic artifacts carry GitHub attestations

Each artifact of a classic release SHALL have a GitHub artifact attestation made by
`.github/workflows/elm-classic-extension-release.yml`.

#### Scenario: Verify a classic artifact

- **WHEN** a user runs `gh attestation verify` on a classic artifact with `--repo finos/morphir-elm`
- **THEN** verification passes, and the signer workflow is `.github/workflows/elm-classic-extension-release.yml`
