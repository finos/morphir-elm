# elm-classic-extension/mep Specification

## Purpose

Defines the MEP versions the Elm classic extension speaks, how it negotiates them with a host, and how it answers the
MEP 0.2 model operation `morphir.frontend.compileModel`.

## Requirements

### Requirement: Describe offers MEP 0.2.0-draft.1 and 0.1

`morphir.extension.describe` SHALL return claim set `0.1.0-draft.2` with `protocolVersions` `["0.2.0-draft.1", "0.1"]`
and a model transport with the tuple `morphir.frontend.compileModel` / `morphir-ir` / `morphir-json` /
`0.1.0-draft.1` / `4.0.0`.

#### Scenario: Describe from a 0.2 host

- **WHEN** a host sends describe offering `["0.2.0-draft.1", "0.1"]`
- **THEN** the claims list both protocol versions and the compileModel tuple

#### Scenario: Describe from a 0.1 host

- **WHEN** a host sends describe offering `["0.1"]`
- **THEN** the extension answers with its claims and no error

### Requirement: Initialize selects 0.2 only with a model transport offer

`morphir.initialize` SHALL select `0.2.0-draft.1` when the host offers it and sends a model transport offer, and SHALL
select `0.1` when the host offers only `0.1`. The 0.2 answer SHALL list the offered tuples that the extension supports
and the smaller value of each limit.

#### Scenario: 0.1-only host

- **WHEN** a host initializes offering `["0.1"]` and no model transport
- **THEN** the answer has `protocolVersion` `0.1`, and the legacy `morphir.frontend.compile` works

#### Scenario: 0.2 host

- **WHEN** a host initializes offering `["0.2.0-draft.1"]` with a model transport offer that holds the compileModel tuple
- **THEN** the answer has `protocolVersion` `0.2.0-draft.1` and that tuple in `capabilities.modelTransport.tuples`

#### Scenario: 0.2 without a model transport offer

- **WHEN** a host initializes offering only `["0.2.0-draft.1"]` and no model transport
- **THEN** the answer is the JSON-RPC error `-32011`

### Requirement: compileModel returns the IR as a v4 model envelope

In a 0.2 session, `morphir.frontend.compileModel` SHALL compile the one Elm document of the request and return a
`morphir-json` model envelope, envelope `0.1.0-draft.1`, IR `4.0.0`, whose payload is the compiled IR converted to v4,
in base64, with its decoded length and SHA-256.

#### Scenario: Golden output

- **WHEN** a 0.2 host compiles the Example.elm fixture with package `local/example`
- **THEN** the decoded payload equals the committed golden v4 IR, and its length and SHA-256 match the envelope

#### Scenario: Absent exposedModules

- **WHEN** the request's package has only a name
- **THEN** every module of the result is public

### Requirement: compileModel refuses what it cannot answer

`morphir.frontend.compileModel` SHALL refuse with JSON-RPC `-32602` an `output` tuple that was not agreed, another
envelope version or IR version, and a missing or malformed `contextDigest`. Before `morphir.initialize` it SHALL answer
`-32014`, and in a 0.1 session `-32013`.

#### Scenario: Unagreed tuple

- **WHEN** a 0.2 host sends compileModel with `output` codec `ion-binary`
- **THEN** the answer is `-32602`

#### Scenario: Wrong envelope

- **WHEN** a 0.2 host sends compileModel with `output.envelopeVersion` `0.2.0`
- **THEN** the answer is `-32602`

#### Scenario: 0.1 session

- **WHEN** a host that initialized on `0.1` sends compileModel
- **THEN** the answer is `-32013`

### Requirement: Source problems are diagnostics

When the Elm source does not compile, or the request names package dependencies, `compileModel` SHALL return
`success: false` with the diagnostics and no `model`.

#### Scenario: Invalid Elm

- **WHEN** a 0.2 host compiles the Invalid.elm fixture
- **THEN** the answer has `success: false`, an `elm.parser` diagnostic, and no `model`

#### Scenario: Dependencies

- **WHEN** a 0.2 host sends compileModel with one package dependency
- **THEN** the answer has `success: false` and an `elm.unsupported_dependencies` diagnostic, as the Elm extension answers
