# Developing Morphir-Elm

This guide covers setting up a development environment and building the project.

## Prerequisites

- **Node.js 24+ (Active LTS)** - JavaScript runtime
- **mise** - Polyglot tool version manager ([install guide](https://mise.jdx.dev/getting-started.html))
- **Bun** - Installed by mise; runs the build tasks
- **Elm** - Installed via elm-tooling (automated by `mise run setup`)

The build is verified in CI on `ubuntu-latest` and `windows-latest`. macOS works too — see [.github/workflows/nodejs.yml](.github/workflows/nodejs.yml).

## Quick Start

```bash
# Install mise (if not already installed)
curl https://mise.run | sh

# Trust the project configuration
mise trust

# Install tools (node, bun) and all dependencies (npm ci, elm-tooling, etc.)
mise run default
```

## Build System

This project uses [mise](https://mise.jdx.dev/) with [Bun](https://bun.sh/) for task execution. Tasks are defined as TypeScript files in `.mise/tasks/`.

### Available Tasks

| Task | Description |
|------|-------------|
| `mise run clean` | Remove build artifacts |
| `mise run build` | Build all components |
| `mise run test` | Run all tests |
| `mise run setup` | Setup dependencies (elm-tooling, morphir-jvm) |
| `mise run default` | Full pipeline: clean → check → setup → build |

### Build Tasks

| Task | Description |
|------|-------------|
| `mise run build:check-elm-docs` | Verify Elm documentation compiles |
| `mise run build:cli` | Build CLI (Elm → JavaScript) |
| `mise run build:cli2` | Build CLI2 (TypeScript + Elm in parallel) |
| `mise run build:treeview` | Build treeview webpack bundle |
| `mise run build:morphir-ts` | Build Morphir TypeScript library |
| `mise run build:dev-server` | Build development server Elm components |
| `mise run build:components` | Build insight web components |
| `mise run build:try-morphir` | Build Try Morphir web app |
| `mise run build:bundle` | Create standalone executables (via Bun) |

### Test Tasks

| Task | Description |
|------|-------------|
| `mise run test:unit` | Run Elm unit tests |
| `mise run test:integration` | Run integration test suite |
| `mise run test:integration-spark` | Run Spark integration tests (requires mill) |
| `mise run test:morphir-ir` | Test Morphir IR TypeScript codecs |
| `mise run test:check-package-lock` | Verify no prohibited dependencies |

### Setup Tasks

| Task | Description |
|------|-------------|
| `mise run setup:elm-tooling` | Install Elm tooling binaries |
| `mise run setup:morphir-jvm` | Clone and setup Morphir JVM SDK assets |

## NPM Scripts

For convenience, common tasks are also available via npm:

```bash
npm run build          # Full pipeline: mise run default && mise run test
npm run test           # Run test suite (delegates to mise run test)
npm run clean          # Clean build artifacts
npm run setup          # Run setup tasks
npm run build:cli      # Build CLI only
npm run build:cli2     # Build CLI2 only
```

`mise run setup` handles all npm and tooling setup, including running the
`prepare` hook which installs `elm`, `elm-test`, `elm-format`, and `elm-json` into
`node_modules/.bin/`. `mise.toml` prepends `./node_modules/.bin` to
PATH so mise tasks resolve those binaries.

### Test Runner

Integration and unit tests use [`bun:test`](https://bun.sh/docs/cli/test).
Jest was removed in favor of bun's native TypeScript + ESM support.
Add `import { describe, it, test, expect } from 'bun:test'` to any new
test file.

## Project Structure

```
.mise/
├── tasks/
│   ├── _lib.ts              # Shared utilities (not a task)
│   ├── clean.ts             # mise run clean
│   ├── default.ts           # mise run default
│   ├── build.ts             # mise run build
│   ├── test.ts              # mise run test
│   ├── setup.ts             # mise run setup
│   ├── build/               # Build subtasks
│   │   ├── cli.ts
│   │   ├── cli2.ts
│   │   └── ...
│   ├── test/                # Test subtasks
│   │   ├── unit.ts
│   │   ├── integration.ts
│   │   └── ...
│   └── setup/               # Setup subtasks
│       ├── elm-tooling.ts
│       └── morphir-jvm.ts
cli/                         # CLI v1 (Elm + JavaScript)
cli2/                        # CLI v2 (TypeScript + Elm)
morphir-ts/                  # TypeScript SDK
src/                         # Elm source code
tests-integration/           # Integration tests
```

## Development Workflow

### Making Changes

1. Make your changes to the source code
2. Run the relevant build task: `mise run build:cli` or `mise run build:cli2`
3. Run tests: `mise run test:unit`
4. Run integration tests: `mise run test:integration`

### Live Development

For live-reloading during development:

```bash
# Insight server with live reload
npm run insight-server-live

# Development server with live reload
npm run dev-server-live

# Try Morphir with live reload
npm run try-morphir-live
```

### Creating Standalone Executables

The `build:bundle` task creates standalone executables using Bun's compile feature:

```bash
mise run build:bundle
```

This creates:
- `dist/morphir/morphir` - Main CLI executable
- `dist/morphir-server/morphir-server` - Development server executable

These executables don't require Node.js on the target system.

## Troubleshooting

### mise not finding tasks

Ensure the project is trusted:
```bash
mise trust
```

### Elm compilation errors

Make sure Elm tooling is installed:
```bash
mise run setup:elm-tooling
```

### Missing dependencies

```bash
mise run setup
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
