# AI Agent Instructions for Morphir-Elm

This document provides guidelines for AI agents (Claude, Copilot, Cursor, etc.) working on the Morphir-Elm codebase.

## CRITICAL: Git Commit Attribution

**DO NOT add AI agents as co-authors to git commits.**

This project is governed by the FINOS [EasyCLA](https://easycla.lfx.linuxfoundation.org/). Adding AI agents as co-authors (e.g., `Co-Authored-By: Claude <noreply@anthropic.com>`) will cause CLA verification failures and block contributions.

When committing:
- Commits should only be attributed to human contributors who have signed the CLA
- Never include `Co-Authored-By` lines for AI assistants
- The human developer is responsible for reviewing and taking ownership of all changes

## Project Overview

Morphir is a multi-language system for capturing business logic in a technology-agnostic manner. This repository (`morphir-elm`) provides:

- **Elm frontend**: Parses Elm source code into Morphir IR (Intermediate Representation)
- **Code generators**: Transpile Morphir IR to Scala, TypeScript, Spark, and other targets
- **CLI tools**: `morphir-elm` (v1) and `morphir` (v2) command-line interfaces
- **TypeScript SDK**: Type-safe API for working with Morphir IR
- **Development tools**: Web-based visualization and debugging

## Tech Stack

### Build System
- **mise** - Polyglot tool version manager for Node.js and Bun
- **Bun** - Fast JavaScript runtime used for task execution
- Tasks are TypeScript files in `.mise/tasks/`

### Languages
- **Elm** - Primary language for business logic and frontend tooling
- **TypeScript** - CLI tooling (cli2/) and SDK (morphir-ts/)
- **JavaScript** - CLI v1 and generated outputs

### Key Commands
```bash
mise run build          # Build all components
mise run test           # Run all tests
mise run build:cli      # Build CLI v1
mise run build:cli2     # Build CLI v2
```

See [DEVELOPING.md](DEVELOPING.md) for full build system documentation.

## Functional Programming Principles

Morphir is built on functional programming principles. When contributing code, adhere to these practices:

### Immutability
- Prefer immutable data structures
- Avoid mutating state; create new values instead
- Use `const` over `let` in TypeScript; avoid `var` entirely

### Pure Functions
- Functions should be deterministic (same input → same output)
- Avoid side effects where possible
- Isolate side effects at the edges of the system

### Type Safety
- Leverage Elm's type system fully - if it compiles, it should work
- Use TypeScript's strict mode; avoid `any` types
- Model invalid states as unrepresentable through types

### Composition
- Build complex behavior from simple, composable functions
- Prefer small, focused functions over large monolithic ones
- Use pipelines and function composition

## Functional Domain Modeling

Morphir's core purpose is **functional domain modeling** - capturing business domains in a pure, technology-agnostic way. When working on Morphir:

### Domain-Driven Design
- Model the business domain, not the technical implementation
- Use ubiquitous language from the business domain
- Types should reflect real business concepts

### Algebraic Data Types
- Use sum types (union types) to model choices: `type Result a = Ok a | Err String`
- Use product types (records) to model combinations of data
- Make illegal states unrepresentable

### The Morphir IR
- The IR is the central artifact - a typed AST of business logic
- It captures **what** the logic does, not **how** it's implemented
- Generators translate IR to target languages while preserving semantics

### SDK Philosophy
- `Morphir.SDK` provides pure functional building blocks
- Functions should work identically across all target platforms
- Avoid platform-specific behavior in SDK modules

## Code Style

### Elm
- Follow [elm-format](https://github.com/avh4/elm-format) conventions (enforced automatically)
- Use descriptive type aliases for domain concepts
- Prefer pattern matching over conditionals
- Document public APIs with doc comments

### TypeScript
- Use strict TypeScript configuration
- Prefer functional patterns: `map`, `filter`, `reduce` over loops
- Use `readonly` for immutable properties
- Model errors as values (Result/Either types) rather than exceptions

### General
- Keep functions small and focused
- Name things based on what they represent, not how they work
- Write self-documenting code; add comments only for non-obvious "why"

## Testing

- **Elm tests**: Run with `mise run test:unit` (uses elm-test)
- **Integration tests**: Run with `mise run test:integration`
- **TypeScript tests**: Jest for unit tests, Mocha for integration

When adding features:
- Add Elm tests for new SDK functions
- Add integration tests for new CLI commands or generators
- Test edge cases and error conditions

## Architecture Decisions

When making architectural decisions:

1. **Preserve IR semantics** - Changes to IR structure affect all generators
2. **Maintain backward compatibility** - Existing morphir.json files should continue to work
3. **Keep generators consistent** - Similar business logic should produce similar output across targets
4. **Favor correctness over performance** - Morphir prioritizes semantic accuracy

## Resources

- [Morphir Documentation](https://github.com/finos/morphir)
- [Elm Guide](https://guide.elm-lang.org/)
- [Morphir SDK Reference](https://package.elm-lang.org/packages/finos/morphir-elm/latest/)
- [DEVELOPING.md](DEVELOPING.md) - Build system and development workflow
