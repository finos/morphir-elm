#!/usr/bin/env bun
//MISE description="Build the morphir-visualize Lit components bundle"
//MISE sources=["morphir-visualize/src/**/*.ts", "morphir-visualize/web/*"]
//MISE outputs=["morphir-visualize/dist/morphir-visualize.js", "morphir-visualize/dist/index.html"]

import { log, ROOT_DIR, join, mkdir, rm, copyFile } from "../_lib.ts";

const root = join(ROOT_DIR, "morphir-visualize");
const dist = join(root, "dist");

log("build:visualize", "Bundling Lit components...");
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const result = await Bun.build({
  entrypoints: [join(root, "src", "index.ts")],
  outdir: dist,
  naming: "morphir-visualize.js",
  target: "browser",
  format: "esm",
  minify: true,
});

if (!result.success) {
  for (const message of result.logs) console.error(message);
  throw new Error("morphir-visualize build failed");
}

await copyFile(join(root, "web", "index.html"), join(dist, "index.html"));
log("build:visualize", "Done");
