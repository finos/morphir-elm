#!/usr/bin/env bun
//MISE description="Run all build tasks (orchestrates elm work serially to avoid Windows races)"

import { exec, log, ROOT_DIR } from "./_lib.ts";

// elm make is not concurrent-write-safe on Windows: multiple processes race on
// ~/.elm/<package>/artifacts.dat and per-project elm-stuff/, producing
// "PROBLEM BUILDING DEPENDENCIES" failures.
//
// Any task that invokes `elm` — directly (build:cli, build:cli2, build:dev-server,
// build:try-morphir, build:check-elm-docs) or indirectly via node-elm-compiler in
// cli/morphir-elm.js (build:morphir-ts) — must run serially. Non-elm tasks
// (build:treeview is webpack-only; build:components just concats JS) can run in
// parallel.
//
// mise reads `//MISE depends=` headers but its scheduler parallelizes any tasks
// whose deps are satisfied rather than enforcing strict ordering, so we orchestrate
// explicitly here. `--skip-deps` prevents the subtasks from re-running their own
// declared deps (which would otherwise repeatedly trigger build:cli, etc.).
const run = (task: string) =>
  exec("mise", ["run", "--skip-deps", task], { cwd: ROOT_DIR });

await Promise.all([
  // Serial chain — every task here invokes elm (directly or indirectly).
  (async () => {
    await run("build:check-elm-docs");
    await run("build:cli");
    await run("build:cli2");
    await run("build:dev-server");
    await run("build:try-morphir");
    await run("build:components"); // concat: depends on dev-server output
    await run("build:morphir-ts"); // invokes elm via cli/morphir-elm.js
  })(),
  // Non-elm: webpack only, safe to run alongside the elm chain.
  run("build:treeview"),
]);

log("build", "All build tasks completed");
