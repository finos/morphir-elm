# CLI2 Modernization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Modernize `packages/cli2/` to use Bun-native conventions so `bun build --compile` produces a fully self-contained single-file binary.

**Architecture:** Replace all `createRequire(import.meta.url)` patterns with Bun-native CJS imports via a centralized Elm worker module. Replace the external-command entry point with the dynamic-import dispatcher. Embed redistributable template files as imports instead of copying from filesystem-relative paths.

**Tech Stack:** Bun, TypeScript, Elm (compiled to CJS), Commander

**Design doc:** `docs/plans/2026-02-25-cli2-modernization-design.md`

---

### Task 1: Create centralized Elm worker module

**Files:**
- Create: `packages/cli2/elm-worker.ts`

**Context:** Seven files independently load `Morphir.Elm.CLI.cjs` via `createRequire(import.meta.url)`. Inside a `bun build --compile` binary, `import.meta.url` points to `/$bunfs/root/...` and `createRequire` can't resolve relative paths from there. Bun can import CJS files natively with a regular `import` statement, which the bundler resolves at compile time.

**Step 1: Create the module**

```typescript
// packages/cli2/elm-worker.ts

/**
 * Centralized Elm worker module.
 *
 * Bun can import CommonJS modules natively — no createRequire needed.
 * This gives the bundler a static import it can resolve at compile time,
 * which is required for bun build --compile to work.
 */

// @ts-ignore — Elm-compiled CJS module, no type declarations
import ElmCLI from "./Morphir.Elm.CLI.cjs";

export const worker = ElmCLI.Elm.Morphir.Elm.CLI.init();
```

**Step 2: Verify it works in dev mode**

Run: `bun -e "import { worker } from './packages/cli2/elm-worker.ts'; console.log(typeof worker.ports)"`

Expected: `object`

If the `.cjs` file doesn't exist yet, build it first:
```bash
mise run build:cli2
```
Then re-run the verification.

**Step 3: Commit**

```bash
git add packages/cli2/elm-worker.ts
git commit -m "Add centralized Elm worker module with Bun-native CJS import"
```

---

### Task 2: Migrate cli.ts to use centralized worker

**Files:**
- Modify: `packages/cli2/cli.ts`

**Context:** `cli.ts` is the core module imported by most subcommands. It loads the Elm worker at line 21 via `createRequire`. It also has a `copyRedistributables` function (line 393) that uses `__dirname` to find `redistributable/Scala/` — but those Scala directories don't actually exist in the repo, so this function is dead code.

**Step 1: Replace createRequire with centralized worker import**

In `packages/cli2/cli.ts`:

Remove these lines:
```typescript
import { createRequire } from "module";
// ...
const require = createRequire(import.meta.url);
// ...
const worker = require("./../Morphir.Elm.CLI.cjs").Elm.Morphir.Elm.CLI.init();
```

Add:
```typescript
import { worker } from "./elm-worker.js";
```

The `worker` is already exported from `elm-worker.ts` and used throughout `cli.ts` (including being re-exported at line 567).

**Step 2: Remove dead `copyRedistributables` function**

The `copyRedistributables` function (lines 393-406) references `redistributable/Scala/sdk/src` and `redistributable/Scala/sdk/src-{version}` — these directories don't exist. The function is only called from `morphir-scala-gen.ts` which we'll fix in Task 4.

Remove the `copyRedistributables` function and the `copyRecursiveSync` function. Also remove `copyRedistributables` and `copyRecursiveSync` from the exports at the bottom of the file.

**Step 3: Verify the build still works**

Run: `bun run packages/cli2/morphir-bundle.ts make --help`

Expected: Commander help output for the `make` subcommand (this triggers import of `morphir-make.ts` → `cliAPI.ts` → `cli.ts`).

**Step 4: Run an integration test**

Run: `bun run packages/cli2/morphir-bundle.ts make -p tests-integration/reference-model`

Expected: "Done." with `morphir-ir.json` generated.

**Step 5: Commit**

```bash
git add packages/cli2/cli.ts
git commit -m "Migrate cli.ts to centralized Elm worker, remove dead Scala redistributable code"
```

---

### Task 3: Migrate morphir-scala-gen.ts

**Files:**
- Modify: `packages/cli2/morphir-scala-gen.ts`

**Context:** This file independently loads the Elm worker via `createRequire` at line 19. It also calls `cli.copyRedistributables()` (removed in Task 2) and `cli.findFilesToDelete()`.

**Step 1: Replace createRequire with centralized worker**

Remove:
```typescript
import { createRequire } from "module";
// ...
const require = createRequire(import.meta.url)
// ...
const worker = require("./../Morphir.Elm.CLI.cjs").Elm.Morphir.Elm.CLI.init();
```

