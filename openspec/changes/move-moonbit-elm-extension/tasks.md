# Tasks

Pull request 1 is groups 1 to 3, pull request 2 is groups 4 and 5, and pull request 3 is group 6. All target `vnext`.

## 1. Import the MoonBit Elm module with its history (morphir-ukvn.1.15.1)

- [ ] 1.1 Clone finos/morphir-moonbit `main` into a scratch directory outside the worktree, record its HEAD as `IMPORT_SHA`, and run `git filter-repo` as in design LAY-1. Verify that `git ls-tree -r --name-only HEAD` lists no file outside `moonbit/`, and that there are 13 or more commits.
- [ ] 1.2 Merge the filtered history into the branch with `--allow-unrelated-histories --no-ff`, with a message that names `IMPORT_SHA`. Verify that `diff -r` between the filtered clone's `moonbit/` and the worktree's `moonbit/` prints nothing.
- [ ] 1.3 Set `repository` in `moonbit/moon.mod` to `https://github.com/finos/morphir-elm`. Verify with `grep repository moonbit/moon.mod`.
- [ ] 1.4 Verify that the imported commit messages link to `finos/morphir-moonbit#N`. `git log --format=%s -- moonbit | grep -c '(#[0-9]'` must print 0.

## 2. MoonBit toolchain, dependency pin and module tasks (morphir-ukvn.1.15.2)

- [ ] 2.1 Add `mise.moonbit.toml` with MoonBit `0.10.17+d971670cd` for linux-x64, linux-arm64 and macos-arm64 (design TOOL-1), and add the `moonbit/` ignore rules to `.gitignore`. Verify that `MISE_ENV=moonbit mise exec -- moon version` prints `0.10.17`.
- [ ] 2.2 Add `.mise/tasks/moonbit/_moon.ts`, which runs `moon` in `moonbit/` and fails without it. Verify that the message contains `MISE_ENV=moonbit` when `moon` is not on `PATH`.
- [ ] 2.3 Add `moonbit/deps.toml` (commit `IMPORT_SHA`; paths `pkgs/morphir-ir`, `pkgs/morphir-sdk-spec`, `pkgs/morphir-typing`, `pkgs/morphir-sdk/conformance`) and `moonbit/tooling/deps.ts`, with tests for an invalid commit, no paths, a path outside `pkgs/`, a missing copy, a current copy, another commit and fewer paths. Verify that `bun test moonbit/tooling` passes.
- [ ] 2.4 Add the `moonbit:deps` task and `moonbit/moon.work`. Verify that a second run of `moonbit:deps` fetches nothing, and that `moon check --target wasm` in `moonbit/` succeeds. `moon` must not see packages under `.deps` or `tooling`.
- [ ] 2.5 Add the `moonbit:check` (check, `moon fmt`, `moon info` with `git diff --exit-code`) and `moonbit:test` (wasm, wasm-gc, js, native) tasks. Verify that both pass with 0 failed tests, also when started from `moonbit/frontend`.
- [ ] 2.6 Point `test-elm-make.mts`, `elm-parity-refresh.mbtx` and the two Python generators at `moonbit/` and the pinned checkout. Remove the engine acceptance output. Add the `moonbit:test:elm` and `moonbit:parity-refresh` tasks. Verify four things:
  - a frozen `bun install --cwd moonbit/scripts` changes no lockfile, and `elm --version` prints `0.19.1`;
  - `moonbit:test:elm` compiles at least seven projects;
  - the parity refresh leaves `moonbit/conformance` unchanged;
  - both generators leave `moonbit/` unchanged.

## 3. Pull-request CI and docs for the MoonBit Elm module (morphir-ukvn.1.15.3)

- [ ] 3.1 Add `.github/workflows/moonbit-elm.yml` with the `test` and `elm` jobs (design CI-1), with actions pinned by SHA. Verify that `actionlint` reports nothing for the file.
- [ ] 3.2 Write `moonbit/README.md`:
  - how to build and test with `MISE_ENV=moonbit`;
  - the pin, and when to remove it;
  - `IMPORT_SHA`;
  - the freeze.

  Add a "MoonBit Elm module" section to `DEVELOPING.md`, a two-row table of the Elm extensions to `README.md`, and the MoonBit dependencies to `NOTICE`. Verify that every path these docs name exists.
- [ ] 3.3 Push the branch and open pull request 1 to `vnext` as a draft. The body says to merge with a merge commit. Verify that the `test` and `elm` jobs and EasyCLA pass.
- [ ] 3.4 Mark the pull request ready and ask Damian to review. Do not merge.

