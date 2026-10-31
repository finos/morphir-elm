# Tasks

Pull request 1 is groups 1 to 3, and pull request 2 is groups 4 and 5. Group 6 (the classic rename) is its own pull request and must land before pull request 3, which is group 7. All target `vnext`.

## 1. Import the MoonBit Elm module with its history (morphir-ukvn.1.15.1)

- [x] 1.1 Clone finos/morphir-moonbit `main` into a scratch directory outside the worktree, record its HEAD as `IMPORT_SHA`, and run `git filter-repo` as in design LAY-1. Verify that `git ls-tree -r --name-only HEAD` lists no file outside `moonbit/`, and that there are 13 or more commits.
- [x] 1.2 Merge the filtered history into the branch with `--allow-unrelated-histories --no-ff`, with a message that names `IMPORT_SHA`. Verify that `diff -r` between the filtered clone's `moonbit/` and the worktree's `moonbit/` prints nothing.
- [x] 1.3 Set `repository` in `moonbit/moon.mod` to `https://github.com/finos/morphir-elm`. Verify with `grep repository moonbit/moon.mod`.
- [x] 1.4 Verify that the imported commit messages link to `finos/morphir-moonbit#N`. `git log --format=%s -- moonbit | grep -c '(#[0-9]'` must print 0.

## 2. MoonBit toolchain, dependency pin and module tasks (morphir-ukvn.1.15.2)

- [x] 2.1 Add `mise.moonbit.toml` with MoonBit `0.10.17+d971670cd` for linux-x64, linux-arm64 and macos-arm64 (design TOOL-1), and add the `moonbit/` ignore rules to `.gitignore`. Verify that `MISE_ENV=moonbit mise exec -- moon version --all` shows `moonc v0.10.17+d971670cd` (plain `moon version` shows only the build tool).
- [x] 2.2 Add `.mise/tasks/moonbit/_moon.ts`, which runs `moon` in `moonbit/` and fails without it. Verify that the message contains `MISE_ENV=moonbit` when `moon` is not on `PATH`.
- [x] 2.3 Add `moonbit/deps.toml` (commit `IMPORT_SHA`; paths `pkgs/morphir-ir`, `pkgs/morphir-sdk-spec`, `pkgs/morphir-typing`, `pkgs/morphir-sdk/conformance`) and `moonbit/tooling/deps.ts`, with tests for an invalid commit, no paths, a path outside `pkgs/`, a missing copy, a current copy, another commit and fewer paths. Verify that `bun test moonbit/tooling` passes.
- [x] 2.4 Add the `moonbit:deps` task and `moonbit/moon.work`. Verify that a second run of `moonbit:deps` fetches nothing, and that `moon check --target wasm` in `moonbit/` succeeds. `moon` must not see packages under `.deps` or `tooling`.
- [x] 2.5 Add the `moonbit:check` (check, `moon fmt`, `moon info` with `git diff --exit-code`) and `moonbit:test` (wasm, wasm-gc, js, native) tasks. Verify that both pass with 0 failed tests, also when started from `moonbit/frontend`.
- [x] 2.6 Point `test-elm-make.mts`, `elm-parity-refresh.mbtx` and the two Python generators at `moonbit/` and the pinned checkout. Remove the engine acceptance output. Add the `moonbit:test:elm` and `moonbit:parity-refresh` tasks. Verify four things:
  - a frozen `bun install --cwd moonbit/scripts` changes no lockfile, and `elm --version` prints `0.19.1`;
  - `moonbit:test:elm` compiles at least seven projects;
  - the parity refresh leaves `moonbit/conformance` unchanged;
  - both generators leave `moonbit/` unchanged.

## 3. Pull-request CI and docs for the MoonBit Elm module (morphir-ukvn.1.15.3)

