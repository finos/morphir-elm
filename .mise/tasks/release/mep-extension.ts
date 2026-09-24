#!/usr/bin/env bun
//MISE description="Build, package and describe the Morphir Elm MEP extension for every release platform"
//MISE depends=["build:cli2"]

// Usage: mise run release:mep-extension -- <tag> [git-commit]
//
// Writes dist/mep-extension-release/ with one archive and one .sha256 file per platform, and the
// version-1 release descriptor, plus bundle/ with raw executables, checksums and release.json.
// Bun cross-compiles every target, so one runner builds all six. The Elm
// compile that build:cli2 does produces plain JavaScript, which is the same for every platform.
import { createHash } from "node:crypto";

import extensionMetadata from "../../../cli2/mep/extension.json";
import {
  RELEASE_TARGETS,
  assetName,
  checksumLine,
  executableName,
  processBundleDescriptor,
  type ProcessBundleArtifact,
  parseReleaseTag,
  releaseDescriptor,
  type ReleaseArtifact,
} from "../../../cli2/mep/release";
import {
  $,
  copyFile,
  join,
  log,
  mkdir,
  PATHS,
  readFile,
  rm,
  ROOT_DIR,
  writeFile,
} from "../_lib.ts";

const TASK = "release:mep-extension";
const [tag, commitArgument] = process.argv.slice(2);
if (tag === undefined) {
  console.error("usage: mise run release:mep-extension -- <tag> [git-commit]");
  process.exit(2);
}

const version = parseReleaseTag(tag, extensionMetadata);
const gitCommit =
  commitArgument ?? (await $`git -C ${ROOT_DIR} rev-parse HEAD`.text()).trim();
const output = join(PATHS.dist, "mep-extension-release");
const bundle = join(output, "bundle");
const staging = join(output, ".staging");
await rm(output, { recursive: true, force: true });
await mkdir(staging, { recursive: true });
await mkdir(bundle, { recursive: true });

const artifacts: ReleaseArtifact[] = [];
const bundleArtifacts: ProcessBundleArtifact[] = [];
for (const target of RELEASE_TARGETS) {
  const directory = join(staging, target.platform);
  await mkdir(directory, { recursive: true });
  const executable = join(directory, target.executable);
  log(TASK, `Compiling ${target.platform}...`);
  await $`bun build ${join(
    ROOT_DIR,
    "cli2/mep-extension.ts"
  )} --compile --minify --target=${
    target.bunTarget
  } --outfile ${executable}`.quiet();

  const filename = executableName(version, target);
  const rawPath = join(bundle, filename);
  await copyFile(executable, rawPath);
  const rawSha256 = createHash("sha256")
    .update(await readFile(rawPath))
    .digest("hex");
  await writeFile(`${rawPath}.sha256`, checksumLine(rawSha256, filename));
  bundleArtifacts.push({
    platform: target.platform,
    filename,
    sha256: rawSha256,
  });

  const asset = assetName(version, target);
  const assetPath = join(output, asset);
  if (target.archive === "zip") {
    await $`zip -j -q ${assetPath} ${executable}`;
  } else {
    await $`tar -czf ${assetPath} -C ${directory} ${target.executable}`;
  }
  const sha256 = createHash("sha256")
    .update(await readFile(assetPath))
    .digest("hex");
  await writeFile(`${assetPath}.sha256`, checksumLine(sha256, asset));
  artifacts.push({ platform: target.platform, artifact: asset, sha256 });
}

await rm(staging, { recursive: true, force: true });
const descriptorPath = join(
  output,
  `morphir-elm-extension-${version}.release.json`
);
await writeFile(
  descriptorPath,
  `${JSON.stringify(
    releaseDescriptor(extensionMetadata, gitCommit, artifacts),
    null,
    2
  )}\n`
);
log(TASK, `Wrote ${artifacts.length} archives and ${descriptorPath}`);

await writeFile(
  join(bundle, "release.json"),
  `${JSON.stringify(processBundleDescriptor(bundleArtifacts), null, 2)}\n`
);
log(
  TASK,
  `Wrote process bundle with ${bundleArtifacts.length} executables to ${bundle}`
);