## 4. Spike: build and run the Elm guest under the host limits (morphir-ukvn.1.15.4)

- [ ] 4.1 Build a minimal `moonbit/extension` main package that exports `handle` and echoes its input. Verify with a Bun script that the import list is exactly `morphir_bytes_v1.input_len`, `input_byte` and `output_byte`.
- [ ] 4.2 Find how to set the memory maximum: a `moon` link option, or a post-build rewrite (design GST-2). Verify that the built module declares a maximum of 4096 pages or less.
- [ ] 4.3 Compile the largest conformance project through the frontend inside the Wasm module. Record the request size, the response and model sizes, and the time per call. Verify them against 4 MiB, 2 MiB decoded and 10 s.
- [ ] 4.4 Record the results in this change's `design.html` (GST-2 and Risks), and raise any limit problem under `morphir-ukvn.5.64.36`. Verify that `openspec validate move-moonbit-elm-extension --strict` passes.

## 5. Elm MEP guest over the morphir-bytes-v1 ABI (morphir-ukvn.1.15.5)

- [ ] 5.1 Add a Bun test host (`moonbit/tooling/bytes-host.ts`) that instantiates a module with the three imports and calls `handle`. Verify it with tests for a response, a notification (-2), exit (0) and failure (-1).
- [ ] 5.2 Implement describe and the session lifecycle (design GST-1). Verify with tests the claims in the `mep-guest` spec, the method-not-found error (-32601), and `handle` returning 0 after exit.
- [ ] 5.3 Implement `morphir.frontend.compileModel` for many documents. Verify that, for each clean conformance project, the guest's model equals the module frontend's IR.
- [ ] 5.4 Return source problems as diagnostics, and refuse package dependencies. Verify with tests for a port module (`elm.unsupported` with a location) and for a request with a dependency.
- [ ] 5.5 Implement `morphir.backend.generateModel`. Verify that the files it returns for the acceptance projects compile with `elm make` 0.19.1.
- [ ] 5.6 Add the `moonbit:package` task (it writes the module and its SHA-256 to `dist/moonbit-elm-extension/artifacts/`) and a `guest` job in `moonbit-elm.yml`. Verify that the job passes in CI.
- [ ] 5.7 Document the guest in `moonbit/README.md`: the ABI, the methods, the claims and the refusals. Open pull request 2 to `vnext`, then verify that CI passes and ask Damian to review.

## 6. Release workflow, attestations and docs for the MoonBit Elm extension (morphir-ukvn.1.15.6)

- [ ] 6.1 Add the tag rules (`moonbit/tooling/release.ts`): parse `extension/elm-moonbit/v<semver>`, and compare the version with `moonbit/moon.mod`. Verify with tests for a mismatch, a wrong prefix and `extension/elm/v0.4.2`.
- [ ] 6.2 Add the descriptor writer (`moonbit/tooling/release.ts`). It gets `claims` from describe on the built module, and writes `release.json` and the `.sha256` files (design REL-1). Verify with tests the single `wasm` artifact with no `platform`, the claims equal to describe, and the `.sha256` format.
- [ ] 6.3 Add the `release:moonbit-elm-extension` task and `.github/workflows/moonbit-elm-extension-release.yml` (design REL-2), with `actions/attest@v4` on `dist/artifacts/*`. Verify that `actionlint` reports nothing, and that a local dry run with a test tag writes the three files and passes `sha256sum --check`.
- [ ] 6.4 Verify that the JavaScript release workflow's tag filter does not match `extension/elm-moonbit/v*`, and that the new workflow's filter does not match `extension/elm/v*`. Check both with `git check-ref-format` names against both globs in a test.
- [ ] 6.5 Set `moonbit/moon.mod` to `0.1.0-preview.1`. Document the release steps in `DEVELOPING.md` next to the JavaScript release steps. Verify that describe reports `0.1.0-preview.1`.
- [ ] 6.6 Open pull request 3 to `vnext`, verify that CI passes, and ask Damian to review. After the merge, Damian decides when to tag `extension/elm-moonbit/v0.1.0-preview.1`. Then verify the release with `gh attestation verify` and `sha256sum --check`.

## Workflow follow-up

- Archive this change after the three pull requests are merged and the preview release is verified.
- Ask Damian before any change in finos/morphir-moonbit:
  - publish the three modules (already requested);
  - add the freeze note;
  - remove the code and the built-in registration (`morphir-ukvn.5.64.34.7`).
- Ask Damian before any change in finos/morphir: add the release to the `finos` extension index.