Add:
```typescript
import { worker } from "./elm-worker.js";
```

**Step 2: Remove the `cli.copyRedistributables()` call**

The Scala redistributable directories don't exist. Remove the call to `cli.copyRedistributables(options, outputPath)`. This is dead code.

**Step 3: Verify**

Run: `bun run packages/cli2/morphir-bundle.ts scala-gen --help`

Expected: Commander help output.

**Step 4: Commit**

```bash
git add packages/cli2/morphir-scala-gen.ts
git commit -m "Migrate morphir-scala-gen.ts to centralized Elm worker"
```

---

### Task 4: Migrate morphir-snowpark-gen.ts with embedded redistributables

**Files:**
- Modify: `packages/cli2/morphir-snowpark-gen.ts`
- Create: `packages/cli2/redistributable/snowpark.ts`

**Context:** This file loads the Elm worker via `createRequire` at line 23. It also copies Snowpark redistributable files from `redistributable/Snowpark/` using `__dirname`-relative paths. Those files need to be embedded for the compiled binary.

The Snowpark redistributable files are:
- `redistributable/Snowpark/decorations/elm.json` (517 bytes)
- `redistributable/Snowpark/decorations/morphir.json` (73 bytes)
- `redistributable/Snowpark/decorations/src/SnowparkGenCustomization/Decorations.elm` (125 bytes)

**Step 1: Create embedded redistributable module**

```typescript
// packages/cli2/redistributable/snowpark.ts

/**
 * Snowpark redistributable files embedded as strings.
 * These are written to disk during snowpark-gen code generation.
 */

export const files: Record<string, string> = {
  "decorations/elm.json": await Bun.file(
    new URL("../../../redistributable/Snowpark/decorations/elm.json", import.meta.url)
  ).text(),
  "decorations/morphir.json": await Bun.file(
    new URL("../../../redistributable/Snowpark/decorations/morphir.json", import.meta.url)
  ).text(),
  "decorations/src/SnowparkGenCustomization/Decorations.elm": await Bun.file(
    new URL("../../../redistributable/Snowpark/decorations/src/SnowparkGenCustomization/Decorations.elm", import.meta.url)
  ).text(),
};
```

**Important note for the implementer:** If the `Bun.file` + `new URL` pattern doesn't inline at compile time (test this!), fall back to raw string literals:

```typescript
export const files: Record<string, string> = {
  "decorations/elm.json": `{PASTE CONTENTS HERE}`,
  "decorations/morphir.json": `{PASTE CONTENTS HERE}`,
  "decorations/src/SnowparkGenCustomization/Decorations.elm": `{PASTE CONTENTS HERE}`,
};
```

**Step 2: Replace createRequire and __dirname in morphir-snowpark-gen.ts**

Remove:
```typescript
import { fileURLToPath } from "url";
import { createRequire } from "module";
// ...
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ...
const require = createRequire(import.meta.url);
// ...
const worker = require("./../Morphir.Elm.CLI.cjs").Elm.Morphir.Elm.CLI.init();
```

Add:
```typescript
import { worker } from "./elm-worker.js";
import { files as snowparkRedistributables } from "./redistributable/snowpark.js";
```

Replace the `copyRedistributables` function body. Instead of `fs.cpSync`, write each embedded file:

```typescript
function copyRedistributables(outputPath: string) {
  for (const [relativePath, content] of Object.entries(snowparkRedistributables)) {
    const destPath = path.join(outputPath, relativePath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, content);
  }
}
```

**Step 3: Verify**

Run: `bun run packages/cli2/morphir-bundle.ts snowpark-gen --help`

Expected: Commander help output.

**Step 4: Commit**

```bash
git add packages/cli2/redistributable/snowpark.ts packages/cli2/morphir-snowpark-gen.ts
git commit -m "Migrate morphir-snowpark-gen.ts to centralized worker with embedded redistributables"
```

---

### Task 5: Migrate morphir-typescript-gen.ts with embedded redistributables

**Files:**
- Modify: `packages/cli2/morphir-typescript-gen.ts`
- Create: `packages/cli2/redistributable/typescript.ts`

**Context:** Same pattern as Task 4. Loads Elm worker via `createRequire`, copies `redistributable/TypeScript/` using `__dirname`. The TypeScript redistributable is one file: `morphir/internal/codecs.ts` (9.1KB).

**Step 1: Create embedded redistributable module**

```typescript
// packages/cli2/redistributable/typescript.ts

/**
 * TypeScript redistributable files embedded as strings.
 * Written to disk during typescript-gen code generation.
 */

export const files: Record<string, string> = {
  "morphir/internal/codecs.ts": await Bun.file(
    new URL("../../../redistributable/TypeScript/morphir/internal/codecs.ts", import.meta.url)
  ).text(),
};
```