- [x] 3.1 Add `.github/workflows/elm-extension.yml` with the `test` and `elm` jobs (design CI-1), with actions pinned by SHA. Verify that `actionlint` reports nothing for the file.
- [x] 3.2 Write `moonbit/README.md`:
  - how to build and test with `MISE_ENV=moonbit`;
  - the pin, and when to remove it;
  - `IMPORT_SHA`;
  - the freeze.

  Add a "MoonBit Elm module" section to `DEVELOPING.md`, a table to `README.md` that names the Elm extension (MoonBit, `moonbit/`, in development) and the Elm classic extension (JavaScript, `cli2/mep`), and the MoonBit dependencies to `NOTICE`. Verify that every path these docs name exists.
- [x] 3.3 Push the branch and open pull request 1 to `vnext` as a draft. The body says to merge with a merge commit. Verify that the `test` and `elm` jobs and EasyCLA pass.
- [x] 3.4 Mark the pull request ready and ask Damian to review. Do not merge.

## 4. Spike: build and run the Elm guest under the host limits (morphir-ukvn.1.15.4)

- [x] 4.1 Build a minimal `moonbit/extension` main package that exports `handle` and echoes its input. Verify with a Bun script that the import list is exactly `morphir_bytes_v1.input_len`, `input_byte` and `output_byte`.
- [x] 4.2 Find how to set the memory maximum: a `moon` link option, or a post-build rewrite (design GST-2). Verify that the built module declares a maximum of 4096 pages or less.
- [x] 4.3 Compile the largest conformance project through the frontend inside the Wasm module. Record the request size, the response and model sizes, and the time per call. Verify them against 4 MiB, 2 MiB decoded and 10 s.
- [x] 4.4 Record the results in this change's `design.html` (GST-2 and Risks), and raise any limit problem under `morphir-ukvn.5.64.36`. Verify that `openspec validate move-moonbit-elm-extension --strict` passes.

## 5. Elm MEP guest over the morphir-bytes-v1 ABI (morphir-ukvn.1.15.5)

- [ ] 5.1 Add a Bun test host (`moonbit/tooling/bytes-host.ts`) that instantiates a module with the three imports and calls `handle`. Verify it with tests for a response, a notification (-2), exit (0) and failure (-1).
- [ ] 5.2 Implement describe and the session lifecycle (design GST-1). Verify with tests the claims in the `mep-guest` spec, the method-not-found error (-32601), and `handle` returning 0 after exit.
- [ ] 5.3 Implement `morphir.frontend.compileModel` for many documents. Verify that, for each clean conformance project, the guest's model equals the module frontend's IR.
- [ ] 5.4 Return source problems as diagnostics, and refuse package dependencies. Verify with tests for a port module (`elm.unsupported` with a location) and for a request with a dependency.
- [ ] 5.5 Implement `morphir.backend.generateModel`. Verify that the files it returns for the acceptance projects compile with `elm make` 0.19.1.
- [ ] 5.6 Add the `moonbit:package` task (it writes the module and its SHA-256 to `dist/elm-extension/artifacts/`) and a `guest` job in `elm-extension.yml`. Verify that the job passes in CI.
- [ ] 5.7 Document the guest in `moonbit/README.md`: the ABI, the methods, the claims and the refusals. Open pull request 2 to `vnext`, then verify that CI passes and ask Damian to review.

## 6. Rename the JavaScript Elm extension to Elm classic (morphir-ukvn.1.15.7)

