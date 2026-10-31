# Spec Delta

## MODIFIED Requirements

### Requirement: The bundle descriptor describes one Wasm artifact

The release SHALL include a `release.json` with `schemaVersion` `2.0.0-draft.2`, `extensionId` `morphir-elm`,
`shortId` `elm`, the release version, the full tagged commit as `gitCommit`, `platformDifferences` `none`, and one
artifact with `runtime` `wasm`, `abi` `morphir-bytes-v1`, no `platform`, its file name, its SHA-256, and the claims
that the guest reports in describe.

#### Scenario: Descriptor content

- **WHEN** the descriptor of release `0.5.0-preview.2` is read
- **THEN** it has one artifact named `morphir-elm-0.5.0-preview.2.wasm`, `runtime` is `wasm`, `abi` is `morphir-bytes-v1`, the artifact has no `platform` member, and its `claims` equal the guest's describe claims
