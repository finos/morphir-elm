# elm-extension/release Specification

## Purpose

Defines how the Elm extension `morphir-elm`, built from the MoonBit module, is versioned, bundled, attested and
published from this repository, apart from the Elm classic extension.

## Requirements

### Requirement: A release comes from a version tag on vnext

A release SHALL start only from a tag `extension/elm/v<version>`, where `<version>` is SemVer and equals the version
in `moonbit/moon.mod`, on a commit reachable from `vnext`. Any other tag or commit SHALL stop the release before
anything is published.

#### Scenario: Version mismatch

- **WHEN** tag `extension/elm/v0.6.0` is pushed and `moonbit/moon.mod` says `0.5.0`
- **THEN** the release fails and names both versions

#### Scenario: Tag not on vnext

- **WHEN** a valid tag points to a commit that is not on `vnext`
- **THEN** the release fails and publishes nothing

### Requirement: Versions continue above the earlier releases

The tags `extension/elm/v0.1.0` to `extension/elm/v0.4.1` hold releases of the JavaScript extension, made before it
became the Elm classic extension. A release of the Elm extension SHALL have a version greater than `0.4.1`, and the
release SHALL refuse a tag that already exists as a GitHub release.

#### Scenario: Version not above 0.4.1

- **WHEN** `moonbit/moon.mod` says `0.4.1` and tag `extension/elm/v0.4.1` is used
- **THEN** the release fails and states that the version must be greater than `0.4.1`

#### Scenario: First release

- **WHEN** tag `extension/elm/v0.5.0-preview.1` is released
- **THEN** it is a new GitHub release, and the releases `extension/elm/v0.1.0` to `v0.4.1` do not change

### Requirement: The two Elm extensions release apart

Tags `extension/elm/v*` SHALL start only the Elm extension's release, and tags `extension/elm-classic/v*` SHALL
start only the Elm classic extension's release.

#### Scenario: Elm tag

- **WHEN** tag `extension/elm/v0.5.0-preview.1` is pushed
- **THEN** the Elm classic release workflow does not run

#### Scenario: Elm classic tag

- **WHEN** tag `extension/elm-classic/v0.5.0` is pushed
- **THEN** the Elm extension's release workflow does not run

### Requirement: The bundle descriptor describes one Wasm artifact

The release SHALL include a `release.json` with `schemaVersion` `2.0.0-draft.2`, `extensionId` `morphir-elm`,
`shortId` `elm`, the release version, the full tagged commit as `gitCommit`, `platformDifferences` `none`, and one
artifact with `runtime` `wasm`, no `platform`, its file name, its SHA-256, and the claims that the guest reports in
describe.

#### Scenario: Descriptor content

- **WHEN** the descriptor of release `0.5.0-preview.1` is read
- **THEN** it has one artifact named `morphir-elm-0.5.0-preview.1.wasm`, `runtime` is `wasm`, the artifact has no `platform` member, and its `claims` equal the guest's describe claims

### Requirement: Every artifact has a checksum file

For each artifact the release SHALL include `<filename>.sha256`, whose content is exactly the lowercase hexadecimal
SHA-256, two spaces, the file name and a newline. The digest SHALL equal the one in `release.json`.

#### Scenario: Checksum check

- **WHEN** a user downloads the release and runs `sha256sum --check` on each `.sha256` file
- **THEN** every check passes

### Requirement: Released bytes are the tested bytes

The release SHALL publish the same Wasm bytes that its test jobs ran. A digest that differs from the one built and
tested SHALL stop the release.

#### Scenario: Digest match

- **WHEN** the release is published
- **THEN** the published artifact's SHA-256 equals the SHA-256 of the module the test jobs ran

### Requirement: Artifacts carry GitHub attestations

Each artifact SHALL have a GitHub artifact attestation made by this repository's Elm extension release workflow, so a
repository owner can verify the publisher as `finos/morphir-elm` and that workflow.

#### Scenario: Verify an artifact

- **WHEN** a user runs `gh attestation verify <artifact> --repo finos/morphir-elm`
- **THEN** verification passes, and the signer workflow is `.github/workflows/elm-extension-release.yml`

### Requirement: Previews are prereleases

A release whose version has a prerelease part SHALL be published as a GitHub prerelease. No release of this extension
SHALL be marked as the repository's latest release.

#### Scenario: Preview release

- **WHEN** `extension/elm/v0.5.0-preview.1` is released
- **THEN** the GitHub release is a prerelease and is not marked latest