Same fallback as Task 4 if `Bun.file` + `new URL` doesn't inline at compile time.

**Step 2: Replace createRequire and __dirname**

Remove `createRequire`, `fileURLToPath`, `__dirname` synthesis, and the worker require.

Add:
```typescript
import { worker } from "./elm-worker.js";
import { files as tsRedistributables } from "./redistributable/typescript.js";
```

Replace the `copyFiles` / redistributable copying logic with:

```typescript
function copyRedistributables(outputPath: string) {
  for (const [relativePath, content] of Object.entries(tsRedistributables)) {
    const destPath = path.join(outputPath, relativePath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, content);
  }
}
```

**Step 3: Verify**

Run: `bun run packages/cli2/morphir-bundle.ts typescript-gen --help`

Expected: Commander help output.

**Step 4: Commit**

```bash
git add packages/cli2/redistributable/typescript.ts packages/cli2/morphir-typescript-gen.ts
git commit -m "Migrate morphir-typescript-gen.ts to centralized worker with embedded redistributables"
```

---

### Task 6: Migrate morphir-generate-test-data.ts

**Files:**
- Modify: `packages/cli2/morphir-generate-test-data.ts`
- Modify: `packages/cli2/elm-worker.ts`

**Context:** This file uses `createRequire` to load `Morphir.Elm.Generator.cjs` — a **different** Elm module from the CLI worker. The Generator.elm source exists but currently fails to compile (missing `Morphir.Elm.Generator.API` and `Morphir.Elm.Generator.ValueGenerators` modules). This is a pre-existing issue.

**Step 1: Add Generator worker to elm-worker.ts (conditional)**

Since Generator.cjs may not exist (compilation is broken), make the import lazy:

```typescript
// packages/cli2/elm-worker.ts

// @ts-ignore — Elm-compiled CJS module
import ElmCLI from "./Morphir.Elm.CLI.cjs";

export const worker = ElmCLI.Elm.Morphir.Elm.CLI.init();

/**
 * Generator worker — loaded lazily because Generator.elm compilation
 * is currently broken (missing dependent modules).
 */
export async function getGeneratorWorker() {
  // @ts-ignore — Elm-compiled CJS module
  const ElmGenerator = await import("./Morphir.Elm.Generator.cjs");
  return ElmGenerator.default.Elm.Morphir.Elm.Generator.init();
}
```

**Step 2: Replace createRequire in morphir-generate-test-data.ts**

Remove:
```typescript
import { createRequire } from "module";
// ...
const require = createRequire(import.meta.url);
// ...
const worker = require('./../Morphir.Elm.Generator.cjs').Elm.Morphir.Elm.Generator.init()
```

Add:
```typescript
import { getGeneratorWorker } from "./elm-worker.js";
const worker = await getGeneratorWorker();
```

**Step 3: Commit**

```bash
git add packages/cli2/elm-worker.ts packages/cli2/morphir-generate-test-data.ts
git commit -m "Migrate morphir-generate-test-data.ts to centralized worker"
```

---

### Task 7: Migrate morphir-mcp.ts

**Files:**
- Modify: `packages/cli2/morphir-mcp.ts`

**Context:** Uses `createRequire` only for loading `package.json`. Does NOT load the Elm worker — it shells out to `elm make` and `morphir make` as child processes.

**Step 1: Replace createRequire with static import**

Remove:
```typescript
import { fileURLToPath } from "url";
import { createRequire } from "module";
// ...
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ...
const require = createRequire(import.meta.url);
// ...
const packageJson = require(path.join(__dirname, "../../../package.json"));
```

Add:
```typescript
import packageJson from "../../package.json";
```

Note: the path is `../../package.json` because `packages/cli2/` is 2 levels below root.

**Step 2: Verify**

Run: `bun run packages/cli2/morphir-bundle.ts mcp --help`

Expected: Commander help output.

**Step 3: Commit**

```bash
git add packages/cli2/morphir-mcp.ts
git commit -m "Migrate morphir-mcp.ts to static package.json import"
```

---

### Task 8: Replace entry point

**Files:**
- Delete: `packages/cli2/morphir.ts` (old external-command entry point)
- Rename: `packages/cli2/morphir-bundle.ts` → `packages/cli2/morphir.ts`
- Modify: `.mise/tasks/build/bundle.ts`
- Modify: `.mise/tasks/build/cli-binaries.ts`

**Step 1: Replace the entry point**

```bash
rm packages/cli2/morphir.ts
mv packages/cli2/morphir-bundle.ts packages/cli2/morphir.ts
```

**Step 2: Update build tasks**

