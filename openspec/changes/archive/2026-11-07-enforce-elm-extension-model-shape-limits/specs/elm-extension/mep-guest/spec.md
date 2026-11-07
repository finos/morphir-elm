# Spec Delta

## ADDED Requirements

### Requirement: Model payloads stay within the agreed depth and node limits

The guest SHALL refuse a model payload whose JSON has more levels than the agreed `maxDepth` or more values than
the agreed `maxNodes`, counted as the MoonBit host counts them: the root value is level 1, and each value except an
object key is one node. A payload at exactly the agreed limits SHALL be accepted. (bead: morphir-ukvn.1.19)

#### Scenario: Compile at the limits

- **WHEN** a host agrees `maxDepth` and `maxNodes` equal to the levels and values of the IR that a project compiles to
- **THEN** `compileModel` answers `success: true` with that model

#### Scenario: Compile over a limit

- **WHEN** the agreed `maxDepth` is one less than the levels of the compiled IR, or `maxNodes` is one less than its values
- **THEN** `compileModel` answers `success: false` with one `elm.model_limit` diagnostic and no model

#### Scenario: Generate over a limit

- **WHEN** a host sends `generateModel` a model whose IR has more levels than the agreed `maxDepth`, or more values than the agreed `maxNodes`
- **THEN** the answer is JSON-RPC error `-32602` with the message `Model admission refused: model_limit`

#### Scenario: A very deep payload

- **WHEN** a model payload is nested far deeper than the agreed `maxDepth`
- **THEN** the guest refuses it as over the limit and does not fail
