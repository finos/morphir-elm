# Tasks

## 1. Module archive content and rules (morphir-oa72.1)

- [x] 1.1 Write `moonbit/tooling/mooncakes.test.ts` first for `archiveName`, `checkArchiveEntries`, `registryState`, `isFinosAccount`, `credentialsJson`, `redact` and `consumerFiles` (design REL-3); verify that `bun test moonbit/tooling` fails because the module does not exist
- [x] 1.2 Implement `moonbit/tooling/mooncakes.ts`; verify that `bun test moonbit/tooling` passes
- [x] 1.3 Add `moonbit/LICENSE` (the repository's Apache-2.0 text) and `moonbit/.moonignore` (`/tooling/`, `/tests/`, `/scripts/`, `/deps.toml`, `/moon.work`); verify that `moon package --list` in a git snapshot of `moonbit/` lists `LICENSE` and none of the ignored paths, and that `moonbit:check` passes

## 2. Release task: package, publish, verify (morphir-oa72.2)

- [ ] 2.1 Add `.mise/tasks/release/elm-extension-mooncakes.ts` with `package <tag> <commit>` (design REL-2, REL-4); verify that `package extension/elm/v0.5.0-preview.2 $(git rev-parse HEAD)` writes the zip and its `.sha256` to `dist/elm-extension-mooncakes/` and the archive passes its tests on the four targets, and that a wrong tag or a commit other than `HEAD` fails before packaging
- [ ] 2.2 Add `publish <version>` (design REL-5, REL-6); verify without a token that `publish 0.5.0-preview.2` stops on the missing token, and with a placeholder token that `publish` of the existing `0.1.0` archive name stops at the registry check before any account check or upload
- [ ] 2.3 Add `verify <version>` (design REL-7); verify that `verify 0.1.0` resolves the frozen `finos/morphir-elm@0.1.0` from mooncakes and then fails because that version has no `mep` package, which proves the resolution path and the version check
- [ ] 2.4 Document the task in `moonbit/README.md` and `DEVELOPING.md`; verify that the documented commands are the ones the task accepts (`--help` output)

## 3. Release workflow job and documentation (morphir-oa72.3)

- [ ] 3.1 Add job `mooncakes` to `.github/workflows/elm-extension-release.yml` (needs `build` and `publish`; `MOONCAKES_TOKEN` in the publish step only; artifact upload also on failure); verify with `actionlint` (or `yamllint`) and by reading that no other step references the secret
- [ ] 3.2 Update the workflow header comment and the release section of `moonbit/README.md`; verify that the text names the job, the tag and the secret
- [ ] 3.3 Run the PR gates: `bun test moonbit/tooling`, `moonbit:check`, `moonbit:test`, and `openspec validate publish-elm-extension-to-mooncakes --strict`; verify that each passes

## Workflow follow-up

- Bump the version to `0.5.0-preview.3` in a separate PR (`moonbit/moon.mod`, `moonbit/mep` `VERSION`).
- Push tag `extension/elm/v0.5.0-preview.3` only with the maintainer's explicit approval; report before the tag.
- Archive the change after the first publication is verified.
