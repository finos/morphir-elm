# Tasks

## 1. Enforce maxDepth and maxNodes on the model payload (morphir-ukvn.1.19)

- [x] 1.1 Write `moonbit/mep/model_shape_test.mbt`: for `maxDepth` and `maxNodes`, a case at the limit, one over and far over, on `compileModel` and `generateModel`. Verify that the over-limit cases fail before the change.
- [x] 1.2 Add `MaxDepth` and `MaxNodes` to the agreed limits, and check them in `envelope` (compile) and `open_envelope` (generate) with a scan that does not build a tree. Add white-box tests for the count (`moonbit/mep/model_wbtest.mbt`), with the `jsonShape` cases of `cli2/mep/model.test.ts` and a very deep payload.
- [x] 1.3 Verify that `mise run moonbit:check` passes, `mise run moonbit:test` passes on `wasm`, `wasm-gc`, `js` and `native`, `bun test moonbit/tests` passes and the session digest does not change.
- [x] 1.4 Update `moonbit/README.md`, and verify that `openspec validate enforce-elm-extension-model-shape-limits --strict` passes.
