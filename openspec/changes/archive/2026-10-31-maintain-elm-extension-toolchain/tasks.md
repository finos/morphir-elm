# Tasks

## 1. Move to Bun 1.4.4 and record MoonBit 0.10.18 (morphir-ukvn.1.16)

- [x] 1.1 Pin Bun 1.4.4 in `mise.toml` and in the version check of `.github/workflows/elm-classic-extension.yml`. Verify that `mise exec -- bun --version` prints `1.4.4` and that `bun install --frozen-lockfile --ignore-scripts` changes no lockfile.
- [x] 1.2 Remove `BUN_JSC_useOMGJIT` from `.github/workflows/elm-extension.yml` and `.github/workflows/elm-extension-release.yml`, and make `moonbit/tests/guest-harness.ts` refuse a Bun older than 1.4.2. Verify that 10 runs of `moonbit/tests/session-digest.ts` without the variable give `2a36501d4af6f869a883931b90b61d9c0d499bb67098e921c388f38e6cfbeaa9` every time, and that `bun test moonbit/tooling moonbit/tests` passes.
- [x] 1.3 Verify the Elm classic extension on Bun 1.4.4: `bun test cli2/mep` passes after `mise run build:elm-classic-extension`, and `bun test tests-integration/mep-extension.test.ts` passes against the new executable.
- [x] 1.4 Verify the module spec delta: `MISE_ENV=moonbit mise exec -- moon version --all` shows `moonc v0.10.18+6c83a7f62`, and `openspec validate maintain-elm-extension-toolchain --strict` passes.
