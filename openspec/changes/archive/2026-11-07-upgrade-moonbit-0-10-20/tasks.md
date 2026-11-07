# Tasks

## 1. Move the MoonBit Elm module to MoonBit 0.10.20

- [x] 1.1 Pin `0.10.20+65efd5b93` in `mise.moonbit.toml`. Verify that `MISE_ENV=moonbit mise exec -- moon version --all` shows `moonc v0.10.20+65efd5b93`.
- [x] 1.2 Commit the 0.10.20 `moon fmt` and `moon info` output, fix the deprecated API calls, and verify that `mise run moonbit:check` passes.
- [x] 1.3 Verify that `mise run moonbit:test` passes on `wasm`, `wasm-gc`, `js` and `native`, that `mise run moonbit:package` keeps exactly the three `morphir_bytes_v1` imports, and that `bun test moonbit/tooling moonbit/tests` passes.
- [x] 1.4 Commit the converter that `mise run moonbit:classic-ir` builds, and verify that `bun test cli2/mep` and `bun test tests-integration/mep-extension.test.ts` pass after `mise run build:elm-classic-extension`.
- [x] 1.5 Verify that `mise run moonbit:test:elm` passes and that `mise run moonbit:parity-refresh` changes nothing.
- [x] 1.6 Verify the module spec delta: `openspec validate upgrade-moonbit-0-10-20 --strict` passes.
