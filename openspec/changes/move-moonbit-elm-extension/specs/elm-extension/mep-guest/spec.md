# Spec Delta

## Purpose

Defines the portable Wasm extension that serves the MoonBit Elm frontend and backend to a Morphir host over MEP, in
native hosts and in the browser.

## ADDED Requirements

### Requirement: The guest uses only the morphir-bytes-v1 ABI

The guest SHALL be one core WebAssembly module whose only imports are `input_len`, `input_byte` and `output_byte`
in module `morphir_bytes_v1`, and whose exports include `handle`. It SHALL have one memory with a maximum of at most
4096 pages, and SHALL import nothing from WASI or any other module.

#### Scenario: Import check

- **WHEN** the released module's imports are listed
- **THEN** the list is exactly `morphir_bytes_v1.input_len`, `morphir_bytes_v1.input_byte` and `morphir_bytes_v1.output_byte`

#### Scenario: Memory bound

- **WHEN** the released module's memory section is read
- **THEN** it declares one memory whose maximum is 4096 pages or less

### Requirement: Describe reports the extension's claims

The guest SHALL answer `morphir.extension.describe` with claim set `0.1.0-draft.2`, extension id
`morphir-elm`, the version of its module, types `frontend` and `backend`, and a frontend claim for language
`elm` with file extension `.elm` and `multiDocument` set to true.

#### Scenario: Describe

- **WHEN** a host sends `morphir.extension.describe` offering protocol `0.2.0-draft.1`
- **THEN** the answer has `claimsVersion` `0.1.0-draft.2`, `extension.id` `morphir-elm` and `extension.version` equal to the module version
- **AND** its frontend claim lists language `elm` with `.elm` and `multiDocument: true`

### Requirement: The guest follows the MEP session lifecycle

The guest SHALL accept `morphir.initialize`, the `morphir.initialized` notification, `morphir.shutdown` and the
`morphir.exit` notification in that order, keep one session for the life of the instance, and answer a request for
an unknown method with a JSON-RPC method-not-found error.

#### Scenario: Full session

- **WHEN** a host sends describe, initialize, initialized, one compile request, shutdown and exit
- **THEN** each request gets one response, each notification gets none, and `handle` returns 0 after exit

#### Scenario: Unknown method

- **WHEN** a host sends a request for `morphir.unknown`
- **THEN** the response is a JSON-RPC error with code -32601, and the session stays usable

### Requirement: Compile accepts a whole Elm package

`morphir.frontend.compileModel` SHALL accept every Elm module of one package in one request, with the package name
and its exposed modules. It SHALL return the same IR that the module's frontend produces for those sources.

#### Scenario: Conformance project

- **WHEN** a host sends all modules of a conformance project that compiles cleanly
- **THEN** the returned model equals the module frontend's IR for that project

#### Scenario: One module

- **WHEN** a host sends a package with one module
- **THEN** the guest compiles it like any other package

### Requirement: Source problems are diagnostics, not failures

When Elm sources do not compile, `morphir.frontend.compileModel` SHALL return a successful response that holds the
problems as diagnostics with their codes, document URIs and source locations, and no model. A JSON-RPC error SHALL
be used only for a malformed request.

#### Scenario: Unsupported construct

- **WHEN** a host sends a module that declares a port
- **THEN** the response holds a diagnostic with code `elm.unsupported` and the port's location, and no model

### Requirement: Package dependencies are refused

The guest SHALL refuse a compile request that carries package dependencies with a diagnostic that says dependencies
are not supported, until dependency support is added.

#### Scenario: Request with a dependency

- **WHEN** a compile request names a dependency on another Morphir package
- **THEN** the response holds the unsupported-dependencies diagnostic and no model

### Requirement: Generate writes compilable Elm

`morphir.backend.generateModel` SHALL turn a model into Elm source files that `elm make` 0.19.1 compiles, and SHALL
report a model construct it cannot write as a diagnostic with its code.

#### Scenario: Generate from compiled IR

- **WHEN** a host compiles an acceptance project and sends the result to `morphir.backend.generateModel`
- **THEN** the returned files compile with `elm make`

### Requirement: Answers are deterministic

For the same sequence of requests, the guest SHALL return the same response bytes in every host that implements the
ABI.

#### Scenario: Two hosts

- **WHEN** the same session runs on Linux, macOS and Windows
- **THEN** each response is byte for byte the same on all three
