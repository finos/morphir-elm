#!/usr/bin/env bun
//MISE description="Package, publish and verify the finos/morphir-elm module on mooncakes (MISE_ENV=moonbit)"

// Usage: MISE_ENV=moonbit mise run release:elm-extension-mooncakes -- package <tag> <git-commit>
//        MISE_ENV=moonbit mise run release:elm-extension-mooncakes -- publish <version>   (needs MOONCAKES_TOKEN)
//        MISE_ENV=moonbit mise run release:elm-extension-mooncakes -- verify <version>
//
// package: packages moonbit/ of the tagged commit, checks the archive entries, tests the unpacked archive alone on
//          wasm, wasm-gc, js and native, and writes the zip and its .sha256 file to dist/elm-extension-mooncakes/.
// publish: stops unless mooncakes reports that the version does not exist, checks that the token is the finos
//          account, and runs `moon publish` once from the unpacked archive. The token goes only to the registry.
// verify:  makes a new module that imports the published version and runs its tests on the four targets.
// Each step uses a new Moon home and MOON_WORK=off, so no cache, login or workspace of the machine is an input.
// See openspec/specs/elm-extension/release.
import { createHash } from "node:crypto";
import { chmod, mkdtemp, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { $, copyFile, existsSync, join, log, mkdir, PATHS, readFile, rm, ROOT_DIR, writeFile } from "../_lib.ts";
import { checksumLine, moduleVersion } from "../../../moonbit/tooling/module.ts";
import {
  archiveName,
  checkArchiveEntries,
  consumerFiles,
  credentialsJson,
  indexHasVersion,
  isFinosAccount,
  MODULE_NAME,
  redact,
  REGISTRY,
  registryState,
} from "../../../moonbit/tooling/mooncakes.ts";
import { isSemVer, parseReleaseTag } from "../../../moonbit/tooling/release.ts";

const TASK = "release:elm-extension-mooncakes";
const USAGE = [
  `usage: MISE_ENV=moonbit mise run ${TASK} -- package <tag> <git-commit>`,
  `       MISE_ENV=moonbit mise run ${TASK} -- publish <version>`,
  `       MISE_ENV=moonbit mise run ${TASK} -- verify <version>`,
].join("\n");
const TARGETS = ["wasm", "wasm-gc", "js", "native"];
const OUTPUT = join(PATHS.dist, "elm-extension-mooncakes");
const INDEX_WAITS_SECONDS = [1, 2, 4, 8, 16, 32];

/** The pinned toolchain that mise.moonbit.toml installs; its MOON_HOME holds bin, lib and include. */
function toolchain(): string {
  const home = process.env.MOON_HOME;
  if (home === undefined || !existsSync(join(home, "bin", "moon"))) {
    throw new Error(`${TASK}: MOON_HOME must be the pinned MoonBit toolchain. Run it with MISE_ENV=moonbit`);
  }
  return home;
}

/** A new Moon home with only the toolchain's bin, lib, include and share, and an empty registry and cache. */
async function newHome(directory: string): Promise<string> {
  const source = toolchain();
  await mkdir(directory, { recursive: true, mode: 0o700 });
  for (const part of ["bin", "lib", "include", "share"]) {
    if (existsSync(join(source, part))) {
      await symlink(join(source, part), join(directory, part));
    }
  }
  return directory;
}

/** The environment of a moon child: the given home, no workspace discovery, and never the mooncakes token. */
function moonEnvironment(home: string): Record<string, string> {
  const environment: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && key !== "MOONCAKES_TOKEN") environment[key] = value;
  }
  return { ...environment, MOON_HOME: home, MOON_WORK: "off" };
}

/** Runs moon with the given home and no workspace discovery. The output goes to this process's output. */
async function moon(home: string, cwd: string, args: readonly string[]): Promise<void> {
  const proc = Bun.spawn(["moon", ...args], {
    cwd,
    env: moonEnvironment(home),
    stdio: ["ignore", "inherit", "inherit"],
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`${TASK}: moon ${args.join(" ")} failed in ${cwd} (exit code ${exitCode})`);
  }
}

