# Spec Delta

## ADDED Requirements

### Requirement: The release publishes the module to mooncakes

After the GitHub release, the release SHALL publish the MoonBit module `finos/morphir-elm` to mooncakes, at the
release version, from an archive packaged from `moonbit/` of the tagged commit. (bead: morphir-oa72)

#### Scenario: Published version

- **WHEN** tag `extension/elm/v0.5.0-preview.3` is released
- **THEN** mooncakes has `finos/morphir-elm@0.5.0-preview.3`, and its sources are the `moonbit/` files of the tagged commit that the archive rules keep

### Requirement: The module archive holds the module only

The archive SHALL contain `moon.mod`, `README.md` and `LICENSE`. It SHALL NOT contain the repository tooling
(`tooling/`, `tests/`, `scripts/`), `deps.toml`, `moon.work`, or build and dependency directories. An archive that
breaks these rules SHALL stop the release before anything is uploaded.

#### Scenario: Missing license

- **WHEN** the packaged archive has no `LICENSE`
- **THEN** the mooncakes job fails before it uploads, and the message names `LICENSE`

#### Scenario: Repository tooling

- **WHEN** the packaged archive contains `tooling/release.ts`
- **THEN** the mooncakes job fails before it uploads, and the message names that path

### Requirement: The archive is tested alone before any credential

Before the mooncakes token is available, the release SHALL unpack the archive into an empty directory and run the
module's tests on `wasm`, `wasm-gc`, `js` and `native`, with a new Moon home and no workspace, so that every import
comes from mooncakes. A failure SHALL stop the release before anything is uploaded.

#### Scenario: Import not on mooncakes

- **WHEN** the module imports a module version that mooncakes does not have
- **THEN** the archive test fails and nothing is uploaded

### Requirement: A version is uploaded once

The release SHALL upload a version only when mooncakes reports that the version does not exist. When the version
exists, or the registry gives another answer, the release SHALL stop without an upload. The upload SHALL run once,
with no retry.

#### Scenario: Version already on mooncakes

- **WHEN** `finos/morphir-elm@0.5.0-preview.3` is already on mooncakes and the release of that version runs
- **THEN** the mooncakes job fails without an upload, and the message states that a published version cannot change

### Requirement: Only the upload step has the mooncakes token

Only the upload step SHALL receive the organization secret `MOONCAKES_TOKEN`. The step SHALL refuse a token that does
not authenticate as the mooncakes account `finos`, SHALL not write the token to its output, and SHALL remove the
credential file when it ends, on success and on failure.

#### Scenario: Wrong account

- **WHEN** the token authenticates as an account other than `finos`
- **THEN** the step fails before the upload, and the output does not contain the token

### Requirement: A new consumer verifies the published version

After the upload, the release SHALL make a new module that imports `finos/morphir-elm` at the release version, with a
new Moon home, and SHALL require its tests to pass on `wasm`, `wasm-gc`, `js` and `native`. The tests SHALL check
that the module reports the release version.

#### Scenario: Published module resolves

- **WHEN** `finos/morphir-elm@0.5.0-preview.3` is uploaded
- **THEN** the consumer resolves it from mooncakes, and its tests pass on the four targets