- [ ] 6.1 Set `cli2/mep/extension.json` to id `morphir-elm-classic`, short id `elm-classic`, name `Morphir Elm classic frontend` and version `0.5.0`, and update the expected identity in `cli2/mep/protocol.test.ts`, `cli2/mep/release.test.ts` and `tests-integration/mep-extension.test.ts`. Verify that `bun test cli2/mep` passes and that describe reports `morphir-elm-classic`.
- [ ] 6.2 Rename the archive, raw executable and descriptor names in `cli2/mep/release.ts`, the executable in `.mise/tasks/build/mep-extension.ts`, the descriptor in `.mise/tasks/release/mep-extension.ts`, and the error prefix in `cli2/mep-extension.ts`, all to `morphir-elm-classic-extension`. Verify that `bun test cli2/mep` passes, and that `bun test tests-integration/mep-extension.test.ts` passes against a fresh build.
- [ ] 6.3 Rename the tasks to `build:elm-classic-extension` and `release:elm-classic-extension`, and the workflows to `elm-classic-extension.yml` and `elm-classic-extension-release.yml`, with the tag filter `extension/elm-classic/v*`. In the publish job, add `id-token: write`, `attestations: write` and `actions/attest@v4` on the archives and raw executables (design CLS-1). Verify three things:
  - `actionlint` reports nothing for both files;
  - `mise run release:elm-classic-extension -- extension/elm-classic/v0.5.0` writes `morphir-elm-classic-extension-0.5.0-*` files that pass `sha256sum --check`;
  - the task refuses `extension/elm/v0.5.0`.
- [ ] 6.4 Rename the MEP section of `DEVELOPING.md` to "Elm classic extension", with the new tag, task and file names and the migration note from the proposal, and update the release notes text in the workflow. Verify that `git grep -n 'extension/elm/v' -- cli2 .github .mise DEVELOPING.md` finds only the migration note's mention of the earlier releases.
- [ ] 6.5 Open the pull request to `vnext`, verify that CI and EasyCLA pass, and ask Damian to review. After the merge, Damian decides when to tag `extension/elm-classic/v0.5.0`. Then verify that release with `sha256sum --check` and `gh attestation verify`.

## 7. Release workflow, attestations and docs for the Elm extension (morphir-ukvn.1.15.6)

- [ ] 7.1 Add the tag rules (`moonbit/tooling/release.ts`): parse `extension/elm/v<semver>`, compare the version with `moonbit/moon.mod`, and refuse a version that is not greater than `0.4.1`. Verify with tests for a mismatch, a wrong prefix, `extension/elm-classic/v0.5.0` and `extension/elm/v0.4.1`.
- [ ] 7.2 Add the descriptor writer (`moonbit/tooling/release.ts`). It gets `claims` from describe on the built module, and writes `release.json` and the `.sha256` files (design REL-1). Verify with tests the single `wasm` artifact `morphir-elm-<version>.wasm` with no `platform`, `extensionId` `morphir-elm`, the claims equal to describe, and the `.sha256` format.
- [ ] 7.3 Add the `release:elm-extension` task and `.github/workflows/elm-extension-release.yml` (design REL-2), with `actions/attest@v4` on `dist/artifacts/*`. The build job refuses a tag that already has a GitHub release. Verify that `actionlint` reports nothing, and that a local dry run with a test tag writes the three files and passes `sha256sum --check`.
- [ ] 7.4 Add a test that checks the GitHub tag filters: `extension/elm/v*` must not match `extension/elm-classic/v0.5.0`, and `extension/elm-classic/v*` must not match `extension/elm/v0.5.0-preview.1`. Verify that the test passes.
- [ ] 7.5 Set `moonbit/moon.mod` to `0.5.0-preview.1`. Document the release steps in `DEVELOPING.md` in an "Elm extension" section before the Elm classic section. Verify that describe reports `0.5.0-preview.1`.
- [ ] 7.6 Open pull request 3 to `vnext`, verify that CI passes, and ask Damian to review. After the merge, Damian decides when to tag `extension/elm/v0.5.0-preview.1`. Then verify the release with `gh attestation verify` and `sha256sum --check`.

## Workflow follow-up

- Archive this change after the four pull requests are merged and the preview release is verified.
- Ask Damian before any change in finos/morphir-moonbit:
  - publish the three modules (already requested);
  - add the freeze note;
  - remove the code and the built-in registration (`morphir-ukvn.5.64.34.7`).
- Ask Damian before any change in finos/morphir:
  - add the release to the `finos` extension index;
  - use the classic name in decision 0001 and `.config/published-extension-bundles.toml`.
- Ask Damian before telling morphir-moonbit that its `extension/elm/v0.4.1` fixture is now an Elm classic release.