async function sha256(file: string): Promise<string> {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

async function withWorkspace<T>(run: (work: string) => Promise<T>): Promise<T> {
  const work = await mkdtemp(join(tmpdir(), "morphir-elm-mooncakes-"));
  try {
    return await run(work);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

function requireVersion(version: string | undefined): string {
  if (version === undefined || !isSemVer(version)) {
    throw new Error(`${TASK}: '${String(version)}' is not a SemVer version\n${USAGE}`);
  }
  return version;
}

async function packageArchive(tag: string, commit: string): Promise<void> {
  const version = parseReleaseTag(tag, moduleVersion(await readFile(join(ROOT_DIR, "moonbit", "moon.mod"), "utf8")));
  const head = (await $`git -C ${ROOT_DIR} rev-parse HEAD`.quiet().text()).trim();
  if (!/^[0-9a-f]{40}$/.test(commit) || commit !== head) {
    throw new Error(`${TASK}: commit ${commit} must be the full checked-out commit ${head}`);
  }
  const name = archiveName(version);
  await withWorkspace(async (work) => {
    // A git snapshot of the tagged commit: untracked files of the checkout cannot enter the archive.
    const snapshot = join(work, "snapshot");
    await mkdir(snapshot);
    await $`git -C ${ROOT_DIR} archive --format=tar ${commit} moonbit | tar -x -C ${snapshot}`.quiet();
    const module = join(snapshot, "moonbit");
    const packHome = await newHome(join(work, "package-home"));
    await moon(packHome, module, ["update"]);
    await moon(packHome, module, ["package"]);
    const zip = join(module, "_build", "publish", name);
    if (!existsSync(zip)) {
      throw new Error(`${TASK}: moon package did not write ${name}`);
    }

    const entries = (await $`unzip -Z1 ${zip}`.quiet().text())
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.endsWith("/"));
    checkArchiveEntries(entries);
    log(TASK, `${name} has ${entries.length} files and only the module`);

    // The archive alone: a new Moon home and no workspace, so every import must come from mooncakes.
    const archive = join(work, "archive");
    await mkdir(archive);
    await $`unzip -q ${zip} -d ${archive}`.quiet();
    const testHome = await newHome(join(work, "test-home"));
    await moon(testHome, archive, ["update"]);
    for (const target of TARGETS) {
      await moon(testHome, archive, ["test", "--target", target]);
    }

    await rm(OUTPUT, { recursive: true, force: true });
    await mkdir(OUTPUT, { recursive: true });
    await copyFile(zip, join(OUTPUT, name));
    const digest = await sha256(join(OUTPUT, name));
    await writeFile(join(OUTPUT, `${name}.sha256`), checksumLine(digest, name));
    log(TASK, `${join(OUTPUT, name)} ${digest}: tests pass on ${TARGETS.join(", ")}`);
  });
}

async function registryAnswer(version: string): Promise<number> {
  try {
    const response = await fetch(`${REGISTRY}/api/v0/manifest/${MODULE_NAME}@${version}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
    return response.status;
  } catch {
    return 0;
  }
}

/** Never renders the request or its exception: the token is in the URL, as in moon's own login check. */
async function tokenIsFinos(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${REGISTRY}/api/v0/api_token/check?token=${encodeURIComponent(token)}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    const body: unknown = await response.json().catch(() => null);
    return isFinosAccount(response.status, body);
  } catch {
    return false;
  }
}

async function publish(version: string): Promise<void> {
  const token = process.env.MOONCAKES_TOKEN ?? "";
  const credentials = credentialsJson(token);

  const status = await registryAnswer(version);
  const state = registryState(status);
  if (state === "present") {
    throw new Error(
      `${TASK}: ${MODULE_NAME}@${version} is already on mooncakes. A published version cannot change; release a new version`
    );
  }
  if (state === "unknown") {
    throw new Error(`${TASK}: mooncakes did not say whether ${MODULE_NAME}@${version} exists (status ${status})`);
  }

  const name = archiveName(version);
  const zip = join(OUTPUT, name);
  const expected = existsSync(`${zip}.sha256`) ? await readFile(`${zip}.sha256`, "utf8") : "";
  if (!existsSync(zip) || expected !== checksumLine(await sha256(zip), name)) {
    throw new Error(`${TASK}: ${zip} is missing or does not match ${name}.sha256. Run package first`);
  }

  await withWorkspace(async (work) => {
    const archive = join(work, "archive");
    await mkdir(archive);
    await $`unzip -q ${zip} -d ${archive}`.quiet();
    const home = await newHome(join(work, "publish-home"));
    await moon(home, archive, ["update"]);

    if (!(await tokenIsFinos(token))) {
      throw new Error(`${TASK}: MOONCAKES_TOKEN does not authenticate as the mooncakes account finos`);
    }
    const credentialFile = join(home, "credentials.json");
    await writeFile(credentialFile, credentials, { mode: 0o600, flag: "wx" });
    await chmod(credentialFile, 0o600);
    try {
      // One upload, no retry. The output is shown with the token removed.
      const proc = Bun.spawn(["moon", "publish"], {
        cwd: archive,
        env: moonEnvironment(home),
        stdio: ["ignore", "pipe", "pipe"],
      });
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]);
      process.stdout.write(redact(stdout, token));
      process.stderr.write(redact(stderr, token));
      if (exitCode !== 0) {
        throw new Error(`${TASK}: moon publish failed (exit code ${exitCode}). It is not retried`);
      }
    } finally {
      await rm(credentialFile, { force: true });
    }
    log(TASK, `Published ${MODULE_NAME}@${version}`);
  });
}

async function verify(version: string): Promise<void> {
  await withWorkspace(async (work) => {
    const consumer = join(work, "consumer");
    await mkdir(consumer);
    for (const [file, content] of Object.entries(consumerFiles(version))) {
      await writeFile(join(consumer, file), content);
    }
    const home = await newHome(join(work, "consumer-home"));
    const index = join(home, "registry", "index", "user", ...MODULE_NAME.split("/")) + ".index";
    for (let attempt = 0; ; attempt++) {
      await moon(home, consumer, ["update"]);
      if (existsSync(index) && indexHasVersion(await readFile(index, "utf8"), version)) break;
      if (attempt >= INDEX_WAITS_SECONDS.length) {
        throw new Error(`${TASK}: the mooncakes index does not list ${MODULE_NAME}@${version}`);
      }
      log(TASK, `The index does not list ${version} yet; waiting ${INDEX_WAITS_SECONDS[attempt]} s`);
      await Bun.sleep(INDEX_WAITS_SECONDS[attempt] * 1000);
    }
    for (const target of TARGETS) {
      await moon(home, consumer, ["test", "--target", target]);
    }
    log(TASK, `A new consumer of ${MODULE_NAME}@${version} passes its tests on ${TARGETS.join(", ")}`);
  });
}

const [command, ...rest] = process.argv.slice(2);
if (command === "--help" || command === "-h") {
  console.log(USAGE);
  process.exit(0);
}
if (command === "package" && rest.length === 2) {
  await packageArchive(rest[0], rest[1]);
} else if (command === "publish" && rest.length === 1) {
  await publish(requireVersion(rest[0]));
} else if (command === "verify" && rest.length === 1) {
  await verify(requireVersion(rest[0]));
} else {
  console.error(USAGE);
  process.exit(2);
}
