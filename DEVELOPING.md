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

### Releasing the Elm extension

The Elm extension, `morphir-elm`, is built from `moonbit/` as one portable WebAssembly module (see
[moonbit/README.md](moonbit/README.md)). It has its own version, in `moonbit/moon.mod`, and its own tags,
`extension/elm/v<version>`. Versions must be greater than `0.4.1`, the last JavaScript release on those tags.

1. Set `version` in `moonbit/moon.mod`, and `VERSION` in `moonbit/mep/claims.mbt` to the same value, in a pull
   request to `vnext`. A test fails when they differ. Run `MISE_ENV=moonbit mise run moonbit:check` and commit the
   updated `moonbit/mep/pkg.generated.mbti`, which records `VERSION`.
2. After the merge, tag that commit on `vnext` and push the tag:

   ```sh
   git tag -a extension/elm/v0.5.0-preview.1 -m "Morphir Elm extension v0.5.0-preview.1"
   git push origin extension/elm/v0.5.0-preview.1
   ```

The `Elm extension release` workflow refuses a tag that:

- is not on `vnext`;
- already has a GitHub release;
- has a version that differs from `moon.mod`;
- has a version that is not greater than `0.4.1`.

It tests the module's sources. It runs `mise run release:elm-extension -- <tag>`, which packages the module and
writes `dist/elm-extension-release/`:

- `morphir-elm-<version>.wasm`;
- its `.sha256` file;
- `morphir-elm-<version>.release.json`, a version-2 bundle descriptor with one `wasm` artifact and no `platform`,
  whose claims come from the module's own `describe` answer.

It then tests the packaged module. On Linux, macOS and Windows it checks that the module's bytes and its answers to
a fixed set of sessions are the same. It attests the module with GitHub artifact attestations, and publishes a GitHub
release that is not marked as latest. A version with a `-` part is published as a prerelease.

To publish the bundle to an extension repository, put the three files in one directory and rename the descriptor to
`release.json`. Check the attestation with:

```sh
gh attestation verify morphir-elm-<version>.wasm --repo finos/morphir-elm
```

Run the task locally to inspect the files:

```sh
MISE_ENV=moonbit mise run release:elm-extension -- extension/elm/v0.5.0-preview.1
```

### The Elm classic extension

The Elm classic extension, `morphir-elm-classic`, is the JavaScript Elm frontend in `cli2/mep`, released as an
MEP process extension.

**BREAKING (from `0.5.0`):** it was named `morphir-elm` and released on `extension/elm/v*` tags until `0.4.1`.
That id and those tags now belong to the Elm extension built from `moonbit/`. The releases
`extension/elm/v0.1.0` to `v0.4.1` are unchanged, so existing pins keep working. To take newer classic releases,
change the extension id to `morphir-elm-classic`, the tag prefix to `extension/elm-classic/`, and the file and
executable names to `morphir-elm-classic-extension`.

`mise run build:elm-classic-extension` creates a host-native Elm classic frontend for
local development. The Elm classic extension pull-request workflow builds and validates
CI artifacts for Linux AMD64, macOS ARM64, and Windows ARM64. The
platform-neutral npm package does not include the native executable.

The extension answers `morphir.extension.describe` with its capability claim set.
Send `{ "protocolVersions": ["0.1"] }` before initialization or during a session,
before shutdown. Description has no side effects and does not initialize a
session; a probe can send `describe` followed by the `morphir.exit` notification.
An incompatible version offer receives `-32011`, as for `morphir.initialize`.

To end a session, send `morphir.shutdown` and wait for its response, then send
the `morphir.exit` notification. Shutdown stops work and rejects further requests
with `-32014`; the process stays alive until exit or clean standard-input EOF.

### Releasing the Elm classic extension

The extension has its own version and its own release tag. It does not follow
the morphir-elm package version.

1. Set `version` in `cli2/mep/extension.json` in a pull request to `vnext`. The
   extension reports this version to the `morphir` CLI.
2. After the merge, tag that commit on `vnext` and push the tag:

   ```sh
   git tag -a extension/elm-classic/v0.5.0 -m "Morphir Elm classic extension v0.5.0"
   git push origin extension/elm-classic/v0.5.0
   ```

The `Elm classic extension release` workflow refuses a tag that is not on `vnext` or
whose version differs from `extension.json`. It runs
`mise run release:elm-classic-extension -- <tag>`, which cross-compiles the executable
for the six platforms the `morphir` CLI is released for, and writes one archive
and one `.sha256` file per platform plus
`morphir-elm-classic-extension-<version>.release.json`. The workflow then runs the
extension suite against both the archive executable and the raw bundle executable
on Linux, macOS and Windows,
attests the archives and the raw executables with GitHub artifact attestations, and publishes a GitHub release
that is not marked as latest. A version with a
`-` part, such as `0.2.0-rc.1`, is published as a prerelease.

The task also writes `dist/elm-classic-extension-release/bundle/`, containing a version-2
`release.json`, six raw executables named
`morphir-elm-classic-extension-<version>-<platform>` with `.exe` on Windows, and a
`.sha256` file for each executable. Digests cover the raw bytes. Each artifact's
claims come from the same module that supplies `describe` and session metadata.
The version-1 archives and descriptor remain available for existing consumers.

On GitHub, the bundle descriptor is named
`morphir-elm-classic-extension-<version>.bundle.release.json`. Download it with all six
raw executables and their checksum files into one directory, then rename it to
`release.json` before running `morphir extension repository publish --bundle <dir>`.
Keep archives out of that directory. Bundle publication requires a Morphir CLI
that reads `2.0.0-draft.2`, the release after `0.4.0-beta.6`.

Run the task locally to inspect the files in `dist/elm-classic-extension-release/`:

```sh
mise run release:elm-classic-extension -- extension/elm-classic/v0.5.0
```

This creates:

- `dist/morphir/morphir` - Main CLI executable
- `dist/morphir-server/morphir-server` - Development server executable

These executables don't require Node.js on the target system.

### The MoonBit Elm module

`moonbit/` holds the MoonBit module `finos/morphir-elm`: an Elm frontend and an Elm backend, released as the Elm
extension, `morphir-elm`, for the MoonBit Morphir CLI. See [moonbit/README.md](moonbit/README.md).

Its tools come from `mise.moonbit.toml`, so run its tasks with `MISE_ENV=moonbit`. Other tasks do not need it.
Linux and macOS on Apple silicon are supported.

```sh
MISE_ENV=moonbit mise install
MISE_ENV=moonbit mise run moonbit:check
MISE_ENV=moonbit mise run moonbit:test
MISE_ENV=moonbit mise run moonbit:test:elm
MISE_ENV=moonbit mise run moonbit:parity-refresh
MISE_ENV=moonbit mise run moonbit:package   # the Wasm extension module and its SHA-256
bun test moonbit/tests                      # the packaged module through the morphir-bytes-v1 ABI
```

`bun test moonbit/tests` needs the packaged module and the Elm tools in `moonbit/scripts`
(`bun install --frozen-lockfile --cwd moonbit/scripts`).

`moonbit:deps`, which the other tasks run first, checks out the finos/morphir-moonbit modules that are not on
mooncakes yet, from the commit pinned in `moonbit/deps.toml`. The `Elm extension` workflow runs these tasks on pull
requests to `vnext` that change `moonbit/`.

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
