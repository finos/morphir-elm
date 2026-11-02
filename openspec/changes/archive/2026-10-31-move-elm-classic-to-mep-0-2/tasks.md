# Tasks

## 1. Tests first (morphir-ukvn.1.18)

- [x] 1.1 Write `cli2/mep/model.test.ts`: describe for 0.1 and 0.2 hosts, negotiation with a 0.1-only host, a host
  that offers both without a transport, a 0.2 host, and a 0.2-only host without a transport; compileModel envelope,
  refusals (unagreed tuple, wrong envelope, wrong IR version, context digest, language, package, sources), lifecycle
  codes, dependencies, limits and conversion failure. Verify that they fail before the change.
- [x] 1.2 Add a 0.2 session to `tests-integration/mep-extension.test.ts` with the MoonBit CLI's sequence, relative
  URIs and no `exposedModules`, against the golden `tests-integration/mep-extension/Example.v4.json`.

## 2. Converter

- [x] 2.1 Add `moonbit/classic-ir` (js target) and `mise run moonbit:classic-ir`; commit
  `cli2/mep/generated/classic-ir.js` and its declaration. Verify with `cli2/mep/classic-ir.test.ts`.
- [x] 2.2 In the Elm extension workflow, rebuild the converter and require no difference.

## 3. Protocol

- [x] 3.1 Add `cli2/mep/model.ts` (tuples, limits, agreement, envelope) and the 0.2 negotiation and compileModel in
  `protocol.ts`; set `extension.json` to `0.6.0` with `mepVersions` `["0.2.0-draft.1", "0.1"]`. Verify that
  `bun test cli2/mep`, the integration tests and `tsc -p cli2/mep` pass.
- [x] 3.2 Update DEVELOPING.md, the release notes and moonbit/README.md.

## 4. Qualify and release

- [x] 4.1 Run `mise run release:elm-classic-extension -- extension/elm-classic/v0.6.0` as a dry run; test the bundle
  executable with the integration tests.
- [x] 4.2 Qualify with finos/morphir-moonbit `main` (native and npm CLIs) and a contract 0.2.0 process pin with the
  bundle descriptor: describe, compileModel to a model, and a clean process exit.
- [x] 4.3 Open the pull request against `vnext`; merge after green CI and answered reviews.
- [x] 4.4 Tag `extension/elm-classic/v0.6.0`; verify the checksums, the attestations and a pinned compile with the
  published files.
- [x] 4.5 Report the tag, the asset digests and the receipts to the requesting session.

## Workflow follow-up

- Done 2026-10-31: finos/morphir-elm#1339 merged as c9efbc9c; `extension/elm-classic/v0.6.0` released (run 41268232852),
  verified with `shasum -a 256 -c` and `gh attestation verify` (12/12), and qualified with the published files through
  finos/morphir-moonbit `main` (native and npm CLIs, contract 0.2.0 pin with the bundle descriptor, 17/17). Reported in
  orchestration message `msg_1e351b5cbd6d`.
- Archive this change.
