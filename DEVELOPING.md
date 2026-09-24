# Developing Morphir-Elm

This guide covers setting up a development environment and building the project.

## Prerequisites

- **Node.js 20+** - JavaScript runtime
- **mise** - Polyglot tool version manager ([install guide](https://mise.jdx.dev/getting-started.html))
- **Elm** - Installed by mise from `mise.toml`

## Quick Start

```bash
# Install mise (if not already installed)
curl https://mise.run | sh

# Trust the project configuration
mise trust

# Install pinned tools and dependencies
mise install
mise exec -- bun ci

# Run the full build pipeline
mise run default
```

## Build System

This project uses [mise](https://mise.jdx.dev/) with [Bun](https://bun.sh/) for task execution. Tasks are defined as TypeScript files in `.mise/tasks/`.

### Available Tasks

| Task               | Description                                  |
| ------------------ | -------------------------------------------- |
| `mise run clean`   | Remove build artifacts                       |
| `mise run build`   | Build all components                         |
| `mise run test`    | Run all tests                                |
| `mise run setup`   | Set up Morphir JVM SDK assets                |
| `mise run default` | Full pipeline: clean → check → setup → build |

### Build Tasks

| Task                            | Description                               |
| ------------------------------- | ----------------------------------------- |
| `mise run build:check-elm-docs` | Verify Elm documentation compiles         |
| `mise run build:cli`            | Build CLI (Elm → JavaScript)              |
| `mise run build:cli2`           | Build CLI2 (TypeScript + Elm in parallel) |
| `mise run build:treeview`       | Build treeview webpack bundle             |
| `mise run build:morphir-ts`     | Build Morphir TypeScript library          |
| `mise run build:dev-server`     | Build development server Elm components   |
| `mise run build:components`     | Build insight web components              |
| `mise run build:try-morphir`    | Build Try Morphir web app                 |
| `mise run build:bundle`         | Create standalone executables (via Bun)   |

### Test Tasks

| Task                               | Description                                 |
| ---------------------------------- | ------------------------------------------- |
| `mise run test:unit`               | Run Elm unit tests                          |
| `mise run test:integration`        | Run integration test suite                  |
| `mise run test:integration-spark`  | Run Spark integration tests (requires mill) |
| `mise run test:morphir-ir`         | Test Morphir IR TypeScript codecs           |
| `mise run test:check-package-lock` | Verify no prohibited dependencies           |

### Setup Tasks

| Task                         | Description                            |
| ---------------------------- | -------------------------------------- |
| `mise run setup:morphir-jvm` | Clone and setup Morphir JVM SDK assets |

## NPM Scripts

For convenience, common tasks are also available via npm:

```bash
npm run build          # Full build + jest + tests
npm run test           # Run test suite
npm run clean          # Clean build artifacts
npm run setup          # Run setup tasks
npm run build:cli      # Build CLI only
npm run build:cli2     # Build CLI2 only
```

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
│       └── morphir-jvm.ts
packages/                    # Workspace packages
│   ├── cli/                 # CLI v1 (Elm + JavaScript)
│   ├── cli2/                # CLI v2 (TypeScript + Elm)
│   ├── morphir-ts/          # TypeScript SDK
│   ├── server/              # Development server
│   ├── cadl-frontend/       # CADL frontend
│   └── decoration-extension/# VS Code decoration extension
src/                         # Elm source code (shared root for Elm package)
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

`mise run build:mep-extension` creates a host-native Morphir Elm frontend for
local development. The MEP extension pull-request workflow builds and validates
CI artifacts for Linux AMD64, macOS ARM64, and Windows ARM64. The
platform-neutral npm package does not include the native executable.

The extension answers `morphir.extension.describe` with its capability claim set.
Send `{ "protocolVersions": ["0.1"] }` before initialization or during a session,
before shutdown. Description has no side effects and does not initialize a
session; a probe can send `describe` followed by the `morphir.exit` notification.
An incompatible version offer receives `-32011`, as for `morphir.initialize`.

### Releasing the MEP extension

The extension has its own version and its own release tag. It does not follow
the morphir-elm package version.

1. Set `version` in `cli2/mep/extension.json` in a pull request to `vnext`. The
   extension reports this version to the `morphir` CLI.
2. After the merge, tag that commit on `vnext` and push the tag:

   ```sh
   git tag -a extension/elm/v0.1.0 -m "Morphir Elm MEP extension v0.1.0"
   git push origin extension/elm/v0.1.0
   ```

The `MEP extension release` workflow refuses a tag that is not on `vnext` or
whose version differs from `extension.json`. It runs
`mise run release:mep-extension -- <tag>`, which cross-compiles the executable
for the six platforms the `morphir` CLI is released for, and writes one archive
and one `.sha256` file per platform plus
`morphir-elm-extension-<version>.release.json`. The workflow then runs the
extension suite against both the archive executable and the raw bundle executable
on Linux, macOS and Windows,
and publishes a GitHub release that is not marked as latest. A version with a
`-` part, such as `0.2.0-rc.1`, is published as a prerelease.

The task also writes `dist/mep-extension-release/bundle/`, containing a version-2
`release.json`, six raw executables named
`morphir-elm-extension-<version>-<platform>` with `.exe` on Windows, and a
`.sha256` file for each executable. Digests cover the raw bytes. Each artifact's
claims come from the same module that supplies `describe` and session metadata.
The version-1 archives and descriptor remain available for existing consumers.

On GitHub, the bundle descriptor is named
`morphir-elm-extension-<version>.bundle.release.json`. Download it with all six
raw executables and their checksum files into one directory, then rename it to
`release.json` before running `morphir extension repository publish --bundle <dir>`.
Keep archives out of that directory. Bundle publication requires a Morphir CLI
that reads `2.0.0-draft.2`, the release after `0.4.0-beta.6`.

Run the task locally to inspect the files in `dist/mep-extension-release/`:

```sh
mise run release:mep-extension -- extension/elm/v0.1.0
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

Make sure the pinned Elm tools are installed:

```bash
mise install
```

### Missing dependencies

```bash
mise exec -- bun ci
mise run setup
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