In `.mise/tasks/build/bundle.ts`, update the CLI v2 line:
```typescript
// Was: join(PATHS.cli2, "lib", "morphir-bundle.js")
// Now: join(PATHS.cli2, "lib", "morphir.js")
$`bun build ${join(PATHS.cli2, "lib", "morphir.js")} --compile --minify --outfile ${join(PATHS.dist, "morphir/morphir")}`,
```

In `.mise/tasks/build/cli-binaries.ts`, update the entry point:
```typescript
// Was: join(PATHS.cli2, "lib", "morphir-bundle.js")
// Now: join(PATHS.cli2, "lib", "morphir.js")
const ENTRY_POINT = join(PATHS.cli2, "lib", "morphir.js");
```

**Step 3: Verify dev mode**

Run: `bun run packages/cli2/morphir.ts --help`

Expected: Help output with all commands listed.

Run: `bun run packages/cli2/morphir.ts make -p tests-integration/reference-model`

Expected: "Done."

**Step 4: Commit**

```bash
git add packages/cli2/morphir.ts .mise/tasks/build/bundle.ts .mise/tasks/build/cli-binaries.ts
git commit -m "Replace entry point: morphir-bundle.ts becomes morphir.ts"
```

---

### Task 9: Update build:cli2 to remove external plugin

**Files:**
- Modify: `.mise/tasks/build/cli2.ts`

**Context:** The `elmExternalPlugin` was needed because the old code used `createRequire` with relative paths that changed between source and `lib/` output. Now that we use `import` from `elm-worker.ts`, the bundler can resolve the `.cjs` import normally. We still need to tell the bundler how to handle the `.cjs` file — but now we want it bundled, not externalized.

**Step 1: Remove the elmExternalPlugin**

Delete the entire plugin definition (lines 9-22):
```typescript
const elmExternalPlugin: BunPlugin = {
  name: "elm-external",
  setup(build) {
    build.onResolve({ filter: /Morphir\.Elm\.(CLI|Generator)\.cjs/ }, (args) => {
      return {
        path: args.path,
        external: true,
      };
    });
  },
};
```

And remove `plugins: [elmExternalPlugin]` from the `Bun.build()` call. Also remove the `import type { BunPlugin } from "bun";` import.

**Step 2: Rebuild**

```bash
mise run build:cli2
```

Expected: Build succeeds. The Elm `.cjs` module is now bundled into the `lib/` output files that reference it.

**Step 3: Verify dev mode still works**

Run: `bun run packages/cli2/morphir.ts make -p tests-integration/reference-model`

Expected: "Done."

**Step 4: Commit**

```bash
git add .mise/tasks/build/cli2.ts
git commit -m "Remove elmExternalPlugin — Elm .cjs now imported natively via elm-worker.ts"
```

---

### Task 10: Build and test compiled binary

**Files:** None (testing only)

**Step 1: Build CLI v2**

```bash
mise run build:cli2
```

**Step 2: Compile the binary**

```bash
bun build packages/cli2/lib/morphir.js --compile --minify --outfile dist/morphir
```

**Step 3: Test --version and --help**

```bash
./dist/morphir --version
./dist/morphir --help
```

Expected: Version `2.100.0` and help text with all commands.

**Step 4: Test morphir make against integration projects**

```bash
# Simple project
./dist/morphir make -p tests-integration/reference-model
echo "Exit code: $?"

# Another project
./dist/morphir make -p tests-integration/cli/test-data/rentals
echo "Exit code: $?"

# Project with dependencies
./dist/morphir make -p tests-integration/json-schema/model/attributemodel
echo "Exit code: $?"
```

Expected: All exit with code 0, each producing `morphir-ir.json`.

**Step 5: Test cross-compilation**

```bash
mise run build:cli-binaries
ls -la dist/binaries/
```

Expected: Four binaries:
- `morphir-linux-amd64`
- `morphir-linux-arm64`
- `morphir-darwin-arm64`
- `morphir-windows-amd64.exe`

**Step 6: Test the native binary directly**

Run the binary for the current platform against a project:

```bash
# On Linux ARM64:
./dist/binaries/morphir-linux-arm64 make -p tests-integration/reference-model
echo "Exit code: $?"
```

Expected: Exit code 0, "Done." output.

**Step 7: Clean up generated files**

```bash
rm -f tests-integration/reference-model/morphir-ir.json
rm -f tests-integration/reference-model/morphir-hashes.json
rm -f tests-integration/cli/test-data/rentals/morphir-ir.json
rm -f tests-integration/cli/test-data/rentals/morphir-hashes.json
rm -f tests-integration/json-schema/model/attributemodel/morphir-ir.json
rm -f tests-integration/json-schema/model/attributemodel/morphir-hashes.json
```

**Step 8: Commit if any fixes were needed**

```bash
git add -A
git commit -m "Fix issues found during compiled binary testing"
```
