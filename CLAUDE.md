# CLAUDE.md - Morphir-Elm

See [AGENTS.md](AGENTS.md) for AI agent instructions including:

- **Git commit guidelines** (no Co-Authored-By - EasyCLA requirement)
- Tech stack overview (mise, Bun, Elm, TypeScript)
- Functional programming principles
- Functional domain modeling practices
- Code style guidelines

## Quick Reference

```bash
# Build
mise run build          # All components
mise run build:cli      # CLI v1 only
mise run build:cli2     # CLI v2 only

# Test
mise run test           # All tests
mise run test:unit      # Elm unit tests

# Setup
mise run setup          # Install dependencies
```

See [DEVELOPING.md](DEVELOPING.md) for full documentation.
