# Tasks

## 1. Record the ABI in the descriptor and prepare 0.5.0-preview.2 (morphir-ukvn.5.64.36.14.1)

- [x] 1.1 Add `abi: "morphir-bytes-v1"` to the artifact entry that `releaseDescriptor` in `moonbit/tooling/release.ts` writes. Verify with the updated `release.test.ts` that the entry has `runtime` `wasm`, `abi` `morphir-bytes-v1` and no `platform`.
- [x] 1.2 Set `moonbit/moon.mod` and `VERSION` in `moonbit/mep/claims.mbt` to `0.5.0-preview.2` and update `moonbit/mep/pkg.generated.mbti`. Verify that `moonbit:check` passes and that describe reports `0.5.0-preview.2`.
- [x] 1.3 Run `MISE_ENV=moonbit mise run release:elm-extension -- extension/elm/v0.5.0-preview.2`. Verify that the descriptor names `abi` `morphir-bytes-v1` and that `sha256sum --check` passes.

## Workflow follow-up

- After Damian approves the merge and the tag, tag `extension/elm/v0.5.0-preview.2` on `vnext` and verify the release with `gh attestation verify` and `sha256sum --check`.
- Archive this change after the release is verified.
