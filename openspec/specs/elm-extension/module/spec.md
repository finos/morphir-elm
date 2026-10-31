# elm-extension/module Specification

## Purpose

Keeps the MoonBit Elm module (`finos/morphir-elm` in `moonbit/`) buildable and tested in this repository, with checks
that its IR matches `morphir-elm` and its generated Elm compiles.

## Requirements

### Requirement: MoonBit tasks use a pinned toolchain

The MoonBit tasks SHALL run with the MoonBit version that the repository pins in its MoonBit mise environment. A
MoonBit task started without that environment SHALL stop with a message that names the environment to set.

#### Scenario: Pinned version

- **WHEN** a contributor installs the MoonBit environment and asks for the MoonBit version
- **THEN** the version is `0.10.18+6c83a7f62`

#### Scenario: Environment not set

- **WHEN** a contributor runs a MoonBit task with no `moon` executable available
- **THEN** the task fails before it does any work
- **AND** the message contains `MISE_ENV=moonbit`

### Requirement: Unpublished dependencies come from one pinned commit

Modules that the Elm module needs and that are not on mooncakes SHALL come from one finos/morphir-moonbit commit
recorded in the repository. The dependency task SHALL refuse a pin that is not a full 40-character commit, has no
paths, or names a path outside `pkgs/`. It SHALL fetch again when the local copy is missing, at another commit, or
has other paths.

#### Scenario: Invalid pin

- **WHEN** the recorded commit is shorter than 40 hexadecimal characters
- **THEN** the dependency task fails before it contacts the network, and the message names the commit field

#### Scenario: Current copy

- **WHEN** the local copy is at the pinned commit with the pinned paths
- **THEN** the dependency task fetches nothing

#### Scenario: Stale copy

- **WHEN** the local copy is at another commit, or has fewer paths than the pin
- **THEN** the dependency task replaces it with the pinned commit and paths

### Requirement: The module tests pass on every MoonBit target

A pull request to `vnext` that changes the MoonBit module, its tasks or its toolchain SHALL run the module's tests
on the `wasm`, `wasm-gc`, `js` and `native` targets, and SHALL fail when any test fails on any of them.

#### Scenario: A failing test on one target

- **WHEN** a pull request makes a test fail on the `js` target only
- **THEN** the pull-request check fails

### Requirement: Committed interfaces and formatting stay current

The pull-request check SHALL fail when the committed package interfaces (`pkg.generated.mbti`) or the source
formatting differ from what the pinned toolchain produces.

#### Scenario: Stale interface

- **WHEN** a pull request changes a public function and does not update its `pkg.generated.mbti`
- **THEN** the pull-request check fails and shows the difference

### Requirement: Parity data matches the pinned morphir-elm

The committed expected IR and parity data for the conformance projects SHALL equal the output of `morphir-elm`
2.100.0 on those projects. The pull-request check SHALL regenerate them and fail on any difference.

#### Scenario: Unchanged projects

- **WHEN** the parity data is regenerated with no change to the conformance projects
- **THEN** no file under `moonbit/conformance` changes

#### Scenario: Changed project without regenerated data

- **WHEN** a pull request changes an Elm source file in a conformance project and does not regenerate the data
- **THEN** the pull-request check fails

### Requirement: Generated Elm compiles

The Elm that the backend generates for the acceptance projects SHALL compile with `elm make` 0.19.1. The
pull-request check SHALL fail when any generated project does not compile.

#### Scenario: Generated projects compile

- **WHEN** the `elm make` check runs
- **THEN** it builds at least seven generated projects and every one compiles

### Requirement: The Elm tools use their own lockfile

The Elm compiler and `morphir-elm` that the checks use SHALL be installed from the module's own Bun lockfile, not
from the repository's root workspace.

#### Scenario: Frozen install

- **WHEN** the Elm tools are installed with a frozen lockfile
- **THEN** `elm --version` prints `0.19.1`, and neither the root lockfile nor the module lockfile changes
